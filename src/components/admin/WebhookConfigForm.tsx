'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getWebhooksAction,
    createWebhookAction,
    updateWebhookAction,
    deleteWebhookAction,
    testWebhookAction,
} from '@/actions/webhooks';
import type { WebhookConfig } from '@/types/webhook';
import {
    inputClass,
    inputStyle,
    labelClass,
    labelStyle,
    btnPrimaryClass,
    btnPrimaryStyle,
    btnSecondaryClass,
    btnSecondaryStyle,
    hintStyle,
} from './styles';

const smallBtnStyle: React.CSSProperties = {
    ...btnSecondaryStyle,
    padding: '4px 12px',
    height: '30px',
    fontSize: '12px',
};

const EVENT_GROUPS = [
    {
        label: 'Upload Events',
        events: [
            { key: 'onUploadStarted', label: 'Started' },
            { key: 'onUploadProgress', label: 'Progress' },
            { key: 'onUploadCompleted', label: 'Completed' },
            { key: 'onUploadFailed', label: 'Failed' },
        ],
    },
    {
        label: 'Batch Events',
        events: [
            { key: 'onBatchStarted', label: 'Started' },
            { key: 'onBatchCompleted', label: 'Completed' },
        ],
    },
    {
        label: 'System Events',
        events: [{ key: 'onS3HealthChanged', label: 'S3 Health Changed' }],
    },
] as const;

type EventKey = (typeof EVENT_GROUPS)[number]['events'][number]['key'];

const DEFAULT_FORM: WebhookFormState = {
    name: '',
    url: '',
    secret: '',
    enabled: true,
    onUploadStarted: true,
    onUploadProgress: false,
    onUploadCompleted: true,
    onUploadFailed: true,
    onBatchStarted: true,
    onBatchCompleted: true,
    onS3HealthChanged: false,
};

interface WebhookFormState {
    name: string;
    url: string;
    secret: string;
    enabled: boolean;
    onUploadStarted: boolean;
    onUploadProgress: boolean;
    onUploadCompleted: boolean;
    onUploadFailed: boolean;
    onBatchStarted: boolean;
    onBatchCompleted: boolean;
    onS3HealthChanged: boolean;
}

function buildFormData(fields: WebhookFormState): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        formData.set(key, String(value));
    }
    return formData;
}

