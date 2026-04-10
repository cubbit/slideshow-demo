import { getSettings } from '@/lib/settings/service';
import S3ConfigForm from '@/components/admin/S3ConfigForm';
import { AdminSection } from '@/components/admin/AdminSection';

export const dynamic = 'force-dynamic';

export default function StoragePage() {
    const settings = getSettings();

    return (
        <AdminSection
            title="S3 Storage"
            description="Configure the S3-compatible backend for photo storage"
        >
            <S3ConfigForm initialSettings={settings} />
        </AdminSection>
    );
}
