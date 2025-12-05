import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/app/lib/data';
import { supabaseServer } from '@/app/lib/supabase-server';

// GET /api/rooms/invite/[code] - Get room by invite code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // First, check if any room exists for this invite code
    const { data, error } = await supabaseServer
      .from('rooms')
      .select('id, status')
      .eq('invite_code', code.toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Room not found', errorCode: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (data.status !== 'active') {
      return NextResponse.json(
        {
          error: 'Room is not currently accepting visitors',
          errorCode: 'ROOM_NOT_ACTIVE',
          status: data.status,
        },
        { status: 403 }
      );
    }

    // Load full room (only for active rooms)
    const room = await dataStore.getRoomByInviteCode(code);

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found', errorCode: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