export default function WebhookConfigForm() {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<WebhookFormState>(DEFAULT_FORM);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
        null
    );
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);

    const loadWebhooks = useCallback(async () => {
        const result = await getWebhooksAction();
        if (result.success) setWebhooks(result.data);
    }, []);

    useEffect(() => {
        loadWebhooks();
    }, [loadWebhooks]);

    function resetForm() {
        setForm(DEFAULT_FORM);
        setEditingId(null);
        setShowForm(false);
    }

    function startEdit(webhook: WebhookConfig) {
        const { id: _, createdAt: _c, updatedAt: _u, ...formFields } = webhook;
        setForm(formFields);
        setEditingId(webhook.id);
        setShowForm(true);
        setStatus(null);
    }

    function generateSecret() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const secret = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
        setForm(prev => ({ ...prev, secret }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        const formData = buildFormData(form);

        const result = editingId
            ? await updateWebhookAction(editingId, formData)
            : await createWebhookAction(formData);

        setSaving(false);

        if (result.success) {
            setStatus({
                type: 'success',
                message: editingId ? 'Webhook updated' : 'Webhook created',
            });
            await loadWebhooks();
            resetForm();
        } else {
            setStatus({ type: 'error', message: result.error });
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Delete this webhook? This cannot be undone.')) return;
        const result = await deleteWebhookAction(id);
        if (result.success) {
            await loadWebhooks();
            if (editingId === id) resetForm();
        }
    }

    async function handleTest(id: string) {
        setTesting(id);
        const result = await testWebhookAction(id);
        setTesting(null);
        setStatus(
            result.success
                ? { type: 'success', message: 'Test event sent' }
                : { type: 'error', message: result.error }
        );
        setTimeout(() => setStatus(null), 3000);
    }

    async function handleToggleEnabled(webhook: WebhookConfig) {
        const { id: _, createdAt: _c, updatedAt: _u, ...fields } = webhook;
        const formData = buildFormData({ ...fields, enabled: !webhook.enabled });
        const result = await updateWebhookAction(webhook.id, formData);
        if (result.success) await loadWebhooks();
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Webhook list */}
            {webhooks.map(wh => (
                <div
                    key={wh.id}
                    style={{
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: wh.enabled
                                        ? '#22c55e'
                                        : 'rgba(255,255,255,0.2)',
                                    display: 'inline-block',
                                }}
                            />
                            <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>
                                {wh.name || 'Unnamed webhook'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className={btnSecondaryClass}
                                style={smallBtnStyle}
                                onClick={() => handleToggleEnabled(wh)}
                            >
                                {wh.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                                className={btnSecondaryClass}
                                style={smallBtnStyle}
                                onClick={() => handleTest(wh.id)}
                                disabled={testing === wh.id || !wh.enabled}
                            >
                                {testing === wh.id ? 'Sending...' : 'Test'}
                            </button>
                            <button
                                className={btnSecondaryClass}
                                style={smallBtnStyle}
                                onClick={() => startEdit(wh)}
                            >
                                Edit
                            </button>
                            <button
                                className={btnSecondaryClass}
                                style={{ ...smallBtnStyle, color: '#ef4444' }}
                                onClick={() => handleDelete(wh.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.4)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {wh.url}
                    </div>
                </div>
            ))}

            {/* Status message */}
            {status && (
                <p
                    style={{
                        fontSize: '13px',
                        color: status.type === 'success' ? '#22c55e' : '#ef4444',
                    }}
                >
                    {status.message}
                </p>
            )}

            {/* Add / Edit form */}
            {showForm ? (
                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                    <div>
                        <label className={labelClass} style={labelStyle}>
                            Name
                        </label>
                        <input
                            className={inputClass}
                            style={inputStyle}
                            placeholder="e.g. LED Controller"
                            value={form.name}
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className={labelClass} style={labelStyle}>
                            URL *
                        </label>
                        <input
                            className={inputClass}
                            style={inputStyle}
                            placeholder="https://example.com/webhook"
                            value={form.url}
                            onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClass} style={labelStyle}>
                            Secret
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                className={inputClass}
                                style={{
                                    ...inputStyle,
                                    flex: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                }}
                                placeholder="HMAC-SHA256 signing secret"
                                value={form.secret}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, secret: e.target.value }))
                                }
                            />
                            <button
                                type="button"
                                className={btnSecondaryClass}
                                style={btnSecondaryStyle}
                                onClick={generateSecret}
                            >
                                Generate
                            </button>
                        </div>
                        <p style={hintStyle}>
                            Used to sign webhook payloads. Leave empty to skip signing.
                        </p>
                    </div>

                    {/* Event toggles */}
                    {EVENT_GROUPS.map(group => (
                        <div key={group.label}>
                            <label
                                className={labelClass}
                                style={{ ...labelStyle, marginBottom: '10px' }}
                            >
                                {group.label}
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {group.events.map(ev => (
                                    <label
                                        key={ev.key}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            color: 'rgba(255,255,255,0.7)',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form[ev.key as EventKey]}
                                            onChange={e =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    [ev.key]: e.target.checked,
                                                }))
                                            }
                                            style={{ accentColor: '#0065FF' }}
                                        />
                                        {ev.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                            type="submit"
                            className={btnPrimaryClass}
                            style={btnPrimaryStyle}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : editingId ? 'Update Webhook' : 'Add Webhook'}
                        </button>
                        <button
                            type="button"
                            className={btnSecondaryClass}
                            style={btnSecondaryStyle}
                            onClick={resetForm}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    className={btnPrimaryClass}
                    style={{ ...btnPrimaryStyle, alignSelf: 'flex-start' }}
                    onClick={() => {
                        setForm(DEFAULT_FORM);
                        setShowForm(true);
                        setStatus(null);
                    }}
                >
                    Add Webhook
                </button>
            )}
        </div>
    );
}
