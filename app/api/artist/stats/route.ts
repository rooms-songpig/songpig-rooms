import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/artist/stats - Get stats for an artist's rooms
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get all rooms owned by this artist
    const { data: rooms, error: roomsError } = await supabaseServer
      .from('rooms')
      .select('id, name')
      .eq('artist_id', userId)
      .neq('status', 'deleted');

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError);
      return NextResponse.json(
        { error: 'Failed to fetch rooms' },
        { status: 500 }
      );
    }

    const roomIds = rooms?.map(r => r.id) || [];

    if (roomIds.length === 0) {
      return NextResponse.json({
        stats: {
          totalRooms: 0,
          totalSongs: 0,
          totalComparisons: 0,
          totalComments: 0,
        },
        recentComments: [],
        songStats: [],
      });
    }

    // Get all songs in artist's rooms
    const { data: songs, error: songsError } = await supabaseServer
      .from('songs')
      .select('id, title, room_id')
      .in('room_id', roomIds);

    if (songsError) {
      console.error('Error fetching songs:', songsError);
    }

    const songIds = songs?.map(s => s.id) || [];

    // Get all comparisons in artist's rooms
    const { data: comparisons, error: comparisonsError } = await supabaseServer
      .from('comparisons')
      .select('id, song_a_id, song_b_id, winner_id, room_id')
      .in('room_id', roomIds);

    if (comparisonsError) {
      console.error('Error fetching comparisons:', comparisonsError);
    }

    // Get recent comments on artist's songs (last 20)
    const { data: recentComments, error: commentsError } = await supabaseServer
      .from('comments')
      .select('id, text, author_username, song_id, room_id, created_at, is_anonymous')
      .in('room_id', roomIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
    }

    // Get total comment count
    const { count: totalComments } = await supabaseServer
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .in('room_id', roomIds);

    // Calculate song stats (win rates)
    const songStats = (songs || []).map(song => {
      const songComparisons = (comparisons || []).filter(
        c => c.song_a_id === song.id || c.song_b_id === song.id
      );
      const wins = songComparisons.filter(c => c.winner_id === song.id).length;
      const total = songComparisons.length;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

      const room = rooms?.find(r => r.id === song.room_id);

      return {
        songId: song.id,
        songTitle: song.title,
        roomId: song.room_id,
        roomName: room?.name || 'Unknown Room',
        wins,
        losses: total - wins,
        totalComparisons: total,
        winRate,
      };
    });

    // Enrich recent comments with song titles
    const enrichedComments = (recentComments || []).map(comment => {
      const song = songs?.find(s => s.id === comment.song_id);
      const room = rooms?.find(r => r.id === comment.room_id);
      return {
        id: comment.id,
        text: comment.text,
        authorUsername: comment.is_anonymous ? 'Anonymous' : comment.author_username,
        songId: comment.song_id,
        songTitle: song?.title || 'Unknown Song',
        roomId: comment.room_id,
        roomName: room?.name || 'Unknown Room',
        createdAt: comment.created_at,
      };
    });

    return NextResponse.json({
      stats: {
        totalRooms: rooms?.length || 0,
        totalSongs: songs?.length || 0,
        totalComparisons: comparisons?.length || 0,
        totalComments: totalComments || 0,
      },
      recentComments: enrichedComments,
      songStats: songStats.sort((a, b) => b.totalComparisons - a.totalComparisons),
    });
  } catch (error) {
    console.error('Error in artist stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

