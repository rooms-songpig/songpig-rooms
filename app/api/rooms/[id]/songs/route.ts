import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';

// POST /api/rooms/[id]/songs - Add a song to a room (artist only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as 'admin' | 'artist' | 'listener' | null;
    const userName = request.headers.get('x-user-name');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Trust the headers - no database verification needed
    const role = userRole || 'listener';
    const username = userName || 'Unknown';

    const { id } = await params;
    console.log('Adding song - User:', userId, 'Room:', id);

    const room = await dataStore.getRoom(id);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only room owner (artist) can add songs
    if (room.artistId !== userId && role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the room owner can add songs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, url, sourceType = 'direct' } = body as {
      title?: string;
      url?: string;
      sourceType?: 'direct' | 'soundcloud' | 'soundcloud_embed';
    };

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    if (!['direct', 'soundcloud', 'soundcloud_embed'].includes(sourceType)) {
      return NextResponse.json(
        { error: 'Invalid audio source type' },
        { status: 400 }
      );
    }

    if (sourceType === 'soundcloud' && !url.includes('soundcloud.com')) {
      return NextResponse.json(
        { error: 'SoundCloud links must include soundcloud.com' },
        { status: 400 }
      );
    }

    // For soundcloud_embed, the URL should be the w.soundcloud.com/player src
    if (sourceType === 'soundcloud_embed' && !url.includes('w.soundcloud.com/player')) {
      return NextResponse.json(
        { error: 'SoundCloud embed URL must be from w.soundcloud.com/player' },
        { status: 400 }
      );
    }

    const song = await dataStore.addSong(id, title, url, username, userId, sourceType);

    if (!song) {
      return NextResponse.json({ error: 'Failed to add song' }, { status: 500 });
    }

    console.log('Song added successfully:', song.id);
    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    console.error('Error adding song:', error);
    return NextResponse.json(
      { error: 'Failed to add song' },
      { status: 500 }
    );
  }
}
