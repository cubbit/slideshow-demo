'use client';

import { useState } from 'react';
import { changePassword } from '@/actions/password';
import { inputClass, inputStyle, labelClass, labelStyle, btnPrimaryClass, btnPrimaryStyle, hintClass, hintStyle } from './styles';

export default function PasswordChangeForm() {
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
        <form onSubmit={handleSubmit} className="max-w-sm space-y-5">
            <div>
                <label className={labelClass} style={labelStyle}>Current Password</label>
                <input className={inputClass} style={inputStyle} type="password" name="currentPassword" required autoComplete="current-password" />
            </div>
            <div>
                <label className={labelClass} style={labelStyle}>New Password</label>
                <input className={inputClass} style={inputStyle} type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
                <p className={hintClass} style={hintStyle}>Minimum 8 characters</p>
            </div>
            <div>
                <label className={labelClass} style={labelStyle}>Confirm New Password</label>
                <input className={inputClass} style={inputStyle} type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" />
            </div>

            {status && (
                <p className="text-sm font-medium" style={{ color: status.type === 'success' ? '#26AB75' : '#D32C20' }}>
                    {status.message}
                </p>
            )}

            <div style={{ marginTop: '20px' }}>
                <button type="submit" disabled={saving} className={btnPrimaryClass} style={btnPrimaryStyle}>
                    {saving ? 'Changing...' : 'Change Password'}
                </button>
            </div>
        </form>
    );
}
