'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inviteCodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus invite code input on mount
    if (inviteCodeRef.current) {
      inviteCodeRef.current.focus();
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/invite/${inviteCode.toUpperCase()}`);
      const data = await res.json();

      if (data.room) {
        router.push(`/room/${data.room.id}`);
      } else {
        setError('Room not found. Please check your invite code.');
      }
    } catch (error) {
      setError('Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050816',
        color: '#f9fafb',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Join a Room
          </h1>
          <p style={{ opacity: 0.8 }}>
            Enter the invite code to join a private listening room
          </p>
        </div>

        <form
          onSubmit={handleJoin}
          style={{
            background: '#1a1a2e',
            padding: '2rem',
            borderRadius: '0.75rem',
            border: '1px solid #333',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                opacity: 0.9,
              }}
            >
              Invite Code
            </label>
            <input
              ref={inviteCodeRef}
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              maxLength={6}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f1e',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#f9fafb',
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
              placeholder="ABC123"
            />
          </div>

          {error && (
            <div
              style={{
                background: '#7f1d1d',
                color: '#fca5a5',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            style={{
              width: '100%',
              background: loading ? '#555' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              marginBottom: '1rem',
            }}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>

          <Link
            href="/"
            style={{
              display: 'block',
              textAlign: 'center',
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            ← Back to home
          </Link>
        </form>
      </div>
    </main>
  );
}

