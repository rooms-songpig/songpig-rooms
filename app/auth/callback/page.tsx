'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/app/lib/supabase-browser';
import { setCurrentUser } from '@/app/lib/auth-helpers';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        // 1) Handle explicit error from provider/Supabase
        const errorParam = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');

        if (errorParam) {
          if (!cancelled) {
            setError(errorDescription || errorParam);
            setLoading(false);
            setTimeout(() => {
              router.push(
                `/login?error=${encodeURIComponent(
                  errorDescription || errorParam
                )}`
              );
            }, 2000);
          }
          return;
        }

        // 2) Get selected signup role (for Google sign-up flow)
        const signupRoleParam = searchParams?.get('signupRole');
        const signupRole =
          signupRoleParam === 'artist' || signupRoleParam === 'listener'
            ? signupRoleParam
            : undefined;

        // 3) Parse tokens from URL hash (Supabase returns them here)
        const hash =
          typeof window !== 'undefined' ? window.location.hash : '';
        const hashParams = new URLSearchParams(
          hash.startsWith('#') ? hash.slice(1) : hash
        );

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // 4) If we have tokens in the hash, set the session explicitly
        let user: any | null = null;

        if (accessToken && refreshToken) {
          const {
            data: { session },
            error: setSessionError,
          } = await supabaseBrowser.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError || !session || !session.user) {
            console.error('Error setting session from tokens:', setSessionError);
          } else {
            user = session.user;
          }
        }

        // 5) Fallback: if we still don't have a user, try getSession()
        if (!user) {
          const {
            data: { session: existingSession },
            error: sessionError,
          } = await supabaseBrowser.auth.getSession();

          if (sessionError) {
            console.error('Error getting existing session:', sessionError);
          }

          if (existingSession && existingSession.user) {
            user = existingSession.user;
          }
        }

        if (!user) {
          if (!cancelled) {
            setError('Failed to complete sign-in');
            setLoading(false);
            setTimeout(() => {
              router.push('/login?error=auth_failed');
            }, 2000);
          }
          return;
        }

        // 6) Sync user with app's users table
        const syncResponse = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseUserId: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatarUrl:
              user.user_metadata?.avatar_url || user.user_metadata?.picture,
            role: signupRole,
          }),
        });

        if (!syncResponse.ok) {
          const errorText = await syncResponse.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          console.error('Error syncing user:', errorData);
          if (!cancelled) {
            setError(
              errorData.details
                ? `Failed to sync: ${errorData.details}`
                : 'Failed to sync user account'
            );
            setLoading(false);
            setTimeout(() => {
              router.push(
                `/login?error=${encodeURIComponent(
                  errorData.details || 'sync_failed'
                )}`
              );
            }, 3000);
          }
          return;
        }

        const { user: appUser } = await syncResponse.json();

        if (!cancelled) {
          // 7) Persist user in localStorage for the app
          setCurrentUser({
            id: appUser.id,
            username: appUser.username,
            role: appUser.role,
            status: appUser.status || 'active',
            email: appUser.email,
            avatarUrl: appUser.avatar_url,
          });

          // 8) Redirect based on role with welcome banner hint
          const isArtist = appUser.role === 'artist';
          const isReviewer = appUser.role === 'listener';
          const basePath = appUser.role === 'admin' ? '/admin' : '/dashboard';
          const welcomeParam = isArtist
            ? 'artist'
            : isReviewer
            ? 'reviewer'
            : null;

          const redirectPath =
            basePath + (welcomeParam ? `?welcome=${welcomeParam}` : '');
          router.push(redirectPath);
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        if (!cancelled) {
          setError(err.message || 'An unexpected error occurred');
          setLoading(false);
          setTimeout(() => {
            router.push('/login?error=callback_failed');
          }, 2000);
        }
      }
    };

    handleCallback();

    return () => {
      cancelled = true;
    };
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
            <p style={{ opacity: 0.8 }}>
              Please wait while we set up your account.
            </p>
          </>
        ) : error ? (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
            <h1
              style={{
                fontSize: '1.5rem',
                marginBottom: '0.5rem',
                color: '#fca5a5',
              }}
            >
              Sign in failed
            </h1>
            <p style={{ opacity: 0.8 }}>{error}</p>
            <p
              style={{
                opacity: 0.6,
                marginTop: '1rem',
                fontSize: '0.9rem',
              }}
            >
              Redirecting to login...
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
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
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Loading...
            </h1>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

