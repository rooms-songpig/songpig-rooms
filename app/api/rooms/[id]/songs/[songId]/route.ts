import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';

// DELETE /api/rooms/[id]/songs/[songId] - Remove a song from a room (draft only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as 'admin' | 'artist' | 'listener' | null;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Trust the headers - no database verification needed
    const role = userRole || 'listener';

    const { id, songId } = await params;
    const room = await dataStore.getRoom(id);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only room owner or admin can remove songs
    if (room.artistId !== userId && role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the room owner can remove songs' },
        { status: 403 }
      );
    }

    // Only allow removal in draft rooms
    if (room.status !== 'draft') {
      return NextResponse.json(
        { error: 'Songs can only be removed from draft rooms' },
        { status: 400 }
      );
    }

    const success = await dataStore.removeSong(id, songId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove song or song not found' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing song:', error);
    return NextResponse.json(
      { error: 'Failed to remove song' },
      { status: 500 }
    );
  }
}
