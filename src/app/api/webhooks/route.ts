import { NextRequest, NextResponse } from 'next/server';
import { getAllWebhooks, createWebhook } from '@/lib/webhooks/repository';
import { webhookSchema } from '@/lib/validation';

export async function GET() {
    const webhooks = getAllWebhooks();
    return NextResponse.json(webhooks);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = webhookSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            );
        }

        const webhook = createWebhook(parsed.data);
        return NextResponse.json(webhook, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
