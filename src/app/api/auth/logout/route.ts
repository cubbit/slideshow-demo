import { NextResponse } from 'next/server';
import { JWT_COOKIE_NAME } from '@/lib/constants';

export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.set(JWT_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
    return response;
}
