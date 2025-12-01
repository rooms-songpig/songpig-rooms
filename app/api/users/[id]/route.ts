import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/app/lib/users';

// GET /api/users/[id] - Get a specific user (public info: role, bio, username)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await userStore.getUser(id);

    if (!user || user.status === 'deleted') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return public user info only (no password, email, etc.)
    const publicUserInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      bio: user.bio,
    };

    return NextResponse.json({ user: publicUserInfo });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update a user (admin or self)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { role, status, username, bio, allowManagedUploads, maxCloudSongs } = body;

    const user = await userStore.getUser(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is updating themselves or is admin
    const isSelfUpdate = userId === id;
    const isAdmin = userRole === 'admin';

    // Only allow self-updates for username and bio
    if (isSelfUpdate && !isAdmin) {
      const updates: any = {};
      if (username !== undefined) {
        updates.username = username;
      }
      if (bio !== undefined) {
        updates.bio = bio;
      }
      // Prevent self from changing role or status
      if (role || status) {
        return NextResponse.json(
          { error: 'Cannot change role or status' },
          { status: 403 }
        );
      }

      const updatedUser = await userStore.updateUser(id, updates);
      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      const { passwordHash, ...userResponse } = updatedUser;
      return NextResponse.json({ user: userResponse });
    }

    // Admin-only updates (role, status)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required for this operation' },
        { status: 403 }
      );
    }

    // Prevent disabling/deleting admin accounts
    if (user.role === 'admin' && status && status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot disable or delete admin accounts' },
        { status: 400 }
      );
    }

    // Prevent changing admin role
    if (user.role === 'admin' && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot change admin role' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (role && ['admin', 'artist', 'listener'].includes(role)) {
      updates.role = role;
    }
    if (status && ['active', 'disabled', 'deleted'].includes(status)) {
      updates.status = status;
    }
    if (username !== undefined) {
      updates.username = username;
    }
    if (bio !== undefined) {
      updates.bio = bio;
    }
    // Admin-only: managed uploads settings
    if (allowManagedUploads !== undefined && isAdmin) {
      updates.allowManagedUploads = allowManagedUploads;
    }
    if (maxCloudSongs !== undefined && isAdmin && typeof maxCloudSongs === 'number' && maxCloudSongs >= 0) {
      updates.maxCloudSongs = maxCloudSongs;
    }

    const updatedUser = await userStore.updateUser(id, updates);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    const { passwordHash, ...userResponse } = updatedUser;
    return NextResponse.json({ user: userResponse });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.message === 'Username already exists') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

