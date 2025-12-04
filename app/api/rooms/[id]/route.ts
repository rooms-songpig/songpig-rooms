import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';
import { userStore } from '@/app/lib/users';
import { supabaseServer } from '@/app/lib/supabase-server';

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

    // Retry room lookup with exponential backoff (for newly created rooms)
    console.log('Fetching room:', id, 'userId:', userId || 'not set');
    let room = await dataStore.getRoom(id);
    let retries = 0;
    const maxRetries = 5;
    const initialDelay = 500;
    
    while (!room && retries < maxRetries) {
      console.log(`Room not found, retrying... (${retries + 1}/${maxRetries}), roomId: ${id}`);
      const delay = Math.min(initialDelay * (retries + 1), 3000); // 500ms, 1000ms, 1500ms, 2000ms, 2500ms
      await new Promise(resolve => setTimeout(resolve, delay));
      room = await dataStore.getRoom(id);
      retries++;
    }

    if (!room) {
      console.error('Room not found after all retries:', id);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    console.log('Room found:', room.id, room.name);

    // Enforce status-based visibility
    // Draft rooms: only owner and admins can view
    if (
      room.status === 'draft' &&
      userRole !== 'admin' &&
      room.artistId !== (userId || '')
    ) {
      return NextResponse.json(
        { error: 'You do not have access to this room' },
        { status: 403 }
      );
    }

    // Deleted rooms: hidden from everyone except admins (treat as 404 for non-admins)
    if (room.status === 'deleted' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check access permissions
    if (userRole === 'admin') {
      // Admins can access any room
      // Update lastAccessed timestamp
      await supabaseServer
        .from('rooms')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', room.id);
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
    await supabaseServer
      .from('rooms')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', room.id);
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

