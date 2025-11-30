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
        padding: '0.5rem 1rem',
        fontSize: '0.75rem',
        color: '#f9fafb',
        zIndex: 1001,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <strong>Deployment:</strong> {info.message} | <strong>Date:</strong> {formatDate(info.date)} | <strong>SHA:</strong> {info.sha.substring(0, 7)}
      </div>
    </div>
  );
}

