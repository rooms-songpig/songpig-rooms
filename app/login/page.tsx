'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setCurrentUser } from '@/app/lib/auth-helpers';
import { supabaseBrowser } from '@/app/lib/supabase-browser';
import PageLabel from '@/app/components/PageLabel';

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Redirect to Supabase Auth for Google OAuth
      const { data, error: signInError } = await supabaseBrowser.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (signInError) {
        setError(signInError.message);
        setGoogleLoading(false);
      }
      // If successful, user will be redirected to Google, then back to /auth/callback
    } catch (error: any) {
      setError(error.message || 'Failed to initiate Google sign-in');
      setGoogleLoading(false);
    }
  };

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
        const normalizedUser = {
          ...data.user,
          status: data.user.status || 'active',
        };
        setCurrentUser(normalizedUser);
        
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
        minHeight: '100dvh',
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
      <PageLabel pageName="Login" />
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome back</h1>
          <p style={{ opacity: 0.8 }}>Sign in to continue to your SongPig dashboard.</p>
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

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            style={{
              width: '100%',
              background: googleLoading ? '#555' : '#fff',
              color: googleLoading ? '#999' : '#333',
              border: '1px solid #ddd',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.951H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.049l3.007-2.342z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.951L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1.5rem',
              gap: '1rem',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#333' }} />
            <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#333' }} />
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
                Fill Reviewer (bob / bob123)
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

