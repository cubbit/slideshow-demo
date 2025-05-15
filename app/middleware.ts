import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

// Get environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// Function to check if a user is authenticated
function isAuthenticated(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return false;
        }

        // Verify the token
        verify(token, JWT_SECRET);
        return true;
    } catch (error) {
        return false;
    }
}

export function middleware(request: NextRequest) {
    // Skip auth check for login page
    if (request.nextUrl.pathname === '/settings/login') {
        return NextResponse.next();
    }

    // Only apply to /settings route
    if (request.nextUrl.pathname.startsWith('/settings')) {
        // Check if the user is authenticated
        if (!isAuthenticated(request)) {
            // If not authenticated, redirect to login page
            return NextResponse.redirect(new URL('/settings/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/settings', '/settings/(.*)'],
};
