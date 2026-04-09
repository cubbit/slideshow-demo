import { getSettings } from '@/lib/settings/service';
import S3ConfigForm from '@/components/admin/S3ConfigForm';
import SlideshowConfigForm from '@/components/admin/SlideshowConfigForm';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    const settings = getSettings();

    return (
        <div className="space-y-10 max-w-3xl">
            <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                    S3 Storage
                </h2>
                <p className="text-sm text-[var(--text-tertiary)] mb-6">
                    Configure the S3-compatible backend for photo storage
                </p>
                <S3ConfigForm initialSettings={settings} />
            </div>

            <hr className="border-[var(--border-secondary)]" />

            <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                    Slideshow
                </h2>
                <p className="text-sm text-[var(--text-tertiary)] mb-6">
                    Configure the slideshow display settings
                </p>
                <SlideshowConfigForm initialSettings={settings} />
            </div>
        </div>
    );
}
