import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';
import { userStore } from '@/app/lib/users';

// GET /api/rooms - Get rooms for current user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as 'admin' | 'artist' | 'listener' | null;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = userStore.getUser(userId);
    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 401 }
      );
    }

    // Get status filter from query parameter
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') as 'all' | 'active' | 'draft' | 'archived' | null;
    
    // Get rooms based on user role and status filter
    const rooms = dataStore.getRoomsForUser(userId, user.role, statusFilter || undefined);
    
    console.log(`GET /api/rooms: Returning ${rooms.length} rooms for user ${userId} (${user.role}), filter: ${statusFilter || 'default (draft+active)'}`);
    
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create a new room (artist only)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = userStore.getUser(userId);
    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 401 }
      );
    }

    // Only artists and admins can create rooms
    if (user.role !== 'artist' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only artists can create rooms' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    const room = dataStore.createRoom(
      name.trim(),
      description?.trim() || '',
      userId // artistId
    );

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

