import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/app/lib/users';

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, username, password } = body;

    // Support both new `identifier` field and legacy `username` field from older clients
    const loginIdentifier: string | undefined = identifier ?? username;

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: 'Email or username and password are required' },
        { status: 400 }
      );
    }

    const user = await userStore.authenticate(loginIdentifier, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    // Return user without password hash
    const { passwordHash, ...userResponse } = user;

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}

