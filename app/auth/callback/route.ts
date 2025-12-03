import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// GET /auth/callback - Handle OAuth callback from Supabase
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', requestUrl.origin)
    );
  }

  try {
    // Exchange code for session
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !authData.session || !authData.user) {
      console.error('Error exchanging code for session:', authError);
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      );
    }

    const { user, session } = authData;

    // Sync user with app's users table
    const syncResponse = await fetch(`${requestUrl.origin}/api/auth/sync`, {
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
      console.error('Error syncing user:', await syncResponse.text());
      return NextResponse.redirect(
        new URL('/login?error=sync_failed', requestUrl.origin)
      );
    }

    const { user: appUser } = await syncResponse.json();

    // Set session cookie for the app (for server-side auth checks)
    const cookieStore = await cookies();
    cookieStore.set('supabase-auth-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Redirect to dashboard with user info in URL hash (client will read and set localStorage)
    // Using hash instead of query params for security (hash is not sent to server)
    const redirectPath = appUser.role === 'admin' ? '/admin' : '/dashboard';
    const redirectUrl = new URL(redirectPath, requestUrl.origin);
    redirectUrl.hash = `oauth_success=${encodeURIComponent(JSON.stringify({
      id: appUser.id,
      username: appUser.username,
      role: appUser.role,
      status: appUser.status,
      email: appUser.email,
      avatarUrl: appUser.avatar_url,
    }))}`;
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=callback_failed', requestUrl.origin)
    );
  }
}

