'use client';

import { useState } from 'react';
import { updateSlideshowSettings } from '@/actions/settings';
import type { AllSettings } from '@/types/settings';
import { inputClass, inputStyle, labelClass, labelStyle, btnPrimaryClass, btnPrimaryStyle, hintClass, hintStyle } from './styles';

interface Props {
    initialSettings: AllSettings;
}

export default function SlideshowConfigForm({ initialSettings }: Props) {
    const [settings, setSettings] = useState({
        speedS: initialSettings.speedS,
        rows: initialSettings.rows,
        minCountForMarquee: initialSettings.minCountForMarquee,
        cacheTtlS: initialSettings.cacheTtlS,
        uploadsEnabled: initialSettings.uploadsEnabled,
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [saving, setSaving] = useState(false);

    function handleChange(field: string, value: number) {
        setSettings(prev => ({ ...prev, [field]: value }));
        setStatus(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        const formData = new FormData();
        formData.set('speedS', String(settings.speedS));
        formData.set('rows', String(settings.rows));
        formData.set('minCountForMarquee', String(settings.minCountForMarquee));
        formData.set('cacheTtlS', String(settings.cacheTtlS));
        formData.set('uploadsEnabled', String(settings.uploadsEnabled));

        const result = await updateSlideshowSettings(formData);
        setSaving(false);

        if (result.success) {
            setStatus({ type: 'success', message: 'Slideshow settings saved' });
        } else {
            setStatus({ type: 'error', message: result.error });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Uploads toggle */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderRadius: '12px',
                backgroundColor: settings.uploadsEnabled ? 'rgba(38,171,117,0.06)' : 'rgba(211,44,32,0.06)',
                border: `1px solid ${settings.uploadsEnabled ? 'rgba(38,171,117,0.15)' : 'rgba(211,44,32,0.15)'}`,
                transition: 'all 0.2s',
                marginBottom: '8px',
            }}>
                <div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>
                        Photo uploads
                    </span>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                        {settings.uploadsEnabled ? 'Users can upload new photos' : 'Uploads are currently disabled'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setSettings(prev => ({ ...prev, uploadsEnabled: !prev.uploadsEnabled }));
                        setStatus(null);
                    }}
                    style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        backgroundColor: settings.uploadsEnabled ? '#26AB75' : 'rgba(255,255,255,0.15)',
                        transition: 'background-color 0.2s',
                    }}
                >
                    <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: settings.uploadsEnabled ? '23px' : '3px',
                        transition: 'left 0.2s',
                    }} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <div>
                    <label className={labelClass} style={labelStyle}>Animation Speed (seconds)</label>
                    <input className={inputClass} style={inputStyle} type="number" value={settings.speedS} onChange={e => handleChange('speedS', parseInt(e.target.value))} min={10} max={600} />
                    <p className={hintClass} style={hintStyle}>Duration for a full scroll cycle (10-600s)</p>
                </div>
                <div>
                    <label className={labelClass} style={labelStyle}>Number of Rows</label>
                    <input className={inputClass} style={inputStyle} type="number" value={settings.rows} onChange={e => handleChange('rows', parseInt(e.target.value))} min={1} max={10} />
                </div>
                <div>
                    <label className={labelClass} style={labelStyle}>Min Photos for Animation</label>
                    <input className={inputClass} style={inputStyle} type="number" value={settings.minCountForMarquee} onChange={e => handleChange('minCountForMarquee', parseInt(e.target.value))} min={1} max={50} />
                    <p className={hintClass} style={hintStyle}>Static display below this count</p>
                </div>
                <div>
                    <label className={labelClass} style={labelStyle}>Cache TTL (seconds)</label>
                    <input className={inputClass} style={inputStyle} type="number" value={settings.cacheTtlS} onChange={e => handleChange('cacheTtlS', parseInt(e.target.value))} min={5} max={300} />
                </div>
            </div>

            {status && (
                <p className="text-sm font-medium" style={{ color: status.type === 'success' ? '#26AB75' : '#D32C20' }}>
                    {status.message}
                </p>
            )}

            <div style={{ marginTop: '20px' }}>
                <button type="submit" disabled={saving} className={btnPrimaryClass} style={btnPrimaryStyle}>
                    {saving ? 'Saving...' : 'Save Slideshow Settings'}
                </button>
            </div>
        </form>
    );
}
