import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { userStore } from '@/app/lib/users';

// PATCH /api/rooms/[id]/meta - Update room metadata (admin/owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as
      | 'admin'
      | 'artist'
      | 'listener'
      | null;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { name, description, isStarterRoom } = await request.json();

    // Load room to check ownership
    const { data: roomData, error: roomError } = await supabaseServer
      .from('rooms')
      .select('artist_id, status, is_starter_room')
      .eq('id', id)
      .single();

    if (roomError || !roomData) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const isAdmin = userRole === 'admin';
    const isOwner = roomData.artist_id === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Only the room owner or admin can edit room metadata' },
        { status: 403 }
      );
    }

    const updates: Record<string, any> = {};

    if (typeof name === 'string' && name.trim().length > 0) {
      updates.name = name.trim();
    }
    if (typeof description === 'string') {
      updates.description = description;
    }

    if (typeof isStarterRoom === 'boolean') {
      // Only admins can toggle starter room flag
      const adminUser = await userStore.getUser(userId);
      if (!adminUser || adminUser.role !== 'admin' || adminUser.status !== 'active') {
        return NextResponse.json(
          { error: 'Admin access required to change starter room flag' },
          { status: 403 }
        );
      }
      updates.is_starter_room = isStarterRoom;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabaseServer
      .from('rooms')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update room metadata', updateError);
      return NextResponse.json(
        { error: 'Failed to update room metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating room metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update room metadata' },
      { status: 500 }
    );
  }
}





