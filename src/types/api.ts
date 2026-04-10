export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export interface HealthStatus {
    status: 'ok' | 'error';
    endpoint: string;
    bucket: string;
    latencyMs: number;
    error?: string;
}
