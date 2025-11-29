import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';

// GET /api/rooms/invite/[code] - Get room by invite code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await dataStore.getRoomByInviteCode(code);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

