import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/db/repository';
import { verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation';
import { JWT_COOKIE_NAME } from '@/lib/constants';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
        }

        const { password } = parsed.data;
        const auth = getAuth();

        if (!verifyPassword(password, auth.password_hash)) {
            logger.warn('Failed login attempt', { ip: request.headers.get('x-forwarded-for') });
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const token = await signToken();

        const response = NextResponse.json({ success: true });
        response.cookies.set(JWT_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 4 * 60 * 60, // 4 hours
            path: '/',
        });

        logger.info('Admin logged in');
        return response;
    } catch (error) {
        logger.error('Login error', { error });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
