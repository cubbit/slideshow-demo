import PhotoManagement from '@/components/admin/PhotoManagement';
import { AdminSection } from '@/components/admin/AdminSection';

export const dynamic = 'force-dynamic';

export default function PhotosPage() {
    return (
        <AdminSection
            title="Photo Management"
            description="Download or delete photos by day or all at once"
        >
            <PhotoManagement />
        </AdminSection>
    );
}
