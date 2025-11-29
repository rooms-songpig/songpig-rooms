import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';

// GET /api/rooms/[id]/winrate/[songId] - Get win rate for a song
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const { id, songId } = await params;
    const winRate = await dataStore.getWinRate(id, songId);
    return NextResponse.json(winRate);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch win rate' },
      { status: 500 }
    );
  }
}

