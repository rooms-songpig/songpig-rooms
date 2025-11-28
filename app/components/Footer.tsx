'use client';

import Link from 'next/link';

export default function Footer() {
  const buildDate = new Date().toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const version = '0.1.0-alpha';

  return (
    <footer
      style={{
        marginTop: 'auto',
        padding: '2rem 1rem',
        background: '#0a0a15',
        borderTop: '1px solid #1a1a2e',
        textAlign: 'center',
        fontSize: '0.85rem',
        opacity: 0.7,
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <p style={{ margin: '0.5rem 0' }}>
          <Link
            href="https://Rooms.SongPig.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#4a9eff',
              textDecoration: 'none',
            }}
          >
            Rooms.SongPig.com
          </Link>
          {' '}
          <Link
            href="/about"
            style={{
              color: '#4a9eff',
              textDecoration: 'none',
              marginLeft: '0.5rem',
            }}
          >
            About
          </Link>
          {' '}
          <Link
            href="/changelog"
            style={{
              color: '#4a9eff',
              textDecoration: 'none',
              marginLeft: '0.5rem',
            }}
          >
            Changelog
          </Link>
        </p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.75rem' }}>
          Version {version} | Built: {buildDate}
        </p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.75rem' }}>
          © 2025 Song Pig. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

