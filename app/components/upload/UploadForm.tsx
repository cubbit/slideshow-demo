'use client';

import { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import styles from './UploadForm.module.css';

interface UploadResponse {
    message: string;
    fileUrl?: string;
    fileName?: string;
    error?: string;
    errorId?: string;
}

interface ErrorResponse {
    message: string;
    error?: string;
    errorId?: string;
    retryAfter?: number;
}

// Parse the environment variable or fallback to 40MB
const MAX_FILE_SIZE = process.env.NEXT_PUBLIC_MAX_FILE_SIZE
    ? parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE, 10)
    : 40 * 1024 * 1024;

// Supported image types
const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/heic',
    'image/heif',
];

// Component states
type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

const UploadForm: React.FC = () => {
    // State management
    const [file, setFile] = useState<File | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadResult, setUploadResult] = useState<{ url?: string; fileName?: string } | null>(
        null
    );

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Auto-clear success/error status after a longer delay to ensure visibility
    useEffect(() => {
        if (uploadState === 'success' && successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 8000); // Longer display time for success message
            return () => clearTimeout(timer);
        }
    }, [uploadState, successMessage]);

    useEffect(() => {
        if (uploadState === 'error' && errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(null);
            }, 8000); // Longer display time for error message
            return () => clearTimeout(timer);
        }
    }, [uploadState, errorMessage]);

    // File validation functions
    const isValidFileType = (file: File): boolean => {
        return SUPPORTED_IMAGE_TYPES.includes(file.type);
    };

    const isValidFileSize = (file: File): boolean => {
        return file.size <= MAX_FILE_SIZE;
    };

    // Reset the form
    const resetForm = () => {
        setFile(null);
        setUploadState('idle');
        setUploadProgress(0);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        if (formRef.current) {
            formRef.current.reset();
        }
    };

    // Handle file selection
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        // Reset previous states
        setErrorMessage(null);
        setSuccessMessage(null);
        setUploadResult(null);

        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate file type
            if (!isValidFileType(selectedFile)) {
                setErrorMessage('Invalid file type. Only images are allowed.');
                setUploadState('error');
                e.target.value = '';
                console.error('File validation failed: Invalid file type', {
                    type: selectedFile.type,
                });
                return;
            }

            // Validate file size
            if (!isValidFileSize(selectedFile)) {
                setErrorMessage(
                    `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
                );
                setUploadState('error');
                e.target.value = '';
                console.error('File validation failed: File too large', {
                    size: selectedFile.size,
                    maxSize: MAX_FILE_SIZE,
                });
                return;
            }

            setFile(selectedFile);
            setUploadState('selected');
        } else {
            setFile(null);
            setUploadState('idle');
        }
    };

    // Handle file upload
    const uploadFile = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
            setErrorMessage('Please select a file first.');
            setUploadState('error');
            console.error('Upload attempted without selecting a file');
            return;
        }

        try {
            setUploadState('uploading');
            setUploadProgress(0);
            setErrorMessage(null);
            setSuccessMessage(null);
            setUploadResult(null);

            // Log upload start
            console.log('Starting file upload', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            });

            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            // Start upload with progress tracking
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', event => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);

                    // Log progress at 25%, 50%, 75%, and 100%
                    if (
                        percentComplete === 25 ||
                        percentComplete === 50 ||
                        percentComplete === 75 ||
                        percentComplete === 100
                    ) {
                        console.log(`Upload progress: ${percentComplete}%`);
                    }
                }
            });

            // Set up promise to handle XHR
            const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
                xhr.open('POST', '/api/upload');

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (error) {
                            console.error('Error parsing response', {
                                responseText: xhr.responseText,
                                error,
                            });
                            reject(new Error('Invalid response format'));
                        }
                    } else {
                        try {
                            const errorData: ErrorResponse = JSON.parse(xhr.responseText);
                            console.error('Upload failed with server error', {
                                status: xhr.status,
                                errorData,
                            });
                            reject(new Error(errorData.message || 'Upload failed'));
                        } catch (error) {
                            console.error('Upload failed with HTTP error', { status: xhr.status });
                            reject(new Error(`HTTP error ${xhr.status}`));
                        }
                    }
                };

                xhr.onerror = () => {
                    console.error('Network error during upload');
                    reject(new Error('Network error occurred'));
                };

                xhr.send(formData);
            });

            // Wait for upload to complete
            const response = await uploadPromise;

            // Log successful upload
            console.log('File uploaded successfully', {
                fileName: response.fileName,
                fileUrl: response.fileUrl,
            });

            // Handle success with result display
            setSuccessMessage('Photo uploaded successfully to Cubbit DS3!');
            setUploadState('success');
            setUploadResult({
                url: response.fileUrl,
                fileName: response.fileName,
            });

            // Reset form for next upload
            resetForm();
        } catch (err) {
            // Detailed error logging
            console.error('Error uploading file', {
                error: err,
                fileName: file?.name,
                fileSize: file?.size,
            });

            const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
            setErrorMessage(`Upload failed: ${errorMsg}`);
            setUploadState('error');
        }
    };

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} bytes`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <>
            <div className={styles.uploadContainer}>
                <form className={styles.form} onSubmit={uploadFile} ref={formRef}>
                    <div className={styles.instructions}>
                        <h3>Upload a Photo to Cubbit DS3</h3>
                        <p>Select a photo from your device</p>
                        <p className={styles.sizeLimit}>
                            Max size: {MAX_FILE_SIZE / (1024 * 1024)}MB
                        </p>
                    </div>

                    <div className={styles.fileInputWrapper}>
                        <input
                            type="file"
                            id="fileInput"
                            className={styles.fileInput}
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploadState === 'uploading'}
                            ref={fileInputRef}
                            aria-label="Select an image file"
                        />
                        <label htmlFor="fileInput" className={styles.fileLabel}>
                            {file ? 'Change Photo' : 'Select Photo'}
                        </label>

                        {file && (
                            <div className={styles.fileInfo}>
                                <div className={styles.selectedFileName}>{file.name}</div>
                                <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                            </div>
                        )}
                    </div>

                    {uploadState === 'uploading' && (
                        <div className={styles.progressContainer}>
                            <div
                                className={styles.progressBar}
                                style={{ width: `${uploadProgress}%` }}
                                role="progressbar"
                                aria-valuenow={uploadProgress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            ></div>
                            <div className={styles.progressText}>{uploadProgress}%</div>
                        </div>
                    )}

                    {uploadState === 'success' && uploadResult && (
                        <div className={styles.resultContainer}>
                            <p>Successfully uploaded to:</p>
                            <div className={styles.resultUrl}>
                                {uploadResult.fileName || 'Cubbit DS3'}
                            </div>
                        </div>
                    )}

                    <button
                        className={styles.button}
                        type="submit"
                        disabled={uploadState === 'uploading' || !file}
                    >
                        {uploadState === 'uploading' ? 'Uploading...' : 'Upload Photo'}
                    </button>
                </form>
            </div>

            <div className={styles.toastContainer}>
                {errorMessage && (
                    <div className={styles.errorToast} role="alert">
                        ⚠️ {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className={styles.statusToast} role="status">
                        ✅ {successMessage}
                    </div>
                )}
            </div>
        </>
    );
};

export default UploadForm;
