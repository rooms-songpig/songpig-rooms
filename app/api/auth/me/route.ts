import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/app/lib/users';

// GET /api/auth/me - Get current user from session
export async function GET(request: NextRequest) {
  try {
    // Get user ID from header (set by client after login)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = userStore.getUser(userId);

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Return user without password hash
    const { passwordHash, ...userResponse } = user;

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

