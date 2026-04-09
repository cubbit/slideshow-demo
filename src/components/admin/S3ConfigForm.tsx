'use client';

import { useState } from 'react';
import { updateS3Settings, testS3Connection } from '@/actions/settings';
import type { AllSettings } from '@/types/settings';
import { inputClass, labelClass } from './styles';

interface Props {
    initialSettings: AllSettings;
}

export default function S3ConfigForm({ initialSettings }: Props) {
    const [settings, setSettings] = useState(initialSettings);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
        null
    );
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    function handleChange(field: keyof AllSettings, value: string | number) {
        setSettings(prev => ({ ...prev, [field]: value }));
        setStatus(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        const formData = new FormData();
        formData.set('bucketName', settings.bucketName);
        formData.set('prefix', settings.prefix);
        formData.set('endpoint', settings.endpoint);
        formData.set('region', settings.region);
        formData.set('accessKeyId', settings.accessKeyId);
        formData.set('secretAccessKey', settings.secretAccessKey);
        formData.set('multipartThreshold', String(settings.multipartThreshold));
        formData.set('maxFileSize', String(settings.maxFileSize));

        const result = await updateS3Settings(formData);
        setSaving(false);

        if (result.success) {
            setStatus({ type: 'success', message: 'S3 settings saved successfully' });
        } else {
            setStatus({ type: 'error', message: result.error });
        }
    }

    async function handleTest() {
        setTesting(true);
        setTestResult(null);

        const result = await testS3Connection();
        setTesting(false);

        if (result.success) {
            setTestResult({
                type: 'success',
                message: `Connected (${result.data.latencyMs}ms)`,
            });
        } else {
            setTestResult({ type: 'error', message: result.error });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Bucket Name</label>
                    <input
                        className={inputClass}
                        value={settings.bucketName}
                        onChange={e => handleChange('bucketName', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>Prefix (optional)</label>
                    <input
                        className={inputClass}
                        value={settings.prefix}
                        onChange={e => handleChange('prefix', e.target.value)}
                        placeholder="e.g. photos"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className={labelClass}>S3 Endpoint</label>
                    <input
                        className={inputClass}
                        value={settings.endpoint}
                        onChange={e => handleChange('endpoint', e.target.value)}
                        placeholder="https://s3.cubbit.eu"
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>Region</label>
                    <input
                        className={inputClass}
                        value={settings.region}
                        onChange={e => handleChange('region', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>Max File Size (bytes)</label>
                    <input
                        className={inputClass}
                        type="number"
                        value={settings.maxFileSize}
                        onChange={e => handleChange('maxFileSize', parseInt(e.target.value))}
                        min={1}
                    />
                </div>
                <div>
                    <label className={labelClass}>Access Key ID</label>
                    <input
                        className={inputClass}
                        value={settings.accessKeyId}
                        onChange={e => handleChange('accessKeyId', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>Secret Access Key</label>
                    <input
                        className={inputClass}
                        type="password"
                        value={settings.secretAccessKey}
                        onChange={e => handleChange('secretAccessKey', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>Multipart Threshold (bytes)</label>
                    <input
                        className={inputClass}
                        type="number"
                        value={settings.multipartThreshold}
                        onChange={e =>
                            handleChange('multipartThreshold', parseInt(e.target.value))
                        }
                        min={1}
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

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Saving...' : 'Save S3 Settings'}
                </button>

                <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="px-4 py-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] disabled:opacity-50 transition-colors"
                >
                    {testing ? 'Testing...' : 'Test Connection'}
                </button>

                {testResult && (
                    <span
                        className={`text-sm ${testResult.type === 'success' ? 'text-success' : 'text-error'}`}
                    >
                        {testResult.message}
                    </span>
                )}
            </div>
        </form>
    );
}
