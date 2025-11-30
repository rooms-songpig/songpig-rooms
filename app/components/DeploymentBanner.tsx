'use client';

import { useState, useEffect } from 'react';

interface DeploymentInfo {
  message: string;
  sha: string;
  date: string;
}

export default function DeploymentBanner() {
  const [info, setInfo] = useState<DeploymentInfo | null>(null);

  useEffect(() => {
    fetch('/api/deployment-info')
      .then(res => res.json())
      .then(data => setInfo(data))
      .catch(() => {
        // Fallback for local dev
        setInfo({
          message: 'Local development',
          sha: 'local',
          date: new Date().toISOString(),
        });
      });
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (!info) return null;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        background: '#1a1a2e',
        borderBottom: '2px solid #fbbf24',
        padding: '0.5rem 0.75rem',
        fontSize: '0.7rem',
        color: '#f9fafb',
        zIndex: 1001,
        textAlign: 'center',
        overflow: 'hidden',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ 
        maxWidth: '100%', 
        margin: '0 auto',
        overflow: 'hidden',
        wordBreak: 'break-word',
        lineHeight: '1.4',
      }}>
        <div style={{ display: 'block' }}>
          <strong>Deployment:</strong> <span style={{ wordBreak: 'break-word' }}>{info.message}</span>
        </div>
        <div style={{ display: 'block', fontSize: '0.65rem', opacity: 0.8, marginTop: '0.25rem' }}>
          <strong>Date:</strong> {formatDate(info.date)} | <strong>SHA:</strong> {info.sha.substring(0, 7)}
        </div>
      </div>
    </div>
  );
}

