'use client';

import { useState } from 'react';
import { changePassword } from '@/actions/password';
import { inputClass, labelClass } from './styles';

export default function PasswordChangeForm() {
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
        null
    );
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        const formData = new FormData(e.currentTarget);
        const result = await changePassword(formData);
        setSaving(false);

        if (result.success) {
            setStatus({ type: 'success', message: 'Password changed successfully' });
            e.currentTarget.reset();
        } else {
            setStatus({ type: 'error', message: result.error });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
            <div>
                <label className={labelClass}>Current Password</label>
                <input
                    className={inputClass}
                    type="password"
                    name="currentPassword"
                    required
                    autoComplete="current-password"
                />
            </div>
            <div>
                <label className={labelClass}>New Password</label>
                <input
                    className={inputClass}
                    type="password"
                    name="newPassword"
                    required
                    minLength={8}
                    autoComplete="new-password"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Minimum 8 characters</p>
            </div>
            <div>
                <label className={labelClass}>Confirm New Password</label>
                <input
                    className={inputClass}
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={8}
                    autoComplete="new-password"
                />
            </div>

            {status && (
                <p
                    className={`text-sm font-medium ${status.type === 'success' ? 'text-success' : 'text-error'}`}
                >
                    {status.message}
                </p>
            )}

            <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
                {saving ? 'Changing...' : 'Change Password'}
            </button>
        </form>
    );
}
