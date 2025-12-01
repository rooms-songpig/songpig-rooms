import { normalizeText } from './utils';
import { userStore } from './users';
import { supabaseServer } from './supabase-server';
import { logger } from './logger';

// Data store interfaces
export interface Comment {
  id: string;
  songId: string;
  roomId: string;
  authorId: string;
  authorUsername: string;
  text: string;
  isAnonymous: boolean;
  parentCommentId?: string;
  isHidden: boolean;
  createdAt: number;
  updatedAt?: number;
}

export type SongSourceType = 'direct' | 'soundcloud' | 'soundcloud_embed';
export type SongStorageType = 'external' | 'cloudflare';

export interface Song {
  id: string;
  title: string;
  url: string;
  uploader: string;
  uploaderId: string;
  sourceType: SongSourceType;
  storageType: SongStorageType;
  storageKey?: string;
  comments: Comment[];
}

export interface Comparison {
  id: string;
  songAId: string;
  songBId: string;
  winnerId: string;
  userId: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  artistId: string;
  artistName?: string;
  artistBio?: string;
  invitedArtistIds: string[];
  inviteCode: string;
  accessType: 'private' | 'invited-artists' | 'invite-code';
  status: 'draft' | 'active' | 'archived' | 'deleted';
  createdAt: number;
  updatedAt?: number;
  lastAccessed?: number;
  songs: Song[];
  comparisons: Comparison[];
}

// Database types (snake_case)
interface DbRoom {
  id: string;
  name: string;
  description: string;
  artist_id: string;
  artist_name: string | null;
  artist_bio: string | null;
  invite_code: string;
  access_type: 'private' | 'invited-artists' | 'invite-code';
  status: 'draft' | 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string | null;
  last_accessed: string | null;
}

interface DbSong {
  id: string;
  room_id: string;
  title: string;
  url: string;
  uploader: string;
  uploader_id: string;
  source_type: SongSourceType | null;
  storage_type: SongStorageType | null;
  storage_key: string | null;
  created_at: string;
}

interface DbComment {
  id: string;
  song_id: string;
  room_id: string;
  author_id: string;
  author_username: string;
  text: string;
  is_anonymous: boolean;
  parent_comment_id: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string | null;
}

interface DbComparison {
  id: string;
  room_id: string;
  song_a_id: string;
  song_b_id: string;
  winner_id: string;
  user_id: string;
  created_at: string;
}

// Helper: Generate invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper: Convert DB comment to app comment
function dbCommentToComment(db: DbComment): Comment {
  return {
    id: db.id,
    songId: db.song_id,
    roomId: db.room_id,
    authorId: db.author_id,
    authorUsername: db.author_username,
    text: db.text,
    isAnonymous: db.is_anonymous,
    parentCommentId: db.parent_comment_id || undefined,
    isHidden: db.is_hidden,
    createdAt: new Date(db.created_at).getTime(),
    updatedAt: db.updated_at ? new Date(db.updated_at).getTime() : undefined,
  };
}

// Helper: Convert DB song to app song (with comments)
function dbSongToSong(db: DbSong, comments: Comment[]): Song {
  return {
    id: db.id,
    title: db.title,
    url: db.url,
    uploader: db.uploader,
    uploaderId: db.uploader_id,
    sourceType: db.source_type || 'direct',
    storageType: db.storage_type || 'external',
    storageKey: db.storage_key || undefined,
    comments,
  };
}

// Helper: Convert DB comparison to app comparison
function dbComparisonToComparison(db: DbComparison): Comparison {
  return {
    id: db.id,
    songAId: db.song_a_id,
    songBId: db.song_b_id,
    winnerId: db.winner_id,
    userId: db.user_id,
    timestamp: new Date(db.created_at).getTime(),
  };
}

