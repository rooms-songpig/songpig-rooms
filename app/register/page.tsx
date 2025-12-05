'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setCurrentUser } from '@/app/lib/auth-helpers';
import { supabaseBrowser } from '@/app/lib/supabase-browser';
import PageLabel from '@/app/components/PageLabel';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'artist' | 'listener' | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const redirectUrl = searchParams?.get('redirect') || '/';

  const handleGoogleSignUp = async () => {
    if (!role) {
      setError('Please choose an account type (Artist or Reviewer) before signing up with Google.');
      return;
    }
    setGoogleLoading(true);
    setError('');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const signupRole = role; // 'artist' | 'listener'

      // Redirect to Supabase Auth for Google OAuth
      const { data, error: signInError } = await supabaseBrowser.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?signupRole=${signupRole}`,
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
      setError(error.message || 'Failed to initiate Google sign-up');
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    if (!role) {
      setError('Please choose an account type (Artist or Reviewer).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          email: email.trim() || undefined,
          role: role === 'artist' ? 'artist' : 'listener',
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.user) {
        // Verify user data has all required fields
        if (!data.user.id || !data.user.username || !data.user.role) {
          setError('Invalid user data received. Please try again.');
          return;
        }
        
        const userData = {
          ...data.user,
          status: data.user.status || 'active',
        };
        setCurrentUser(userData);
        
        // Note: createUser() now verifies the user can be read back before returning
        // So we can proceed immediately. The API routes also have retry logic.
        console.log('✅ User registered and verified by createUser():', data.user.id);
        
        // Redirect to original destination or home with welcome banner hint
        const welcomeRole = userData.role === 'artist' ? 'artist' : 'reviewer';
        const basePath = redirectUrl === '/' ? '/dashboard' : redirectUrl;
        const separator = basePath.includes('?') ? '&' : '?';
        router.push(`${basePath}${separator}welcome=${welcomeRole}`);
      }
    } catch (error) {
      setError('Failed to register. Please try again.');
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
      <PageLabel pageName="Register" />
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Join the SongPig family</h1>
          <p style={{ opacity: 0.8 }}>
            Create your artist or reviewer account and help shape the next generation of songs.
          </p>
          <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Your account type (Artist or Reviewer) applies whether you sign up with email or with Google.
          </p>
        </div>

        <form
          onSubmit={handleRegister}
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

          {/* Account Type first so role is clear before choosing signup method */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                opacity: 0.9,
              }}
            >
              Account Type *
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="role"
                  value="artist"
                  checked={role === 'artist'}
                  onChange={(e) => setRole('artist')}
                  style={{ cursor: 'pointer' }}
                />
                <span>Artist</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="role"
                  value="listener"
                  checked={role === 'listener'}
                  onChange={(e) => setRole('listener')}
                  style={{ cursor: 'pointer' }}
                />
                <span>Reviewer</span>
              </label>
            </div>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
              Artists can create rooms and add songs – and every artist is also a reviewer by default.
              Reviewers are the trusted ears who vote, comment, and help artists grow.
            </p>
          </div>

          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            {googleLoading
              ? 'Signing up...'
              : role === 'artist'
              ? 'Sign up with Google as Artist'
              : role === 'listener'
              ? 'Sign up with Google as Reviewer'
              : 'Sign up with Google (choose account type above)'}
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
              Username / @handle *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f1e',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#f9fafb',
                fontSize: '1rem',
              }}
              placeholder="Choose a handle (min 3 chars, letters/numbers/_/.)"
            />
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.35rem' }}>
              Your public handle will appear as <span style={{ fontWeight: 600 }}>@
              {username || 'yourname'}</span>.
            </p>
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
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f1e',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#f9fafb',
                fontSize: '1rem',
              }}
              placeholder="Password (min 6 chars)"
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
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f1e',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#f9fafb',
                fontSize: '1rem',
              }}
              placeholder="your@email.com"
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
            {loading ? 'Registering...' : 'Register'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link
              href="/login"
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
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
        <div style={{ textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      </main>
    }>
      <RegisterContent />
    </Suspense>
  );
}

