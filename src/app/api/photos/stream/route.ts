import { NextRequest } from 'next/server';
import { getPhotos, invalidatePhotoCache } from '@/lib/s3/list';
import { DEFAULT_SSE_CHECK_INTERVAL_MS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream({
        async start(controller) {
            let knownKeys = new Set<string>();

            // Initial load
            try {
                const page = await getPhotos();
                knownKeys = new Set(page.photos.map(p => p.key));
                controller.enqueue(
                    encoder.encode(
                        `event: init\ndata: ${JSON.stringify({ count: page.totalCount })}\n\n`
                    )
                );
            } catch {
                // S3 not configured, will retry
            }

            // Poll for new photos
            const interval = setInterval(async () => {
                if (closed) {
                    clearInterval(interval);
                    return;
                }

                try {
                    invalidatePhotoCache();
                    const page = await getPhotos();
                    const currentKeys = new Set(page.photos.map(p => p.key));
                    const newKeys: string[] = [];

                    for (const key of currentKeys) {
                        if (!knownKeys.has(key)) {
                            newKeys.push(key);
                        }
                    }

                    knownKeys = currentKeys;

                    if (newKeys.length > 0) {
                        controller.enqueue(
                            encoder.encode(
                                `event: new-photos\ndata: ${JSON.stringify({ keys: newKeys, count: page.totalCount })}\n\n`
                            )
                        );
                    }

                    // Heartbeat
                    controller.enqueue(
                        encoder.encode(
                            `event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`
                        )
                    );
                } catch {
                    // S3 error, skip this cycle
                }
            }, DEFAULT_SSE_CHECK_INTERVAL_MS);

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                closed = true;
                clearInterval(interval);
                try {
                    controller.close();
                } catch {
                    // Already closed
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
