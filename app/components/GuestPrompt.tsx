'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GuestPromptProps {
  roomId: string;
  onContinueAsGuest: () => void;
}

export default function GuestPrompt({ roomId, onContinueAsGuest }: GuestPromptProps) {
  const router = useRouter();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          padding: '2rem',
          borderRadius: '0.75rem',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid #333',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Join This Room
        </h2>
        <p style={{ marginBottom: '1.5rem', opacity: 0.8, lineHeight: '1.6' }}>
          You can view and listen to songs as a guest, but you'll need to register to vote and leave comments.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            href={`/register?redirect=/room/${roomId}`}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: '500',
              fontSize: '1rem',
            }}
          >
            Register to Vote & Comment
          </Link>
          <button
            onClick={onContinueAsGuest}
            style={{
              background: '#1a1a2e',
              color: '#f9fafb',
              border: '1px solid #333',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '1rem',
            }}
          >
            Continue as Guest (View Only)
          </button>
        </div>
      </div>
    </div>
  );
}

