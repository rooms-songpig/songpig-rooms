import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';

// POST /api/rooms/[id]/songs/[songId]/comments - Add a comment to a song
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Trust the headers - no database verification needed
    const username = userName || 'Unknown';

    const { id, songId } = await params;
    const body = await request.json();
    const { text, isAnonymous, parentCommentId } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const comment = await dataStore.addComment(
      id,
      songId,
      userId,
      username,
      text.trim(),
      isAnonymous === true,
      parentCommentId
    );

    if (!comment) {
      return NextResponse.json(
        { error: 'Room or song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
