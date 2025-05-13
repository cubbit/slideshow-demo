import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { IncomingForm, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from '@aws-sdk/lib-storage';
import winston from 'winston';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import retry from 'async-retry';
import { NextResponse } from 'next/server';
import { fileTypeFromBuffer } from 'file-type'; // Add this package for content validation
import { Readable } from 'stream';
import http from 'http';

// Environment variables with strong typing and validation
const ENV = {
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
    NEXT_PUBLIC_S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || '',
    S3_REGION: process.env.S3_REGION || '',
    NEXT_PUBLIC_S3_ENDPOINT: process.env.NEXT_PUBLIC_S3_ENDPOINT || '',
    MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '41943040', 10), // 40MB default
    MULTIPART_THRESHOLD: parseInt(process.env.MULTIPART_THRESHOLD || '5242880', 10), // 5MB default
    RATE_LIMIT_POINTS: parseInt(process.env.RATE_LIMIT_POINTS || '10', 10),
    RATE_LIMIT_DURATION: parseInt(process.env.RATE_LIMIT_DURATION || '60', 10),
    RETRY_COUNT: parseInt(process.env.RETRY_COUNT || '3', 10),
    RETRY_DELAY_MS: parseInt(process.env.RETRY_DELAY_MS || '500', 10),
    CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    UPLOAD_PATH_PREFIX: process.env.UPLOAD_PATH_PREFIX || '',
};

// Validate required environment variables early
function validateEnv() {
    const requiredVars = [
        'S3_ACCESS_KEY_ID',
        'S3_SECRET_ACCESS_KEY',
        'NEXT_PUBLIC_S3_BUCKET_NAME',
        'S3_REGION',
        'NEXT_PUBLIC_S3_ENDPOINT',
    ];

    const missing = requiredVars.filter(varName => !ENV[varName as keyof typeof ENV]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

// Allowed image MIME types with extensions
const ALLOWED_MIME_TYPES = new Map([
    ['image/jpeg', ['.jpg', '.jpeg']],
    ['image/png', ['.png']],
    ['image/gif', ['.gif']],
    ['image/webp', ['.webp']],
    ['image/svg+xml', ['.svg']],
    ['image/bmp', ['.bmp']],
    ['image/tiff', ['.tiff', '.tif']],
    ['image/heic', ['.heic']],
    ['image/heif', ['.heif']],
]);

// Configure Winston logger with structured logging
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    defaultMeta: { service: 'image-upload-api' },
    transports: [new winston.transports.Console()],
});

// Helper: Convert a Web ReadableStream to a Node.js Buffer.
async function bufferFromReadable(readable: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = readable.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
        const { done: doneReading, value } = await reader.read();
        done = doneReading;

        if (value) {
            chunks.push(value);
        }
    }

    return Buffer.concat(chunks);
}

// Helper: Create a minimal Node.js IncomingMessage-like object from a Request.
function createNodeRequest(request: Request, bodyBuffer: Buffer): http.IncomingMessage {
    const stream = new Readable();
    stream.push(bodyBuffer);
    stream.push(null);

    const nodeReq = stream as unknown as http.IncomingMessage;
    nodeReq.headers = Object.fromEntries(request.headers.entries());
    nodeReq.method = request.method;
    nodeReq.url = request.url;

    return nodeReq;
}

// Create an in-memory rate limiter.
const rateLimiter = new RateLimiterMemory({
    points: ENV.RATE_LIMIT_POINTS,
    duration: ENV.RATE_LIMIT_DURATION,
});

// Create a global S3 client instance (lazy initialization)
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (!s3Client) {
        s3Client = new S3Client({
            region: ENV.S3_REGION,
            credentials: {
                accessKeyId: ENV.S3_ACCESS_KEY_ID,
                secretAccessKey: ENV.S3_SECRET_ACCESS_KEY,
            },
            endpoint: ENV.NEXT_PUBLIC_S3_ENDPOINT,
            forcePathStyle: true,
        });
    }
    return s3Client;
}

