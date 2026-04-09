import { SignJWT, jwtVerify } from 'jose';
import { getAuth } from '@/lib/db/repository';
import { JWT_EXPIRY } from '@/lib/constants';

function getSecret(): Uint8Array {
    // Prefer env var (same source as middleware which runs in Edge runtime)
    // Fall back to DB-stored secret, then dev-only fallback
    const secret =
        process.env.JWT_SECRET ||
        getAuth().jwt_secret ||
        (process.env.NODE_ENV !== 'production' ? 'dev-only-insecure-secret' : '');
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return new TextEncoder().encode(secret);
}

export async function signToken(): Promise<string> {
    const secret = getSecret();
    return new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRY)
        .sign(secret);
}

export async function verifyToken(token: string): Promise<boolean> {
    try {
        const secret = getSecret();
        await jwtVerify(token, secret);
        return true;
    } catch {
        return false;
    }
}
