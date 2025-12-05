import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { normalizeText } from '@/app/lib/utils';

interface StarterRoomSummary {
  id: string;
  name: string;
  artistName?: string;
  artistHandle?: string;
  createdAt: string;
}

interface ReviewedRoomSummary {
  id: string;
  name: string;
  artistName?: string;
  artistHandle?: string;
  lastReviewedAt: string;
  preferredSongTitle?: string;
}

// GET /api/rooms/reviewer - Rooms available to and reviewed by the current reviewer
export async function GET(request: NextRequest) {
  try {
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

    // This endpoint is primarily for reviewers, but allow admins for debugging
    const role = userRole || 'listener';

    // 1) Rooms the user has already reviewed
    const { data: comparisonsData, error: comparisonsError } =
      await supabaseServer
        .from('comparisons')
        .select('room_id, winner_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (comparisonsError) {
      console.error('Error fetching reviewer comparisons:', comparisonsError);
    }

    const latestByRoom = new Map<
      string,
      { lastReviewedAt: string; preferredSongId: string | null }
    >();

    if (comparisonsData) {
      for (const row of comparisonsData as {
        room_id: string;
        winner_id: string;
        created_at: string;
      }[]) {
        if (!latestByRoom.has(row.room_id)) {
          latestByRoom.set(row.room_id, {
            lastReviewedAt: row.created_at,
            preferredSongId: row.winner_id,
          });
        }
      }
    }

    const reviewedRoomIds = Array.from(latestByRoom.keys());

    // Shared map so we can reuse artist handles for starter rooms as well
    const artistHandleById = new Map<string, string>();

    let reviewedRooms: ReviewedRoomSummary[] = [];

    if (reviewedRoomIds.length > 0) {
      // Load basic room info (including artist_id so we can resolve handles)
      const { data: roomsData, error: roomsError } = await supabaseServer
        .from('rooms')
        .select('id, name, artist_name, artist_id')
        .in('id', reviewedRoomIds)
        .neq('status', 'deleted');

      if (!roomsError && roomsData) {
        const typedRooms = roomsData as {
          id: string;
          name: string;
          artist_name: string | null;
          artist_id: string | null;
        }[];

        // Load song titles to resolve preferred version
        const { data: songsData, error: songsError } = await supabaseServer
          .from('songs')
          .select('id, room_id, title')
          .in('room_id', reviewedRoomIds);

        const songTitleById = new Map<string, string>();
        if (!songsError && songsData) {
          for (const s of songsData as {
            id: string;
            room_id: string;
            title: string;
          }[]) {
            songTitleById.set(s.id, s.title);
          }
        }

        // Resolve artist handles in one query
        const artistIds = Array.from(
          new Set(
            typedRooms
              .map((r) => r.artist_id)
              .filter((id): id is string => !!id)
          )
        );
        
        if (artistIds.length > 0) {
          const { data: artistsData, error: artistsError } = await supabaseServer
            .from('users')
            .select('id, username')
            .in('id', artistIds);

          if (!artistsError && artistsData) {
            for (const u of artistsData as { id: string; username: string }[]) {
              artistHandleById.set(u.id, u.username);
            }
          }
        }

        reviewedRooms = typedRooms.map((r) => {
          const meta = latestByRoom.get(r.id)!;
          const preferredSongTitle = meta.preferredSongId
            ? songTitleById.get(meta.preferredSongId) || undefined
            : undefined;

          const artistHandle = r.artist_id
            ? artistHandleById.get(r.artist_id) || undefined
            : undefined;

          return {
            id: r.id,
            name: r.name,
            artistName: r.artist_name || undefined,
            artistHandle,
            lastReviewedAt: meta.lastReviewedAt,
            preferredSongTitle,
          };
        });

        // Sort by lastReviewedAt (desc)
        reviewedRooms.sort(
          (a, b) =>
            new Date(b.lastReviewedAt).getTime() -
            new Date(a.lastReviewedAt).getTime()
        );
      }
    }

    // 2) Starter Rooms available to this reviewer (active + not yet reviewed)
    const { data: starterRoomsData, error: starterRoomsError } =
      await supabaseServer
        .from('rooms')
        .select('id, name, artist_name, artist_id, created_at, is_starter_room, status')
        .eq('is_starter_room', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (starterRoomsError) {
      console.error('Error fetching starter rooms:', starterRoomsError);
    }

    const reviewedRoomIdSet = new Set(reviewedRoomIds);

    // Ensure we have handles for starter room artists too
    if (starterRoomsData && starterRoomsData.length > 0) {
      const starterArtistIds = Array.from(
        new Set(
          (starterRoomsData as { artist_id: string | null }[])
            .map((r) => r.artist_id)
            .filter((id): id is string => !!id && !artistHandleById.has(id))
        )
      );

      if (starterArtistIds.length > 0) {
        const { data: starterArtists, error: starterArtistsError } =
          await supabaseServer
            .from('users')
            .select('id, username')
            .in('id', starterArtistIds);

        if (!starterArtistsError && starterArtists) {
          for (const u of starterArtists as { id: string; username: string }[]) {
            if (!artistHandleById.has(u.id)) {
              artistHandleById.set(u.id, u.username);
            }
          }
        }
      }
    }

    const starterRooms: StarterRoomSummary[] =
      starterRoomsData
        ?.filter((r: any) => !reviewedRoomIdSet.has(r.id))
        .map((r: any) => ({
          id: r.id,
          name: normalizeText(r.name),
          artistName: r.artist_name || undefined,
          artistHandle: r.artist_id ? artistHandleById.get(r.artist_id) || undefined : undefined,
          createdAt: r.created_at,
        })) || [];

    return NextResponse.json({
      role,
      starterRooms,
      reviewedRooms,
    });
  } catch (error) {
    console.error('Error in /api/rooms/reviewer:', error);
    return NextResponse.json(
      { error: 'Failed to load reviewer rooms' },
      { status: 500 }
    );
  }
}