// Helper: Load full room with all nested data
async function loadFullRoom(dbRoom: DbRoom): Promise<Room> {
  const roomId = dbRoom.id;

  // Load songs
  const { data: songsData, error: songsError } = await supabaseServer
    .from('songs')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  const songs: Song[] = [];
  if (songsData && !songsError) {
    // Load comments for all songs
    const { data: commentsData, error: commentsError } = await supabaseServer
      .from('comments')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    const commentsMap = new Map<string, Comment[]>();
    if (commentsData && !commentsError) {
      for (const dbComment of commentsData as DbComment[]) {
        const comment = dbCommentToComment(dbComment);
        if (!commentsMap.has(comment.songId)) {
          commentsMap.set(comment.songId, []);
        }
        commentsMap.get(comment.songId)!.push(comment);
      }
    }

    // Build songs with their comments
    for (const dbSong of songsData as DbSong[]) {
      const songComments = commentsMap.get(dbSong.id) || [];
      songs.push(dbSongToSong(dbSong, songComments));
    }
  }

  // Load comparisons
  const { data: comparisonsData, error: comparisonsError } = await supabaseServer
    .from('comparisons')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  const comparisons: Comparison[] = [];
  if (comparisonsData && !comparisonsError) {
    comparisons.push(...(comparisonsData as DbComparison[]).map(dbComparisonToComparison));
  }

  // Load invited artists
  const { data: invitedData, error: invitedError } = await supabaseServer
    .from('room_invited_artists')
    .select('artist_id')
    .eq('room_id', roomId);

  const invitedArtistIds: string[] = [];
  if (invitedData && !invitedError) {
    invitedArtistIds.push(...invitedData.map((r: { artist_id: string }) => r.artist_id));
  }

  // Build room object
  const room: Room = {
    id: dbRoom.id,
    name: dbRoom.name,
    description: dbRoom.description,
    artistId: dbRoom.artist_id,
    artistName: dbRoom.artist_name || undefined,
    artistBio: dbRoom.artist_bio || undefined,
    invitedArtistIds,
    inviteCode: dbRoom.invite_code,
    accessType: dbRoom.access_type,
    status: dbRoom.status,
    createdAt: new Date(dbRoom.created_at).getTime(),
    updatedAt: dbRoom.updated_at ? new Date(dbRoom.updated_at).getTime() : undefined,
    lastAccessed: dbRoom.last_accessed ? new Date(dbRoom.last_accessed).getTime() : undefined,
    songs,
    comparisons,
  };

  // Fill in artist name/bio if missing
  if ((!room.artistName || room.artistBio === undefined) && room.artistId) {
    const owner = await userStore.getUser(room.artistId);
    if (owner) {
      if (!room.artistName && owner.username) {
        room.artistName = normalizeText(owner.username);
        // Update in DB
        await supabaseServer
          .from('rooms')
          .update({ artist_name: room.artistName })
          .eq('id', room.id);
      }
      if (room.artistBio === undefined && owner.bio) {
        room.artistBio = owner.bio;
        // Update in DB
        await supabaseServer
          .from('rooms')
          .update({ artist_bio: room.artistBio })
          .eq('id', room.id);
      }
    }
  }

  return room;
}

