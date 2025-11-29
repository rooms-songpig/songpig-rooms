import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/app/lib/users';

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const user = await userStore.getUser(userId);
    if (!user || user.role !== 'admin' || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const users = await userStore.getAllUsers();
    // Remove password hashes
    const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);

    return NextResponse.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Verify admin user exists and is active
    const adminUser = await userStore.getUser(userId);
    if (!adminUser || adminUser.role !== 'admin' || adminUser.status !== 'active') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, email, role } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 2 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be 2-30 characters' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    // Validate role (only artist or listener, not admin)
    const validRole = role === 'artist' ? 'artist' : 'listener';

    // Create the user
    const newUser = await userStore.createUser(
      username.trim(),
      password,
      email?.trim() || undefined,
      validRole
    );

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = newUser;

    return NextResponse.json({ 
      user: userWithoutPassword,
      message: `User "${username}" created successfully`
    });
  } catch (error) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

