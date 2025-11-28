import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/app/lib/users';

// POST /api/auth/register - Register a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email, role } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Only allow artist or listener roles (admin must be created separately)
    const userRole = role === 'artist' ? 'artist' : 'listener';

    try {
      const user = userStore.createUser(username, password, email, userRole);
      
      // Return user without password hash
      const { passwordHash, ...userResponse } = user;
      
      return NextResponse.json({ user: userResponse }, { status: 201 });
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

