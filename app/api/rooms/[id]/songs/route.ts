import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';
import { userStore } from '@/app/lib/users';

// POST /api/rooms/[id]/songs - Add a song to a room (artist only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const room = dataStore.getRoom(id);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only room owner (artist) can add songs
    if (room.artistId !== userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the room owner can add songs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, url } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    const song = dataStore.addSong(id, title, url, user.username, userId);

    if (!song) {
      return NextResponse.json({ error: 'Failed to add song' }, { status: 500 });
    }

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    console.error('Error adding song:', error);
    return NextResponse.json(
      { error: 'Failed to add song' },
      { status: 500 }
    );
  }
}

