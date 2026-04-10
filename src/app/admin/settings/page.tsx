import type { ReactNode } from 'react';
import { getSettings } from '@/lib/settings/service';
import S3ConfigForm from '@/components/admin/S3ConfigForm';
import SlideshowConfigForm from '@/components/admin/SlideshowConfigForm';
import PhotoManagement from '@/components/admin/PhotoManagement';
import WebhookConfigForm from '@/components/admin/WebhookConfigForm';

export const dynamic = 'force-dynamic';

interface SectionProps {
    title: string;
    description: string;
    children: ReactNode;
}

function Section({ title, description, children }: SectionProps): ReactNode {
    return (
        <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                {title}
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
                {description}
            </p>
            {children}
        </div>
    );
}

const dividerStyle = { borderColor: 'rgba(255,255,255,0.06)' };

export default function SettingsPage() {
    const settings = getSettings();

    return (
        <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <Section title="Slideshow" description="Configure the slideshow display settings">
                <SlideshowConfigForm initialSettings={settings} />
            </Section>

            <hr style={dividerStyle} />

            <Section title="Photo Management" description="Download or delete photos by day or all at once">
                <PhotoManagement />
            </Section>

            <hr style={dividerStyle} />

            <Section title="S3 Storage" description="Configure the S3-compatible backend for photo storage">
                <S3ConfigForm initialSettings={settings} />
            </Section>

            <hr style={dividerStyle} />

            <Section title="Webhooks" description="Notify external services about upload events">
                <WebhookConfigForm />
            </Section>
        </div>
    );
}
