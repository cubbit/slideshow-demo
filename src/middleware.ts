import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { JWT_COOKIE_NAME } from '@/lib/constants';

// Edge runtime cannot access SQLite — JWT_SECRET env var is required.
// The DB schema logs the generated secret on first run if not set.
function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // In development without JWT_SECRET, allow a dev-only fallback
        if (process.env.NODE_ENV !== 'production') {
            return new TextEncoder().encode('dev-only-insecure-secret');
        }
        throw new Error('JWT_SECRET environment variable is required in production');
    }
    return new TextEncoder().encode(secret);
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
    const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
    if (!token) return false;

    try {
        await jwtVerify(token, getJwtSecret());
        return true;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip login page
    if (pathname === '/admin/login') {
        return NextResponse.next();
    }

    // Protect admin pages
    if (pathname.startsWith('/admin')) {
        if (!(await isAuthenticated(request))) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // Protect admin API routes
    const isProtectedApi =
        (pathname.startsWith('/api/settings') && request.method !== 'GET') ||
        pathname.startsWith('/api/webhooks');
    if (isProtectedApi) {
        if (!(await isAuthenticated(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/settings/:path*', '/api/webhooks/:path*'],
};
