'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
  details?: string; // Additional error details for debugging
}

export default function Toast({ message, type, onClose, duration = 3000, details }: ToastProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Error messages stay visible longer and don't auto-dismiss
  const isError = type === 'error';
  const autoDismiss = !isError;
  const displayDuration = isError ? 0 : duration; // 0 means don't auto-dismiss

  useEffect(() => {
    // Only set up auto-dismiss timer for non-error messages
    if (autoDismiss && displayDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, displayDuration);

      return () => clearTimeout(timer);
    }
    // For errors (displayDuration === 0), do nothing - they stay until manually closed
  }, [displayDuration, onClose, autoDismiss]);

  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

  const copyToClipboard = async () => {
    const errorText = details 
      ? `Error: ${message}\n\nDetails:\n${details}\n\nTimestamp: ${new Date().toISOString()}`
      : `Error: ${message}\n\nTimestamp: ${new Date().toISOString()}`;
    
    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        background: bgColor,
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minWidth: '300px',
        maxWidth: '600px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ flex: 1 }}>{message}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isError && details && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
              }}
              title="Show details"
            >
              {showDetails ? '▼' : '▶'}
            </button>
          )}
          {isError && (
            <button
              onClick={copyToClipboard}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
              }}
              title="Copy error to clipboard"
            >
              {copied ? '✓' : '📋'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0',
              lineHeight: '1',
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      {showDetails && details && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.75rem',
            borderRadius: '0.25rem',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {details}
        </div>
      )}
    </div>
  );
}

