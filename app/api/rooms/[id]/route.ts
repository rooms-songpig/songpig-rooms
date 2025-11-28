import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';
import { userStore } from '@/app/lib/users';

// GET /api/rooms/[id] - Get a specific room (with access control)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as 'admin' | 'artist' | 'listener' | null;
    
    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const room = dataStore.getRoom(id);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check access permissions
    if (userRole === 'admin') {
      // Admins can access any room
      return NextResponse.json({ room });
    }

    if (!userId) {
      // Allow guest access (read-only) - they can view and listen but not vote/comment
      // Access will be checked when they try to interact
      return NextResponse.json({ room });
    }

    // Check if user owns the room or is invited
    const hasAccess = 
      room.artistId === userId || 
      (userRole === 'artist' && room.invitedArtistIds?.includes(userId));

    if (!hasAccess && room.accessType === 'private') {
      return NextResponse.json(
        { error: 'You do not have access to this room' },
        { status: 403 }
      );
    }

    // Update lastAccessed timestamp
    room.lastAccessed = Date.now();
    
    // Allow access (either owner, invited, or public invite-code room)
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

