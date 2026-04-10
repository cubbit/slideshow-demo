'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type S3Status = 'ok' | 'error' | 'loading';

const S3HealthContext = createContext<S3Status>('loading');

export function S3HealthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<S3Status>('loading');

    useEffect(() => {
        async function check() {
            try {
                const res = await fetch('/api/health');
                const data = await res.json();
                setStatus(data.status === 'ok' ? 'ok' : 'error');
            } catch {
                setStatus('error');
            }
        }

        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    return <S3HealthContext.Provider value={status}>{children}</S3HealthContext.Provider>;
}

export function useS3Health(): S3Status {
    return useContext(S3HealthContext);
}
