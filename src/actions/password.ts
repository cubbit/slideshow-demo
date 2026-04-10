'use server';

import { getAuth, updatePasswordHash } from '@/lib/db/repository';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { passwordChangeSchema } from '@/lib/validation';
import logger from '@/lib/logger';
import type { ActionResult } from '@/types/api';

export async function changePassword(formData: FormData): Promise<ActionResult> {
    try {
        const raw = Object.fromEntries(formData.entries());
        const parsed = passwordChangeSchema.safeParse(raw);

        if (!parsed.success) {
            return { success: false, error: parsed.error.errors[0].message };
        }

        const { currentPassword, newPassword } = parsed.data;
        const auth = getAuth();

        if (!verifyPassword(currentPassword, auth.password_hash)) {
            return { success: false, error: 'Current password is incorrect' };
        }

        const newHash = hashPassword(newPassword);
        updatePasswordHash(newHash);

        logger.info('Admin password changed');
        return { success: true, data: undefined };
    } catch (error) {
        logger.error('Failed to change password', { error });
        return { success: false, error: 'Failed to change password' };
    }
}
