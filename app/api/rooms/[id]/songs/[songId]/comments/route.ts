import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';
import { userStore } from '@/app/lib/users';

// POST /api/rooms/[id]/songs/[songId]/comments - Add a comment to a song
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
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

    const { id, songId } = await params;
    const body = await request.json();
    const { text, isAnonymous, parentCommentId } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const comment = dataStore.addComment(
      id,
      songId,
      userId,
      user.username,
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

