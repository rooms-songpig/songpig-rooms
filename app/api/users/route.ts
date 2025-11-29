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

