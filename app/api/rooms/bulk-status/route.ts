import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';

// PATCH /api/rooms/bulk-status - Update status for multiple rooms
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as 'admin' | 'artist' | 'listener' | null;

    if (!userId || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { roomIds, status } = body;

    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      return NextResponse.json(
        { error: 'roomIds array is required' },
        { status: 400 }
      );
    }

    if (!status || !['draft', 'active', 'archived', 'deleted'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (draft, active, archived, deleted)' },
        { status: 400 }
      );
    }

    let updated = 0;
    for (const roomId of roomIds) {
      const success = await dataStore.updateRoomStatus(roomId, status);
      if (success) {
        updated++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      updated,
      message: `Updated ${updated} room(s) to ${status}` 
    });
  } catch (error) {
    console.error('Error updating bulk room status:', error);
    return NextResponse.json(
      { error: 'Failed to update room statuses' },
      { status: 500 }
    );
  }
}

