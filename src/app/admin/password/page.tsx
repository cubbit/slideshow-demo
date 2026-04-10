import PasswordChangeForm from '@/components/admin/PasswordChangeForm';

export default function PasswordPage() {
    return (
        <div style={{ maxWidth: '720px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                Change Password
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
                Update the admin panel password
            </p>
            <PasswordChangeForm />
        </div>
    );
}
