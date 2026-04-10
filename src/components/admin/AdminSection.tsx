import type { ReactNode } from 'react';

interface AdminSectionProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function AdminSection({ title, description, children }: AdminSectionProps) {
    return (
        <div style={{ maxWidth: '720px' }}>
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
