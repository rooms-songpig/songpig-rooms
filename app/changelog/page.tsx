import type { ReactElement } from 'react';
import Link from 'next/link';
import UserProfile from '@/app/components/UserProfile';
import ScrollToTop from '@/app/components/ScrollToTop';
import { getChangelogContent } from '@/app/lib/changelog';

export const metadata = {
  title: 'Changelog - Song Pig Listening Rooms',
  description: 'Latest updates and fixes for Song Pig Listening Rooms.',
};

function renderChangelog(content: string): ReactElement[] {
  const lines = content.split('\n');
  const elements: ReactElement[] = [];
  let currentList: string[] = [];
  let inList = false;

  const flushList = (key: string) => {
    if (!inList || currentList.length === 0) return;
    elements.push(
      <ul
        key={key}
        style={{
          paddingLeft: '1.5rem',
          marginBottom: '1.25rem',
          lineHeight: 1.8,
        }}
      >
        {currentList.map((item, idx) => (
          <li key={idx} style={{ marginBottom: '0.4rem' }}>
            {item.replace(/^-\s*/, '')}
          </li>
        ))}
      </ul>
    );
    currentList = [];
    inList = false;
  };

  lines.forEach((line, index) => {
    if (line.startsWith('### ')) {
      flushList(`list-${index}`);
      elements.push(
        <h3
          key={`h3-${index}`}
          style={{
            fontSize: '1.1rem',
            marginTop: '1.5rem',
            marginBottom: '0.75rem',
            color: '#c7d2fe',
          }}
        >
          {line.replace(/^###\s+/, '')}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      flushList(`list-${index}`);
      elements.push(
        <h2
          key={`h2-${index}`}
          style={{
            fontSize: '1.5rem',
            marginTop: '2.5rem',
            marginBottom: '1rem',
            color: '#93c5fd',
          }}
        >
          {line.replace(/^##\s+/, '')}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      flushList(`list-${index}`);
      elements.push(
        <h1
          key={`h1-${index}`}
          style={{
            fontSize: '2rem',
            marginTop: '3rem',
            marginBottom: '1.25rem',
          }}
        >
          {line.replace(/^#\s+/, '')}
        </h1>
      );
    } else if (line.startsWith('- ')) {
      inList = true;
      currentList.push(line);
    } else if (line.trim() === '') {
      flushList(`list-${index}`);
    } else {
      flushList(`list-${index}`);
      elements.push(
        <p key={`p-${index}`} style={{ marginBottom: '1rem', lineHeight: 1.8 }}>
          {line}
        </p>
      );
    }
  });

  flushList('final-list');
  return elements;
}

export default async function ChangelogPage() {
  const content = await getChangelogContent();

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#050816',
        color: '#f9fafb',
        padding: '0 1rem 3rem',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <UserProfile pageName="Changelog" />
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', flex: 1 }}>
        <div style={{ margin: '2rem 0 1.5rem' }}>
          <Link
            href="/"
            style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            ← Back to Home
          </Link>
        </div>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Changelog</h1>
          <p style={{ opacity: 0.8, margin: 0 }}>
            All notable updates for Song Pig Listening Rooms. This page reads directly from{' '}
            <code style={{ background: '#0f172a', padding: '0.15rem 0.4rem', borderRadius: '0.35rem' }}>
              CHANGELOG.md
            </code>
            , so it always matches what shipped.
          </p>
        </header>
        <div
          style={{
            background: '#0f0f1e',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid #1f2937',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
          }}
        >
          {renderChangelog(content)}
        </div>
      </div>
      <ScrollToTop />
    </main>
  );
}
