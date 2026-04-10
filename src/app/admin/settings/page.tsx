import { getSettings } from '@/lib/settings/service';
import SlideshowConfigForm from '@/components/admin/SlideshowConfigForm';
import { AdminSection } from '@/components/admin/AdminSection';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    const settings = getSettings();

    return (
        <AdminSection title="Slideshow" description="Configure the slideshow display settings">
            <SlideshowConfigForm initialSettings={settings} />
        </AdminSection>
    );
}
