'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        fontSize: '0.9rem',
      }}
    >
      {items.map((item, index) => (
        <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {item.href ? (
            <Link
              href={item.href}
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ opacity: 0.7 }}>{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span style={{ opacity: 0.5 }}>›</span>
          )}
        </span>
      ))}
    </nav>
  );
}

