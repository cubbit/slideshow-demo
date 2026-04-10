interface Props {
    className?: string;
    size?: number;
}

export default function CubbitLogo({ className = '', size = 24 }: Props) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            {/* Cubbit cube icon */}
            <rect x="2" y="8" width="18" height="18" rx="3" fill="currentColor" opacity="0.9" />
            <rect x="12" y="4" width="18" height="18" rx="3" fill="currentColor" opacity="0.5" />
        </svg>
    );
}
