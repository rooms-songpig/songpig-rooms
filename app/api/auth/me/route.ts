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

    // Retry user lookup for newly registered users
    let user = await userStore.getUser(userId);
    let retries = 0;
    const maxRetries = 5;
    
    while (!user && retries < maxRetries) {
      console.log(`User not found in /api/auth/me, retrying... (${retries + 1}/${maxRetries}), userId: ${userId}`);
      await new Promise(resolve => setTimeout(resolve, 300 * (retries + 1))); // 300ms, 600ms, 900ms, 1200ms, 1500ms
      user = await userStore.getUser(userId);
      retries++;
    }

    if (!user || user.status !== 'active') {
      if (!user) {
        console.error('User not found after retries in /api/auth/me:', userId);
      } else {
        console.error('User found but status is not active:', user.status, 'userId:', userId);
      }
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

