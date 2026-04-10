import { getSettings } from '@/lib/settings/service';
import S3ConfigForm from '@/components/admin/S3ConfigForm';
import SlideshowConfigForm from '@/components/admin/SlideshowConfigForm';
import PhotoManagement from '@/components/admin/PhotoManagement';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    const settings = getSettings();

    return (
        <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                    Slideshow
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
                    Configure the slideshow display settings
                </p>
                <SlideshowConfigForm initialSettings={settings} />
            </div>

            <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                    Photo Management
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
                    Download or delete photos by day or all at once
                </p>
                <PhotoManagement />
            </div>

            <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                    S3 Storage
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
                    Configure the S3-compatible backend for photo storage
                </p>
                <S3ConfigForm initialSettings={settings} />
            </div>
        </div>
    );
}
