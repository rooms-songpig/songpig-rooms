'use client';

interface PageLabelProps {
  pageName: string;
}

export default function PageLabel({ pageName }: PageLabelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '4rem',
        right: '1rem',
        background: 'rgba(0, 0, 0, 0.6)',
        color: '#888',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.65rem',
        fontFamily: 'monospace',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 0.5,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      PAGE: {pageName}
    </div>
  );
}

