'use client';

import { useState } from 'react';
import { updateSlideshowSettings } from '@/actions/settings';
import type { AllSettings } from '@/types/settings';
import {
    inputClass,
    inputStyle,
    labelClass,
    labelStyle,
    btnPrimaryClass,
    btnPrimaryStyle,
    hintClass,
    hintStyle,
} from './styles';

interface Props {
    initialSettings: AllSettings;
}

export default function SlideshowConfigForm({ initialSettings }: Props) {
    const [settings, setSettings] = useState({
        speedS: initialSettings.speedS,
        rows: initialSettings.rows,
        autoRows: initialSettings.autoRows,
        minCountForMarquee: initialSettings.minCountForMarquee,
        cacheTtlS: initialSettings.cacheTtlS,
        uploadsEnabled: initialSettings.uploadsEnabled,
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
        null
    );
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
        formData.set('autoRows', String(settings.autoRows));
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
            {/* Uploads disabled banner */}
            {!settings.uploadsEnabled && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(211,44,32,0.08)',
                        border: '1px solid rgba(211,44,32,0.2)',
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#EF5350"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span style={{ fontSize: '13px', color: '#EF5350', fontWeight: 500 }}>
                        Photo uploads are disabled. Users cannot upload new photos.
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                {/* Uploads toggle */}
                <div
                    className="md:col-span-2"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <label className={labelClass} style={labelStyle}>
                            Photo Uploads
                        </label>
                        <p className={hintClass} style={hintStyle}>
                            {settings.uploadsEnabled
                                ? 'Users can upload new photos'
                                : 'Toggle to re-enable uploads'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            const newValue = !settings.uploadsEnabled;
                            setSettings(prev => ({ ...prev, uploadsEnabled: newValue }));
                            setStatus(null);
                            // Save immediately
                            const formData = new FormData();
                            formData.set('speedS', String(settings.speedS));
                            formData.set('rows', String(settings.rows));
                            formData.set('minCountForMarquee', String(settings.minCountForMarquee));
                            formData.set('cacheTtlS', String(settings.cacheTtlS));
                            formData.set('autoRows', String(settings.autoRows));
                            formData.set('uploadsEnabled', String(newValue));
                            await updateSlideshowSettings(formData);
                        }}
                        style={{
                            width: '40px',
                            height: '22px',
                            borderRadius: '11px',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            backgroundColor: settings.uploadsEnabled
                                ? '#26AB75'
                                : 'rgba(255,255,255,0.15)',
                            transition: 'background-color 0.2s',
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#FFFFFF',
                                position: 'absolute',
                                top: '3px',
                                left: settings.uploadsEnabled ? '21px' : '3px',
                                transition: 'left 0.2s',
                            }}
                        />
                    </button>
                </div>
                <div className="md:col-span-2">
                    <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                </div>
                <div>
                    <label className={labelClass} style={labelStyle}>
                        Animation Speed (seconds)
                    </label>
                    <input
                        className={inputClass}
                        style={inputStyle}
                        type="number"
                        value={settings.speedS}
                        onChange={e => handleChange('speedS', parseInt(e.target.value))}
                        min={10}
                        max={600}
                    />
                    <p className={hintClass} style={hintStyle}>
                        Duration for a full scroll cycle (10-600s)
                    </p>
                </div>
                <div>
                    <label className={labelClass} style={labelStyle}>
                        Number of Rows
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            className={inputClass}
                            style={{ ...inputStyle, flex: 1, opacity: settings.autoRows ? 0.3 : 1 }}
                            type="number"
                            value={settings.rows}
                            onChange={e => handleChange('rows', parseInt(e.target.value))}
                            min={1}
                            max={10}
                            disabled={settings.autoRows}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSettings(prev => ({ ...prev, autoRows: !prev.autoRows }));
                                setStatus(null);
                            }}
                            style={{
                                height: '40px',
                                padding: '0 16px',
                                borderRadius: '6px',
                                border: settings.autoRows
                                    ? '1px solid rgba(0,101,255,0.3)'
                                    : '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                backgroundColor: settings.autoRows
                                    ? 'rgba(0,101,255,0.12)'
                                    : 'rgba(255,255,255,0.04)',
                                color: settings.autoRows ? '#5498FF' : 'rgba(255,255,255,0.4)',
                                fontSize: '13px',
                                fontWeight: 600,
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Auto
                        </button>
                    </div>
                    <p className={hintClass} style={hintStyle}>
                        {settings.autoRows
                            ? 'Rows calculated based on screen size'
                            : 'Fixed number of rows'}
                    </p>
                </div>
                <div>
                    <label className={labelClass} style={labelStyle}>
                        Min Photos for Animation
                    </label>
                    <input
                        className={inputClass}
                        style={inputStyle}
                        type="number"
                        value={settings.minCountForMarquee}
                        onChange={e => handleChange('minCountForMarquee', parseInt(e.target.value))}
                        min={1}
                        max={50}
                    />
                    <p className={hintClass} style={hintStyle}>
                        Static display below this count
                    </p>
                </div>
                <div>
                    <label className={labelClass} style={labelStyle}>
                        Cache TTL (seconds)
                    </label>
                    <input
                        className={inputClass}
                        style={inputStyle}
                        type="number"
                        value={settings.cacheTtlS}
                        onChange={e => handleChange('cacheTtlS', parseInt(e.target.value))}
                        min={5}
                        max={300}
                    />
                </div>
            </div>

            {status && (
                <p
                    className="text-sm font-medium"
                    style={{ color: status.type === 'success' ? '#26AB75' : '#D32C20' }}
                >
                    {status.message}
                </p>
            )}

            <div style={{ marginTop: '20px' }}>
                <button
                    type="submit"
                    disabled={saving}
                    className={btnPrimaryClass}
                    style={btnPrimaryStyle}
                >
                    {saving ? 'Saving...' : 'Save Slideshow Settings'}
                </button>
            </div>
        </form>
    );
}
