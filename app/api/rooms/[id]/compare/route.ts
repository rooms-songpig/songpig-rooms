import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';

// POST /api/rooms/[id]/compare - Add a comparison vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { songAId, songBId, winnerId, userId: bodyUserId } = body;
    const headerUserId = request.headers.get('x-user-id');
    const userId = bodyUserId || headerUserId;

    if (!songAId || !songBId || !winnerId || !userId) {
      return NextResponse.json(
        { error: 'songAId, songBId, winnerId, and userId are required' },
        { status: 400 }
      );
    }

    // Verify winner is one of the two songs
    if (winnerId !== songAId && winnerId !== songBId) {
      return NextResponse.json(
        { error: 'winnerId must be either songAId or songBId' },
        { status: 400 }
      );
    }

    const success = dataStore.addComparison(id, songAId, songBId, winnerId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Room or songs not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add comparison' },
      { status: 500 }
    );
  }
}

// GET /api/rooms/[id]/compare - Get next comparison pair for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get('userId');

    // Use header userId if available, otherwise fall back to query param
    const finalUserId = userId || queryUserId;

    if (!finalUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const pair = dataStore.getNextComparisonPair(id, finalUserId);

    if (!pair.songA || !pair.songB) {
      return NextResponse.json(
        { error: 'Not enough songs in room for comparison' },
        { status: 400 }
      );
    }

    return NextResponse.json({ songA: pair.songA, songB: pair.songB });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get comparison pair' },
      { status: 500 }
    );
  }
}