// Check content type by examining file contents
async function validateFileContents(filePath: string, mimeType: string): Promise<boolean> {
    try {
        // Read a sample of the file to check its type
        const fileHandle = await fs.promises.open(filePath, 'r');
        const buffer = Buffer.alloc(4100); // Read first 4100 bytes for file type detection
        await fileHandle.read(buffer, 0, 4100, 0);
        await fileHandle.close();

        // Detect file type from buffer
        const fileTypeResult = await fileTypeFromBuffer(buffer);

        if (!fileTypeResult) {
            // Special case for SVG files which might not be detected by file-type
            if (mimeType === 'image/svg+xml') {
                const svgHeader = buffer.toString('utf8', 0, 100).toLowerCase();
                return svgHeader.includes('<svg') && svgHeader.includes('xmlns');
            }
            return false;
        }

        // Check if the detected mime type matches the claimed type
        return fileTypeResult.mime === mimeType;
    } catch (error) {
        logger.error('Error validating file contents', { error });
        return false;
    }
}

// Generate a secure, deterministically random path for the file
function generateSecureFilePath(originalFileName: string): string {
    // Create folder structure based on today's date
    const today = new Date();
    const folderPath = `${ENV.UPLOAD_PATH_PREFIX}${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    // Generate a UUID for the file name
    const fileName = `${uuidv4()}${path.extname(originalFileName || '')}`;

    return `${folderPath}/${fileName}`;
}

// Helper function for standardized error responses
function createErrorResponse(status: number, message: string, error?: string) {
    const errorId = crypto.randomUUID();
    logger.error(message, { errorId, error });

    return NextResponse.json(
        { message, error, errorId },
        { status, headers: { 'Cache-Control': 'no-store' } }
    );
}

export async function POST(request: Request) {
    const requestId = crypto.randomUUID();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Add context to all logs for this request
    const requestLogger = logger.child({ requestId, ip, userAgent });

    try {
        // Validate environment before proceeding
        validateEnv();

        // Check CORS if configured
        const origin = request.headers.get('origin');
        if (ENV.CORS_ORIGINS.length > 0 && origin) {
            if (!ENV.CORS_ORIGINS.includes(origin) && !ENV.CORS_ORIGINS.includes('*')) {
                return createErrorResponse(403, 'CORS not allowed', 'Origin not permitted');
            }
        }

        // Apply rate limiting
        try {
            await rateLimiter.consume(ip);
        } catch (rejRes: unknown) {
            const rlRes = rejRes as RateLimiterRes;
            const retrySecs = Math.round(rlRes.msBeforeNext / 1000) || 1;

            requestLogger.warn('Rate limit exceeded', { retryAfter: retrySecs });

            return NextResponse.json(
                { message: 'Too Many Requests', retryAfter: retrySecs },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retrySecs),
                        'Cache-Control': 'no-store',
                    },
                }
            );
        }

        // Check if the request has a body
        if (!request.body) {
            return createErrorResponse(400, 'No request body provided');
        }

        // Convert the Request body to a Buffer
        const bodyBuffer = await bufferFromReadable(request.body);

        // Create a Node-compatible request for formidable
        const nodeReq = createNodeRequest(request, bodyBuffer);

        // Parse the multipart form data
        requestLogger.debug('Parsing form data');
        const form = new IncomingForm({ maxFileSize: ENV.MAX_FILE_SIZE });

        const { files } = await new Promise<{ files: Files }>((resolve, reject) => {
            form.parse(nodeReq, (err, _fields, files) => {
                if (err) reject(err);
                else resolve({ files });
            });
        }).catch((err: unknown) => {
            if (err instanceof Error && err.message.includes('maxFileSize')) {
                throw new Error(
                    `File too large. Maximum size is ${ENV.MAX_FILE_SIZE / (1024 * 1024)}MB.`
                );
            }
            if (err instanceof Error) {
                throw new Error(`Error parsing form data: ${err.message}`);
            }
            throw new Error('Unknown error parsing form data');
        });

        // Extract the uploaded file
        const fileField = files.file;
        const file = Array.isArray(fileField) ? fileField[0] : fileField;

        if (!file) {
            return createErrorResponse(400, 'No file uploaded');
        }

        // Validate MIME type
        const reportedMimeType = file.mimetype || '';
        if (!ALLOWED_MIME_TYPES.has(reportedMimeType)) {
            return createErrorResponse(
                415,
                'Invalid file type. Only images are allowed.',
                `File type ${reportedMimeType} is not supported.`
            );
        }

        // Validate file extension against MIME type
        const fileExtension = path.extname(file.originalFilename || '').toLowerCase();
        const allowedExtensions = ALLOWED_MIME_TYPES.get(reportedMimeType) || [];

        if (!allowedExtensions.includes(fileExtension)) {
            return createErrorResponse(
                415,
                "File extension doesn't match content type",
                `Extension ${fileExtension} is not valid for type ${reportedMimeType}`
            );
        }

        // Deep validation of file contents
        const isValidContent = await validateFileContents(file.filepath, reportedMimeType);
        if (!isValidContent) {
            // Clean up the temporary file
            await fs.promises.unlink(file.filepath).catch(() => {});

            return createErrorResponse(
                415,
                "File content doesn't match the declared type",
                'Security validation failed'
            );
        }

        try {
            // Generate secure file path
            const fullPath = generateSecureFilePath(file.originalFilename || '');

            requestLogger.info('Starting file upload', {
                fileName: path.basename(fullPath),
                fileSize: file.size,
                mimeType: reportedMimeType,
            });

            // Wrap the S3 upload in retry logic
            await retry(
                async _bail => {
                    // Create a new file stream for each retry attempt
                    const fileStream = fs.createReadStream(file.filepath);

                    const uploadParams: PutObjectCommandInput = {
                        Bucket: ENV.NEXT_PUBLIC_S3_BUCKET_NAME,
                        Key: fullPath,
                        Body: fileStream,
                        ContentType: reportedMimeType,
                        ContentDisposition: `inline; filename="${encodeURIComponent(
                            file.originalFilename || path.basename(fullPath)
                        )}"`,
                        ACL: 'public-read', // Ensure the file is publicly readable
                        Metadata: {
                            'original-filename': encodeURIComponent(file.originalFilename || ''),
                            'upload-date': new Date().toISOString(),
                            'content-type': reportedMimeType,
                        },
                    };

                    const client = getS3Client();

                    if (file.size > ENV.MULTIPART_THRESHOLD) {
                        requestLogger.info('Using multipart upload', {
                            fileSize: file.size,
                            threshold: ENV.MULTIPART_THRESHOLD,
                        });

                        const multipartUpload = new Upload({
                            client,
                            params: uploadParams,
                            leavePartsOnError: false,
                            partSize: 10 * 1024 * 1024, // 10MB part size
                        });

                        await multipartUpload.done();
                    } else {
                        requestLogger.info('Using single-part upload', {
                            fileSize: file.size,
                        });

                        await client.send(new PutObjectCommand(uploadParams));
                    }
                },
                {
                    retries: ENV.RETRY_COUNT,
                    minTimeout: ENV.RETRY_DELAY_MS,
                    onRetry: (error, attempt) => {
                        requestLogger.warn(`Retry attempt ${attempt} after error`, { error });
                    },
                }
            );

            // Clean up the temporary file
            await fs.promises.unlink(file.filepath).catch(error => {
                requestLogger.warn('Failed to clean up temporary file', { error });
            });

            const fileUrl = `${ENV.NEXT_PUBLIC_S3_ENDPOINT}/${ENV.NEXT_PUBLIC_S3_BUCKET_NAME}/${fullPath}`;

            requestLogger.info('File uploaded successfully', {
                fileUrl,
                fileName: fullPath,
            });

            // Return success response with caching headers
            return NextResponse.json(
                {
                    message: 'Image uploaded successfully',
                    fileUrl,
                    fileName: fullPath,
                },
                {
                    status: 200,
                    headers: {
                        'Cache-Control': 'no-store',
                    },
                }
            );
        } catch (uploadError: unknown) {
            // Clean up the temporary file on failed upload
            await fs.promises.unlink(file.filepath).catch(() => {});

            const errorMessage =
                uploadError instanceof Error ? uploadError.message : 'Unknown error';

            requestLogger.error('Error uploading to S3', { error: uploadError });

            return NextResponse.json(
                { message: 'Error uploading file', error: errorMessage },
                { status: 500, headers: { 'Cache-Control': 'no-store' } }
            );
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        requestLogger.error('Unhandled error in upload handler', { error });

        return NextResponse.json(
            { message: 'Internal server error', error: errorMessage },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
