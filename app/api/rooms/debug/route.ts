import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { userStore } from '@/app/lib/users';

// GET /api/rooms/debug - Raw rooms view for admins (Excel-style export)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Verify the caller is an active admin
    const adminUser = await userStore.getUser(userId);
    if (!adminUser || adminUser.role !== 'admin' || adminUser.status !== 'active') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseServer
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching raw rooms for debug:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rooms debug data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rooms: data ?? [] });
  } catch (error) {
    console.error('Error in /api/rooms/debug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms debug data' },
      { status: 500 }
    );
  }
}





