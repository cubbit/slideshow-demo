import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { emitWebhookEvent } from '@/lib/webhooks/service';
import type { BatchStartedData, BatchProgressData, BatchCompletedData } from '@/types/webhook';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const fileCount = Number(body.fileCount);

        if (!fileCount || fileCount < 1) {
            return NextResponse.json({ error: 'fileCount must be >= 1' }, { status: 400 });
        }

        const batchId = uuid();

        emitWebhookEvent(
            'batch.started',
            {
                batchId,
                fileCount,
            } satisfies BatchStartedData,
            { batchId }
        );

        return NextResponse.json({ batchId });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { batchId, fileCount, completedCount, successCount, failedCount } = body;

        if (!batchId) {
            return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
        }

        emitWebhookEvent(
            'batch.progress',
            {
                batchId,
                fileCount: Number(fileCount) || 0,
                completedCount: Number(completedCount) || 0,
                successCount: Number(successCount) || 0,
                failedCount: Number(failedCount) || 0,
            } satisfies BatchProgressData,
            { batchId }
        );

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { batchId, fileCount, successCount, failedCount } = body;

        if (!batchId) {
            return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
        }

        emitWebhookEvent(
            'batch.completed',
            {
                batchId,
                fileCount: Number(fileCount) || 0,
                successCount: Number(successCount) || 0,
                failedCount: Number(failedCount) || 0,
            } satisfies BatchCompletedData,
            { batchId }
        );

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
