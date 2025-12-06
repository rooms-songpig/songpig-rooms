import Link from 'next/link';

type SongPigLogoProps = {
  /** Optional href; if provided, wraps logo in a Link */
  href?: string;
  /** Visual size of the logo */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to render icon-only (no wordmark) */
  variant?: 'full' | 'icon';
};

const sizeMap = {
  sm: {
    icon: 26,
    fontSize: 16,
  },
  md: {
    icon: 36,
    fontSize: 20,
  },
  lg: {
    icon: 44,
    fontSize: 22,
  },
};

export default function SongPigLogo({
  href,
  size = 'md',
  variant = 'full',
}: SongPigLogoProps) {
  const config = sizeMap[size];

  const content = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        textDecoration: 'none',
        cursor: href ? 'pointer' : 'default',
      }}
    >
      {/* Icon */}
      <div
        aria-hidden="true"
        style={{
          width: config.icon,
          height: config.icon,
          borderRadius: '999px',
          background:
            'radial-gradient(circle at 20% 0%, #facc15 0, #f97316 30%, rgba(0,0,0,0.6) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 18px rgba(0,0,0,0.55)',
          flexShrink: 0,
          padding: size === 'lg' ? '0.15rem' : 0,
        }}
      >
        <span
          style={{
            fontSize: size === 'lg' ? 22 : size === 'md' ? 18 : 16,
            transform: 'translateY(1px)',
          }}
        >
          🐷
        </span>
      </div>

      {variant === 'full' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1.1,
            gap: '0.15rem',
          }}
        >
          <span
            style={{
              fontSize: config.fontSize,
              fontWeight: 700,
              letterSpacing: '0.03em',
              background:
                'linear-gradient(135deg, #a855f7 0%, #22d3ee 40%, #facc15 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              whiteSpace: 'nowrap',
            }}
          >
            SongPig
          </span>
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(226,232,240,0.85)',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}
          >
            A/B Testing
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {content}
      </Link>
    );
  }

  return content;
}


