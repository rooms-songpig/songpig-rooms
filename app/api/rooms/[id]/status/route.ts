import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';

// PATCH /api/rooms/[id]/status - Update room status (owner/admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const room = await dataStore.getRoom(id);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only room owner or admin can change status
    if (room.artistId !== userId && role !== 'admin') {
      return NextResponse.json(
        { error: 'Only room owner or admin can change status' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['draft', 'active', 'archived', 'deleted'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: draft, active, archived, or deleted' },
        { status: 400 }
      );
    }

    // Update room status
    const success = await dataStore.updateRoomStatus(id, status);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update room status' },
        { status: 500 }
      );
    }

    // Return updated room
    const updatedRoom = await dataStore.getRoom(id);
    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error('Error updating room status:', error);
    return NextResponse.json(
      { error: 'Failed to update room status' },
      { status: 500 }
    );
  }
}
