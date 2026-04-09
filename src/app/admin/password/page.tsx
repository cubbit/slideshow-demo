import PasswordChangeForm from '@/components/admin/PasswordChangeForm';

export default function PasswordPage() {
    return (
        <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                Change Password
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-6">
                Update the admin panel password
            </p>
            <PasswordChangeForm />
        </div>
    );
}
