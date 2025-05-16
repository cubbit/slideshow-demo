import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

// Get environment variables
const AUTH_USERNAME = process.env.AUTH_USERNAME;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// Validate required env vars are set
if (!AUTH_USERNAME || !AUTH_PASSWORD) {
    console.warn('WARNING: AUTH_USERNAME and/or AUTH_PASSWORD environment variables not set!');
}

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        // Check if credentials match
        if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
            // Create a JWT token
            const token = sign({ username }, JWT_SECRET, { expiresIn: '4h' });

            // Create response with token in cookie
            const response = NextResponse.json({ success: true });

            // Set cookie in the response
            response.cookies.set({
                name: 'auth_token',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 4, // 4 hours
                path: '/',
                sameSite: 'lax',
            });

            return response;
        }

        // Invalid credentials
        return NextResponse.json(
            { success: false, message: 'Invalid credentials' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication error' },
            { status: 500 }
        );
    }
}
