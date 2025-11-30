'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Dev-only helpers: enabled automatically in non-production,
// or explicitly when NEXT_PUBLIC_SHOW_DEV_HELPERS="true".
const SHOW_DEV_HELPERS =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_SHOW_DEV_HELPERS === 'true';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.user) {
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userRole', data.user.role);
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      setError('Failed to login. Please try again.');
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
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Login</h1>
          <p style={{ opacity: 0.8 }}>Sign in to your account</p>
        </div>

        <form
          onSubmit={handleLogin}
          style={{
            background: '#1a1a2e',
            padding: '2rem',
            borderRadius: '0.75rem',
            border: '1px solid #333',
          }}
        >
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                opacity: 0.9,
              }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f1e',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#f9fafb',
                fontSize: '1rem',
              }}
              placeholder="Enter your username"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                opacity: 0.9,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f1e',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#f9fafb',
                fontSize: '1rem',
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
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
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link
              href="/register"
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              Don't have an account? Register
            </Link>
          </div>
        </form>
        
        {SHOW_DEV_HELPERS && (
          <div
            style={{
              marginTop: '1.25rem',
              fontSize: '0.85rem',
              opacity: 0.8,
              background: '#020617',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              border: '1px dashed #334155',
            }}
          >
            <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
              Dev helpers (only visible in dev / staging):
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                }}
                style={{
                  background: '#1e293b',
                  color: '#f9fafb',
                  border: '1px solid #475569',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Fill Admin (admin / admin123)
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('jean');
                  setPassword('jean123');
                }}
                style={{
                  background: '#1e293b',
                  color: '#f9fafb',
                  border: '1px solid #475569',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Fill Artist (jean / jean123)
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('bob');
                  setPassword('bob123');
                }}
                style={{
                  background: '#1e293b',
                  color: '#f9fafb',
                  border: '1px solid #475569',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Fill Listener (bob / bob123)
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', opacity: 0.7 }}>
          <p>Default admin: username=admin, password=admin123</p>
        </div>
      </div>
    </main>
  );
}

