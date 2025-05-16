import { verify } from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// Utility function to check if the user is authenticated
export function isAuthenticated(request: NextRequest) {
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
