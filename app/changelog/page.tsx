import ReactMarkdown from 'react-markdown';
import { getChangelogContent } from '@/app/lib/changelog';

export const metadata = {
  title: 'Changelog - Song Pig Listening Rooms',
  description: 'Latest updates and fixes for Song Pig Listening Rooms.',
};

export default async function ChangelogPage() {
  const content = await getChangelogContent();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050816',
        color: '#f9fafb',
        padding: '2rem 1rem',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Changelog</h1>
        <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
          All notable changes to Song Pig Listening Rooms.
        </p>
        <div
          style={{
            background: '#0f0f1e',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid #1f2937',
          }}
        >
          <ReactMarkdown
            components={{
              h2: ({ node, ...props }) => (
                <h2 style={{ fontSize: '1.5rem', marginTop: '2rem' }} {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem' }} {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }} {...props} />
              ),
              li: ({ node, ...props }) => (
                <li style={{ marginBottom: '0.4rem' }} {...props} />
              ),
              a: ({ node, ...props }) => (
                <a style={{ color: '#60a5fa' }} {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </main>
  );
}
import React from 'react';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Link from 'next/link';
import UserProfile from '@/app/components/UserProfile';
import Footer from '@/app/components/Footer';
import ScrollToTop from '@/app/components/ScrollToTop';

export default async function ChangelogPage() {
  let changelogContent = '';
  
  try {
    const filePath = join(process.cwd(), 'CHANGELOG.md');
    changelogContent = await readFile(filePath, 'utf-8');
  } catch (error) {
    console.error('Error reading changelog:', error);
    changelogContent = '# Changelog\n\nUnable to load changelog file.';
  }

  // Basic markdown parsing for display
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let currentList: string[] = [];
    let inList = false;
    let currentSection = '';

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              {currentList.map((item, i) => (
                <li key={i}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        elements.push(
          <h1 key={index} style={{ fontSize: '2rem', marginTop: '2rem', marginBottom: '1rem' }}>
            {line.replace(/^#\s+/, '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              {currentList.map((item, i) => (
                <li key={i}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        elements.push(
          <h2 key={index} style={{ fontSize: '1.5rem', marginTop: '1.5rem', marginBottom: '1rem', color: '#4a9eff' }}>
            {line.replace(/^##\s+/, '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              {currentList.map((item, i) => (
                <li key={i}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        elements.push(
          <h3 key={index} style={{ fontSize: '1.25rem', marginTop: '1.25rem', marginBottom: '0.75rem', fontWeight: '600' }}>
            {line.replace(/^###\s+/, '')}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        if (!inList) {
          inList = true;
        }
        currentList.push(line);
      } else if (line.trim() === '') {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} style={{ paddingLeft: '1.5rem', lineHeight: '1.8', marginBottom: '1rem' }}>
              {currentList.map((item, i) => (
                <li key={i}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
      } else if (line.trim()) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              {currentList.map((item, i) => (
                <li key={i}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        // Regular paragraph
        elements.push(
          <p key={index} style={{ lineHeight: '1.8', marginBottom: '1rem' }}>
            {line}
          </p>
        );
      }
    });

    // Handle any remaining list items
    if (inList && currentList.length > 0) {
      elements.push(
        <ul key="final-list" style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          {currentList.map((item, i) => (
            <li key={i}>{item.replace(/^-\s*/, '')}</li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: '#0f0f23', 
      color: '#fff', 
      display: 'flex',
      flexDirection: 'column',
    }}>
      <UserProfile />
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '2rem',
        flex: 1,
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/"
            style={{
              color: '#4a9eff',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            ← Back to Home
          </Link>
        </div>
        
        <div style={{
          background: '#1a1a2e',
          padding: '2rem',
          borderRadius: '0.75rem',
          lineHeight: '1.8',
        }}>
          {parseMarkdown(changelogContent)}
        </div>
      </div>
      <Footer />
      <ScrollToTop />
    </main>
  );
}