export const dataStore = {
  // Create a new room
  async createRoom(name: string, description: string, artistId: string): Promise<Room> {
    // Retry user lookup with exponential backoff (for newly registered users)
    // Use longer delays for newly created users due to read-after-write consistency
    let artistUser = await userStore.getUser(artistId);
    let retries = 0;
    const maxRetries = 10; // Increased retries
    const initialDelay = 500; // Start with 500ms delay
    
    while (!artistUser && retries < maxRetries) {
      const delay = Math.min(initialDelay * (retries + 1), 3000); // 500ms, 1000ms, 1500ms, etc. up to 3000ms
      logger.warn(`User not found in createRoom, retrying... (${retries + 1}/${maxRetries}), delay: ${delay}ms`, { artistId });
      await new Promise(resolve => setTimeout(resolve, delay));
      artistUser = await userStore.getUser(artistId);
      retries++;
    }
    
    if (!artistUser) {
      logger.error(`User ${artistId} not found after ${maxRetries} retries in createRoom. This may indicate a database consistency issue.`);
      // Still proceed - we'll use a fallback username
    }
    
    const resolvedArtistName = artistUser?.username ? normalizeText(artistUser.username) : 'Unknown Artist';
    const normalizedName = normalizeText(name);
    const suffix = resolvedArtistName ? ` - ${resolvedArtistName}` : '';
    const formattedName =
      normalizedName && suffix && !normalizedName.toLowerCase().endsWith(suffix.toLowerCase())
        ? `${normalizedName}${suffix}`
        : normalizedName || suffix || name;

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existingData } = await supabaseServer
        .from('rooms')
        .select('id')
        .eq('invite_code', inviteCode)
        .limit(1);
      const existing = existingData && existingData.length > 0 ? existingData[0] : null;
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const now = new Date().toISOString();
    const insertStartTime = Date.now();
    const { data: insertData, error: insertError } = await supabaseServer
      .from('rooms')
      .insert({
        name: formattedName || name,
        description: description || '',
        artist_id: artistId,
        artist_name: resolvedArtistName,
        artist_bio: artistUser?.bio || null,
        invite_code: inviteCode,
        access_type: 'invite-code',
        status: 'draft',
        created_at: now,
        updated_at: now,
      })
      .select()
      .limit(1);

    const insertTime = Date.now() - insertStartTime;

    if (insertError || !insertData || insertData.length === 0) {
      console.error('Error creating room:', insertError);
      throw new Error('Failed to create room');
    }

    const data = insertData[0];
    logger.info('Room inserted into database', { roomId: data.id, artistId, insertTime });

    // Verify room can be fetched back (ensures it's fully committed)
    let room = null;
    let verifyRetries = 0;
    const maxVerifyRetries = 5;
    
    while (!room && verifyRetries < maxVerifyRetries) {
      const verifyDelay = 300 * (verifyRetries + 1); // 300ms, 600ms, 900ms, 1200ms, 1500ms
      if (verifyRetries > 0) {
        logger.warn('Room not immediately fetchable after insert, retrying', {
          roomId: data.id,
          retry: verifyRetries,
          delay: verifyDelay,
        });
        await new Promise(resolve => setTimeout(resolve, verifyDelay));
      }
      
      room = await loadFullRoom(data as DbRoom);
      
      if (room && room.id === data.id) {
        logger.info('Room verified after creation', {
          roomId: room.id,
          artistId,
          verifyRetries,
          totalTime: insertTime + verifyDelay,
        });
        break;
      }
      
      verifyRetries++;
    }

    if (!room) {
      logger.error('Room could not be verified after creation', {
        roomId: data.id,
        artistId,
        maxVerifyRetries,
      });
      // Still return the room even if verification failed - the retry logic in API routes will handle it
      room = await loadFullRoom(data as DbRoom);
    }

    console.log('Room created with ID:', room.id, 'Artist:', artistId, 'Status: draft');
    return room;
  },

  // Get a room by ID
  async getRoom(id: string): Promise<Room | undefined> {
    if (!id) {
      logger.warn('getRoom called with empty ID');
      return undefined;
    }

    // Clean the ID - remove any URL encoding or whitespace
    const cleanId = id.trim();
    logger.info('getRoom: Looking for room', { roomId: cleanId });

    const startTime = Date.now();
    const { data, error } = await supabaseServer
      .from('rooms')
      .select('*')
      .eq('id', cleanId)
      .single();

    const queryTime = Date.now() - startTime;

    if (error) {
      logger.error('getRoom error', {
        roomId: cleanId,
        error: error.message,
        code: error.code,
        details: error.details,
        queryTime,
      });
      return undefined;
    }

    if (!data) {
      logger.warn('getRoom: No data returned', { roomId: cleanId, queryTime });
      return undefined;
    }

    logger.info('getRoom: Found room', { 
      roomId: data.id, 
      roomName: data.name,
      queryTime,
    });
    
    const loadStartTime = Date.now();
    const room = await loadFullRoom(data as DbRoom);
    const loadTime = Date.now() - loadStartTime;
    
    logger.info('getRoom: Room loaded with full data', {
      roomId: room.id,
      songCount: room.songs.length,
      loadTime,
      totalTime: queryTime + loadTime,
    });
    
    return room;
  },

  // Get a room by invite code
  async getRoomByInviteCode(inviteCode: string): Promise<Room | undefined> {
    const { data, error } = await supabaseServer
      .from('rooms')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (error || !data) {
      return undefined;
    }

    return loadFullRoom(data as DbRoom);
  },

  // Get all rooms
  async getAllRooms(): Promise<Room[]> {
    const { data, error } = await supabaseServer
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching rooms:', error);
      return [];
    }

    const rooms: Room[] = [];
    for (const dbRoom of data as DbRoom[]) {
      rooms.push(await loadFullRoom(dbRoom));
    }

    return rooms;
  },

  // Add a song to a room
  async addSong(
    roomId: string,
    title: string,
    url: string,
    uploader: string,
    uploaderId: string,
    sourceType: SongSourceType = 'direct',
    storageType: SongStorageType = 'external',
    storageKey?: string
  ): Promise<Song | null> {
    logger.info('addSong: Starting', { roomId, title, uploader, uploaderId, storageType });
    
    // Verify room exists
    const { data: roomData } = await supabaseServer
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .single();

    if (!roomData) {
      logger.error('addSong: Room not found', { roomId });
      return null;
    }

    const now = new Date().toISOString();
    const insertStartTime = Date.now();
    const { data, error } = await supabaseServer
      .from('songs')
      .insert({
        room_id: roomId,
        title,
        url,
        uploader,
        uploader_id: uploaderId,
        source_type: sourceType,
        storage_type: storageType,
        storage_key: storageKey || null,
        created_at: now,
      })
      .select()
      .single();

    const insertTime = Date.now() - insertStartTime;

    if (error || !data) {
      logger.error('addSong: Insert failed', { roomId, title, error: error?.message, insertTime });
      return null;
    }

    logger.info('addSong: Song inserted', { roomId, songId: data.id, title, storageType, insertTime });

    // Update room updated_at
    const updateStartTime = Date.now();
    await supabaseServer
      .from('rooms')
      .update({ updated_at: now })
      .eq('id', roomId);
    const updateTime = Date.now() - updateStartTime;

    logger.info('addSong: Room updated', { roomId, updateTime });

    const song: Song = {
      id: data.id,
      title: data.title,
      url: data.url,
      uploader: data.uploader,
      uploaderId: data.uploader_id,
      sourceType: data.source_type || 'direct',
      storageType: data.storage_type || 'external',
      storageKey: data.storage_key || undefined,
      comments: [],
    };

    logger.info('addSong: Success', { roomId, songId: song.id, title, storageType, totalTime: insertTime + updateTime });
    return song;
  },

  // Remove a song from a room (only if room is draft)
  async removeSong(roomId: string, songId: string): Promise<boolean> {
    // Check room status
    const { data: roomData } = await supabaseServer
      .from('rooms')
      .select('status')
      .eq('id', roomId)
      .single();

    if (!roomData || roomData.status !== 'draft') {
      return false;
    }

    const { error } = await supabaseServer
      .from('songs')
      .delete()
      .eq('id', songId)
      .eq('room_id', roomId);

    if (error) {
      console.error('Error removing song:', error);
      return false;
    }

    // Update room updated_at
    await supabaseServer
      .from('rooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', roomId);

    return true;
  },

  // Add a comparison (vote on which song is better)
  async addComparison(
    roomId: string,
    songAId: string,
    songBId: string,
    winnerId: string,
    userId: string
  ): Promise<boolean> {
    // Verify room exists
    const { data: roomData } = await supabaseServer
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .single();

    if (!roomData) return false;

    // Verify both songs exist
    const { data: songsData } = await supabaseServer
      .from('songs')
      .select('id')
      .in('id', [songAId, songBId])
      .eq('room_id', roomId);

    if (!songsData || songsData.length !== 2) return false;

    // Verify winner is one of the two songs
    if (winnerId !== songAId && winnerId !== songBId) return false;

    // Remove any existing vote for this user/pair combination
    // Get all comparisons for this user in this room
    const { data: existing } = await supabaseServer
      .from('comparisons')
      .select('id, song_a_id, song_b_id')
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (existing && existing.length > 0) {
      // Delete existing comparisons for this user/pair
      for (const comp of existing) {
        const isSamePair =
          (comp.song_a_id === songAId && comp.song_b_id === songBId) ||
          (comp.song_a_id === songBId && comp.song_b_id === songAId);
        if (isSamePair) {
          await supabaseServer.from('comparisons').delete().eq('id', comp.id);
        }
      }
    }

    // Insert new comparison
    const now = new Date().toISOString();
    const { error } = await supabaseServer
      .from('comparisons')
      .insert({
        room_id: roomId,
        song_a_id: songAId,
        song_b_id: songBId,
        winner_id: winnerId,
        user_id: userId,
        created_at: now,
      });

    if (error) {
      console.error('Error adding comparison:', error);
      return false;
    }

    // Update room updated_at
    await supabaseServer
      .from('rooms')
      .update({ updated_at: now })
      .eq('id', roomId);

    return true;
  },

  // Get win rate for a song
  async getWinRate(roomId: string, songId: string): Promise<{ winRate: number; wins: number; losses: number }> {
    const { data, error } = await supabaseServer
      .from('comparisons')
      .select('winner_id')
      .eq('room_id', roomId)
      .or(`song_a_id.eq.${songId},song_b_id.eq.${songId}`);

    if (error || !data) {
      return { winRate: 0, wins: 0, losses: 0 };
    }

    let wins = 0;
    let losses = 0;

    for (const comp of data as { winner_id: string }[]) {
      if (comp.winner_id === songId) {
        wins++;
      } else {
        losses++;
      }
    }

    const total = wins + losses;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return { winRate, wins, losses };
  },

  // Get all comparisons involving a song
  async getComparisonsForSong(roomId: string, songId: string): Promise<Comparison[]> {
    const { data, error } = await supabaseServer
      .from('comparisons')
      .select('*')
      .eq('room_id', roomId)
      .or(`song_a_id.eq.${songId},song_b_id.eq.${songId}`)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return (data as DbComparison[]).map(dbComparisonToComparison);
  },

  // Get next comparison pair for a user (avoid duplicates)
  async getNextComparisonPair(roomId: string, userId: string): Promise<{ songA: Song | null; songB: Song | null }> {
    // Get all songs in room
    const { data: songsData, error: songsError } = await supabaseServer
      .from('songs')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (songsError || !songsData || songsData.length < 2) {
      return { songA: null, songB: null };
    }

    // Load comments for all songs in this room
    const { data: commentsData } = await supabaseServer
      .from('comments')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    // Build a map of songId -> comments
    const commentsMap = new Map<string, Comment[]>();
    if (commentsData) {
      for (const dbComment of commentsData as DbComment[]) {
        const comment = dbCommentToComment(dbComment);
        if (!commentsMap.has(comment.songId)) {
          commentsMap.set(comment.songId, []);
        }
        commentsMap.get(comment.songId)!.push(comment);
      }
    }

    // Get all comparisons this user has made
    const { data: comparisonsData } = await supabaseServer
      .from('comparisons')
      .select('song_a_id, song_b_id')
      .eq('room_id', roomId)
      .eq('user_id', userId);

    const userComparisons = comparisonsData || [];

    // Try to find a pair the user hasn't compared yet
    for (let i = 0; i < songsData.length; i++) {
      for (let j = i + 1; j < songsData.length; j++) {
        const songA = songsData[i] as DbSong;
        const songB = songsData[j] as DbSong;

        // Check if user has already compared these two songs
        const alreadyCompared = userComparisons.some(
          (c: { song_a_id: string; song_b_id: string }) =>
            (c.song_a_id === songA.id && c.song_b_id === songB.id) ||
            (c.song_a_id === songB.id && c.song_b_id === songA.id)
        );

        if (!alreadyCompared) {
          return {
            songA: dbSongToSong(songA, commentsMap.get(songA.id) || []),
            songB: dbSongToSong(songB, commentsMap.get(songB.id) || []),
          };
        }
      }
    }

    // If all pairs have been compared, return the first pair
    return {
      songA: dbSongToSong(songsData[0] as DbSong, commentsMap.get((songsData[0] as DbSong).id) || []),
      songB: dbSongToSong(songsData[1] as DbSong, commentsMap.get((songsData[1] as DbSong).id) || []),
    };
  },

  // Add a comment to a song
  async addComment(
    roomId: string,
    songId: string,
    authorId: string,
    authorUsername: string,
    text: string,
    isAnonymous: boolean = false,
    parentCommentId?: string
  ): Promise<Comment | null> {
    // Verify room and song exist
    const { data: songData } = await supabaseServer
      .from('songs')
      .select('id')
      .eq('id', songId)
      .eq('room_id', roomId)
      .single();

    if (!songData) return null;

    const now = new Date().toISOString();
    const { data, error } = await supabaseServer
      .from('comments')
      .insert({
        song_id: songId,
        room_id: roomId,
        author_id: authorId,
        author_username: isAnonymous ? 'Anonymous' : authorUsername,
        text,
        is_anonymous: isAnonymous,
        parent_comment_id: parentCommentId || null,
        is_hidden: false,
        created_at: now,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error adding comment:', error);
      return null;
    }

    return dbCommentToComment(data as DbComment);
  },

  // Hide/unhide a comment (artist only)
  async toggleCommentVisibility(roomId: string, songId: string, commentId: string, hide: boolean): Promise<boolean> {
    const { error } = await supabaseServer
      .from('comments')
      .update({ is_hidden: hide })
      .eq('id', commentId)
      .eq('song_id', songId)
      .eq('room_id', roomId);

    return !error;
  },

  // Get rooms for a user (owned + invited)
  async getRoomsForUser(
    userId: string,
    userRole: 'admin' | 'artist' | 'listener',
    statusFilter?: 'all' | 'active' | 'draft' | 'archived'
  ): Promise<Room[]> {
    if (userRole === 'admin') {
      // Admins see all rooms except deleted
      let query = supabaseServer.from('rooms').select('*').neq('status', 'deleted');
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching rooms for admin:', error);
        return [];
      }

      const rooms: Room[] = [];
      for (const dbRoom of data as DbRoom[]) {
        rooms.push(await loadFullRoom(dbRoom));
      }

      return rooms;
    } else {
      // Get rooms owned by user
      const ownedQuery = supabaseServer
        .from('rooms')
        .select('*')
        .eq('artist_id', userId)
        .neq('status', 'deleted');

      // Get rooms where user is invited (if artist)
      let invitedQuery = null;
      if (userRole === 'artist') {
        const { data: invitedRooms } = await supabaseServer
          .from('room_invited_artists')
          .select('room_id')
          .eq('artist_id', userId);

        if (invitedRooms && invitedRooms.length > 0) {
          const roomIds = invitedRooms.map((r: { room_id: string }) => r.room_id);
          invitedQuery = supabaseServer
            .from('rooms')
            .select('*')
            .in('id', roomIds)
            .neq('status', 'deleted');
        }
      }

      // Combine queries
      const [ownedResult, invitedResult] = await Promise.all([
        ownedQuery,
        invitedQuery ? invitedQuery : Promise.resolve({ data: null, error: null }),
      ]);

      const allRooms: DbRoom[] = [];
      if (ownedResult.data) allRooms.push(...(ownedResult.data as DbRoom[]));
      if (invitedResult?.data) allRooms.push(...(invitedResult.data as DbRoom[]));

      // Remove duplicates
      const uniqueRooms = Array.from(
        new Map(allRooms.map((r) => [r.id, r])).values()
      );

      // Apply status filter
      let filtered = uniqueRooms;
      if (statusFilter && statusFilter !== 'all') {
        filtered = uniqueRooms.filter((r) => r.status === statusFilter);
      } else {
        // Default: show draft + active
        filtered = uniqueRooms.filter((r) => r.status === 'draft' || r.status === 'active');
      }

      // Load full rooms
      const rooms: Room[] = [];
      for (const dbRoom of filtered) {
        rooms.push(await loadFullRoom(dbRoom));
      }
      return rooms;
    }
  },

  // Update room status
  async updateRoomStatus(roomId: string, status: 'draft' | 'active' | 'archived' | 'deleted'): Promise<boolean> {
    const { error } = await supabaseServer
      .from('rooms')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);

    return !error;
  },

  // Invite artist to room
  async inviteArtistToRoom(roomId: string, artistId: string, inviterId: string): Promise<boolean> {
    // Verify room exists and inviter is owner
    const { data: roomData } = await supabaseServer
      .from('rooms')
      .select('artist_id')
      .eq('id', roomId)
      .single();

    if (!roomData || roomData.artist_id !== inviterId) {
      return false;
    }

    // Don't add if already invited or is the owner
    if (roomData.artist_id === artistId) {
      return false;
    }

    // Check if already invited
    const { data: existing } = await supabaseServer
      .from('room_invited_artists')
      .select('id')
      .eq('room_id', roomId)
      .eq('artist_id', artistId)
      .single();

    if (existing) {
      return false;
    }

    // Add invitation
    const { error } = await supabaseServer
      .from('room_invited_artists')
      .insert({
        room_id: roomId,
        artist_id: artistId,
      });

    return !error;
  },
};
