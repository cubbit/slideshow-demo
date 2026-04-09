'use client';

import { useState } from 'react';
import { updateSlideshowSettings } from '@/actions/settings';
import type { AllSettings } from '@/types/settings';
import { inputClass, labelClass } from './styles';

interface Props {
    initialSettings: AllSettings;
}

export default function SlideshowConfigForm({ initialSettings }: Props) {
    const [settings, setSettings] = useState({
        speedS: initialSettings.speedS,
        rows: initialSettings.rows,
        minCountForMarquee: initialSettings.minCountForMarquee,
        cacheTtlS: initialSettings.cacheTtlS,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Animation Speed (seconds)</label>
                    <input
                        className={inputClass}
                        type="number"
                        value={settings.speedS}
                        onChange={e => handleChange('speedS', parseInt(e.target.value))}
                        min={10}
                        max={600}
                    />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        Duration for a full scroll cycle (10-600s)
                    </p>
                </div>
                <div>
                    <label className={labelClass}>Number of Rows</label>
                    <input
                        className={inputClass}
                        type="number"
                        value={settings.rows}
                        onChange={e => handleChange('rows', parseInt(e.target.value))}
                        min={1}
                        max={10}
                    />
                </div>
                <div>
                    <label className={labelClass}>Min Photos for Animation</label>
                    <input
                        className={inputClass}
                        type="number"
                        value={settings.minCountForMarquee}
                        onChange={e =>
                            handleChange('minCountForMarquee', parseInt(e.target.value))
                        }
                        min={1}
                        max={50}
                    />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        Static display below this count
                    </p>
                </div>
                <div>
                    <label className={labelClass}>Cache TTL (seconds)</label>
                    <input
                        className={inputClass}
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
                    className={`text-sm font-medium ${status.type === 'success' ? 'text-success' : 'text-error'}`}
                >
                    {status.message}
                </p>
            )}

            <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
                {saving ? 'Saving...' : 'Save Slideshow Settings'}
            </button>
        </form>
    );
}
