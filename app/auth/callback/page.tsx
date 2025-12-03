'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/app/lib/supabase-browser';
import { setCurrentUser } from '@/app/lib/auth-helpers';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params
        const errorParam = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');
        
        if (errorParam) {
          setError(errorDescription || errorParam);
          setLoading(false);
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`);
          }, 2000);
          return;
        }

        // Get the session from Supabase (handles hash tokens automatically)
        const { data: { session }, error: sessionError } = await supabaseBrowser.auth.getSession();

        if (sessionError || !session || !session.user) {
          console.error('Error getting session:', sessionError);
          setError('Failed to authenticate');
          setLoading(false);
          setTimeout(() => {
            router.push('/login?error=auth_failed');
          }, 2000);
          return;
        }

        const { user } = session;

        // Sync user with app's users table
        const syncResponse = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseUserId: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          }),
        });

        if (!syncResponse.ok) {
          const errorText = await syncResponse.text();
          console.error('Error syncing user:', errorText);
          setError('Failed to sync user account');
          setLoading(false);
          setTimeout(() => {
            router.push('/login?error=sync_failed');
          }, 2000);
          return;
        }

        const { user: appUser } = await syncResponse.json();

        // Set user in localStorage
        setCurrentUser({
          id: appUser.id,
          username: appUser.username,
          role: appUser.role,
          status: appUser.status || 'active',
          email: appUser.email,
          avatarUrl: appUser.avatar_url,
        });

        // Redirect based on role
        const redirectPath = appUser.role === 'admin' ? '/admin' : '/dashboard';
        router.push(redirectPath);
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message || 'An unexpected error occurred');
        setLoading(false);
        setTimeout(() => {
          router.push('/login?error=callback_failed');
        }, 2000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

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
      <div style={{ textAlign: 'center' }}>
        {loading ? (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Completing sign in...
            </h1>
            <p style={{ opacity: 0.8 }}>Please wait while we set up your account.</p>
          </>
        ) : error ? (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fca5a5' }}>
              Sign in failed
            </h1>
            <p style={{ opacity: 0.8 }}>{error}</p>
            <p style={{ opacity: 0.6, marginTop: '1rem', fontSize: '0.9rem' }}>
              Redirecting to login...
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}

