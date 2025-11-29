'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'artist' | 'listener'>('listener');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const redirectUrl = searchParams?.get('redirect') || '/';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email: email.trim() || undefined, role }),
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
        
        // Store user in localStorage with all fields
        const userData = {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          status: data.user.status || 'active',
          email: data.user.email,
          bio: data.user.bio,
          createdAt: data.user.createdAt,
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userRole', data.user.role);
        
        // Note: createUser() now verifies the user can be read back before returning
        // So we can proceed immediately. The API routes also have retry logic.
        console.log('✅ User registered and verified by createUser():', data.user.id);
        
        // Redirect to original destination or home
        router.push(redirectUrl);
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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Register</h1>
          <p style={{ opacity: 0.8 }}>Create a new account</p>
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                opacity: 0.9,
              }}
            >
              Username *
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
              placeholder="Choose a username (min 3 chars)"
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
                <span>Listener</span>
              </label>
            </div>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
              Artists can create rooms and add songs. Listeners can join rooms and provide feedback.
            </p>
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
        <div style={{ textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      </main>
    }>
      <RegisterContent />
    </Suspense>
  );
}

