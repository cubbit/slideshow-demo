import WebhookConfigForm from '@/components/admin/WebhookConfigForm';
import { AdminSection } from '@/components/admin/AdminSection';

export const dynamic = 'force-dynamic';

export default function WebhooksPage() {
    return (
        <AdminSection title="Webhooks" description="Notify external services about upload events">
            <WebhookConfigForm />
        </AdminSection>
    );
}
