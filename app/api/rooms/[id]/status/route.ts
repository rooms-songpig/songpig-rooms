import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';
import { userStore } from '@/app/lib/users';

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

    const user = userStore.getUser(userId);
    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const room = dataStore.getRoom(id);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only room owner or admin can change status
    if (room.artistId !== userId && user.role !== 'admin') {
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
    const success = dataStore.updateRoomStatus(id, status);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update room status' },
        { status: 500 }
      );
    }

    // Return updated room
    const updatedRoom = dataStore.getRoom(id);
    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error('Error updating room status:', error);
    return NextResponse.json(
      { error: 'Failed to update room status' },
      { status: 500 }
    );
  }
}

