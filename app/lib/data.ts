import { normalizeText } from './utils';
import { userStore } from './users';

// In-memory data store (can be replaced with a database later)
export interface Comment {
  id: string;
  songId: string;
  roomId: string;
  authorId: string;
  authorUsername: string;
  text: string;
  isAnonymous: boolean;
  parentCommentId?: string; // For replies
  isHidden: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface Song {
  id: string;
  title: string;
  url: string;
  uploader: string; // Username
  uploaderId: string; // User ID
  comments: Comment[];
}

export interface Comparison {
  id: string;
  songAId: string;
  songBId: string;
  winnerId: string; // The song that won
  userId: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  artistId: string; // Owner
  artistName?: string;
  artistBio?: string;
  invitedArtistIds: string[]; // Artists invited to view
  inviteCode: string;
  accessType: 'private' | 'invited-artists' | 'invite-code';
  status: 'draft' | 'active' | 'archived' | 'deleted'; // NEW - draft is default
  createdAt: number;
  updatedAt?: number; // NEW
  lastAccessed?: number; // NEW
  songs: Song[];
  comparisons: Comparison[];
}

// In-memory storage
// Using a global to persist across hot reloads in development
declare global {
  var __rooms__: Map<string, Room> | undefined;
}

let rooms: Map<string, Room>;
if (typeof globalThis !== 'undefined') {
  if (!globalThis.__rooms__) {
    globalThis.__rooms__ = new Map();
  }
  rooms = globalThis.__rooms__;
} else {
  rooms = new Map();
}

// Generate a random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate a random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const dataStore = {
  // Create a new room
  createRoom(name: string, description: string, artistId: string): Room {
    const artistUser = userStore.getUser(artistId);
    const resolvedArtistName = artistUser?.username ? normalizeText(artistUser.username) : 'Unknown Artist';
    const normalizedName = normalizeText(name);
    const suffix = resolvedArtistName ? ` - ${resolvedArtistName}` : '';
    const formattedName =
      normalizedName && suffix && !normalizedName.toLowerCase().endsWith(suffix.toLowerCase())
        ? `${normalizedName}${suffix}`
        : normalizedName || suffix || name;

    const room: Room = {
      id: generateId(),
      name: formattedName || name,
      description,
      artistId,
      artistName: resolvedArtistName,
      artistBio: artistUser?.bio || '',
      invitedArtistIds: [],
      inviteCode: generateInviteCode(),
      accessType: 'invite-code',
      status: 'draft', // CRITICAL: New rooms start as draft
      createdAt: Date.now(),
      updatedAt: Date.now(),
      songs: [],
      comparisons: [],
    };
    rooms.set(room.id, room);
    console.log('Room created with ID:', room.id, 'Artist:', artistId, 'Status: draft', 'Total rooms:', rooms.size);
    return room;
  },

  // Get a room by ID
  getRoom(id: string): Room | undefined {
    if (!id) {
      console.log('getRoom called with empty ID');
      return undefined;
    }
    
    // Try exact match first
    let room = rooms.get(id);
    
    // If not found, try to find by case-insensitive match (in case of encoding issues)
    if (!room) {
      for (const [roomId, r] of rooms.entries()) {
        if (roomId.toLowerCase() === id.toLowerCase()) {
          console.log('Found room by case-insensitive match:', roomId, 'for requested:', id);
          room = r;
          break;
        }
      }
    }
    
    // If still not found, try partial match (in case of URL encoding issues)
    if (!room) {
      const normalizedId = id.replace(/%/g, '').toLowerCase();
      for (const [roomId, r] of rooms.entries()) {
        const normalizedRoomId = roomId.replace(/%/g, '').toLowerCase();
        if (normalizedRoomId === normalizedId) {
          console.log('Found room by normalized match:', roomId, 'for requested:', id);
          room = r;
          break;
        }
      }
    }
    
    if (!room) {
      console.log('Room not found. Requested ID:', id, 'Type:', typeof id, 'Length:', id.length);
      console.log('Available room IDs:', Array.from(rooms.keys()));
      console.log('Total rooms in store:', rooms.size);
      return undefined;
    }
    
    // Ensure room has comparisons array (for backward compatibility)
    if (!room.comparisons) {
      room.comparisons = [];
    }

    if ((!room.artistName || room.artistBio === undefined) && room.artistId) {
      const owner = userStore.getUser(room.artistId);
      if (owner?.username && !room.artistName) {
        room.artistName = normalizeText(owner.username);
      }
      if (owner?.bio !== undefined && owner.bio) {
        room.artistBio = owner.bio;
      }
    }
    
    // Ensure songs don't have old votes field (migration)
    for (const song of room.songs) {
      if ('votes' in song) {
        delete (song as any).votes;
      }
    }
    
    return room;
  },

  // Get a room by invite code
  getRoomByInviteCode(inviteCode: string): Room | undefined {
    for (const room of rooms.values()) {
      if (room.inviteCode === inviteCode.toUpperCase()) {
        // Ensure room has comparisons array (for backward compatibility)
        if (!room.comparisons) {
          room.comparisons = [];
        }
        
        // Ensure songs don't have old votes field (migration)
        for (const song of room.songs) {
          if ('votes' in song) {
            delete (song as any).votes;
          }
        }

        if ((!room.artistName || room.artistBio === undefined) && room.artistId) {
          const owner = userStore.getUser(room.artistId);
          if (owner?.username && !room.artistName) {
            room.artistName = normalizeText(owner.username);
          }
          if (owner?.bio !== undefined) {
            room.artistBio = owner.bio;
          }
        }
        
        return room;
      }
    }
    return undefined;
  },

  // Get all rooms
  getAllRooms(): Room[] {
    const allRooms = Array.from(rooms.values());
    
    // Ensure all rooms have required fields (for backward compatibility)
    for (const room of allRooms) {
      if (!room.comparisons) {
        room.comparisons = [];
      }
      
      // Migrate old rooms without status - default to 'active' for existing rooms
      if (!room.status) {
        room.status = 'active';
        console.log('Migrated room to active status:', room.id, room.name);
      }
      
      // Migrate old rooms without artistId (assign to a default or skip)
      if (!room.artistId) {
        // For existing rooms without artistId, we'll skip them in user queries
        // They can still be accessed via invite code
        console.warn('Room without artistId found:', room.id, room.name);
      }

      if (!room.artistName && room.artistId) {
        const owner = userStore.getUser(room.artistId);
        if (owner?.username && !room.artistName) {
          room.artistName = normalizeText(owner.username);
        }
        if (owner?.bio !== undefined && owner.bio) {
          room.artistBio = owner.bio;
        }
      }
      
      if (!room.invitedArtistIds) {
        room.invitedArtistIds = [];
      }
      
      if (!room.accessType) {
        room.accessType = 'invite-code';
      }
      
      // Ensure songs don't have old votes field (migration)
      for (const song of room.songs) {
        if ('votes' in song) {
          delete (song as any).votes;
        }
        // Migrate old songs without uploaderId
        if (!song.uploaderId && song.uploader) {
          // Can't determine uploaderId from old data, leave it
          console.warn('Song without uploaderId found:', song.id);
        }
      }
    }
    
    return allRooms;
  },

  // Add a song to a room
  addSong(roomId: string, title: string, url: string, uploader: string, uploaderId: string): Song | null {
    const room = rooms.get(roomId);
    if (!room) return null;

    const song: Song = {
      id: generateId(),
      title,
      url,
      uploader,
      uploaderId,
      comments: [],
    };

    room.songs.push(song);
    room.updatedAt = Date.now();
    return song;
  },

  // Remove a song from a room (only if room is draft, to preserve history)
  removeSong(roomId: string, songId: string): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;

    // Only allow removal in draft rooms to preserve comparison history
    if (room.status !== 'draft') {
      return false;
    }

    const songIndex = room.songs.findIndex(s => s.id === songId);
    if (songIndex === -1) return false;

    // Remove the song
    room.songs.splice(songIndex, 1);
    room.updatedAt = Date.now();
    return true;
  },

  // Add a comparison (vote on which song is better)
  // Replaces existing vote for same user/pair combination
  addComparison(
    roomId: string,
    songAId: string,
    songBId: string,
    winnerId: string,
    userId: string
  ): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;
    
    // Ensure room has comparisons array (for backward compatibility)
    if (!room.comparisons) {
      room.comparisons = [];
    }

    // Verify both songs exist
    const songA = room.songs.find((s) => s.id === songAId);
    const songB = room.songs.find((s) => s.id === songBId);
    if (!songA || !songB) return false;

    // Verify winner is one of the two songs
    if (winnerId !== songAId && winnerId !== songBId) return false;

    // Remove any existing vote for this user/pair combination
    room.comparisons = room.comparisons.filter((c) => {
      const isSamePair = 
        (c.songAId === songAId && c.songBId === songBId) ||
        (c.songAId === songBId && c.songBId === songAId);
      return !(isSamePair && c.userId === userId);
    });

    const comparison: Comparison = {
      id: generateId(),
      songAId,
      songBId,
      winnerId,
      userId,
      timestamp: Date.now(),
    };

    room.comparisons.push(comparison);
    room.updatedAt = Date.now();
    return true;
  },

  // Get win rate for a song
  getWinRate(roomId: string, songId: string): { winRate: number; wins: number; losses: number } {
    const room = rooms.get(roomId);
    if (!room) return { winRate: 0, wins: 0, losses: 0 };
    
    // Ensure room has comparisons array (for backward compatibility)
    if (!room.comparisons) {
      room.comparisons = [];
    }

    let wins = 0;
    let losses = 0;

    for (const comparison of room.comparisons) {
      if (comparison.songAId === songId || comparison.songBId === songId) {
        if (comparison.winnerId === songId) {
          wins++;
        } else {
          losses++;
        }
      }
    }

    const total = wins + losses;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return { winRate, wins, losses };
  },

  // Get all comparisons involving a song
  getComparisonsForSong(roomId: string, songId: string): Comparison[] {
    const room = rooms.get(roomId);
    if (!room) return [];
    
    // Ensure room has comparisons array (for backward compatibility)
    if (!room.comparisons) {
      room.comparisons = [];
    }

    return room.comparisons.filter(
      (c) => c.songAId === songId || c.songBId === songId
    );
  },

  // Get next comparison pair for a user (avoid duplicates)
  getNextComparisonPair(roomId: string, userId: string): { songA: Song | null; songB: Song | null } {
    const room = rooms.get(roomId);
    if (!room || room.songs.length < 2) return { songA: null, songB: null };
    
    // Ensure room has comparisons array (for backward compatibility)
    if (!room.comparisons) {
      room.comparisons = [];
    }

    // Get all songs
    const songs = room.songs;

    // Get all comparisons this user has already made
    const userComparisons = room.comparisons.filter((c) => c.userId === userId);

    // Try to find a pair the user hasn't compared yet
    for (let i = 0; i < songs.length; i++) {
      for (let j = i + 1; j < songs.length; j++) {
        const songA = songs[i];
        const songB = songs[j];

        // Check if user has already compared these two songs
        const alreadyCompared = userComparisons.some(
          (c) =>
            (c.songAId === songA.id && c.songBId === songB.id) ||
            (c.songAId === songB.id && c.songBId === songA.id)
        );

        if (!alreadyCompared) {
          return { songA, songB };
        }
      }
    }

    // If all pairs have been compared, return the first pair
    return { songA: songs[0], songB: songs[1] };
  },

  // Add a comment to a song
  addComment(
    roomId: string,
    songId: string,
    authorId: string,
    authorUsername: string,
    text: string,
    isAnonymous: boolean = false,
    parentCommentId?: string
  ): Comment | null {
    const room = rooms.get(roomId);
    if (!room) return null;

    const song = room.songs.find((s) => s.id === songId);
    if (!song) return null;

    const comment: Comment = {
      id: generateId(),
      songId,
      roomId,
      authorId,
      authorUsername: isAnonymous ? 'Anonymous' : authorUsername,
      text,
      isAnonymous,
      parentCommentId,
      isHidden: false,
      createdAt: Date.now(),
    };

    song.comments.push(comment);
    return comment;
  },

  // Hide/unhide a comment (artist only)
  toggleCommentVisibility(roomId: string, songId: string, commentId: string, hide: boolean): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;

    const song = room.songs.find((s) => s.id === songId);
    if (!song) return false;

    const comment = song.comments.find((c) => c.id === commentId);
    if (!comment) return false;

    comment.isHidden = hide;
    return true;
  },

  // Get rooms for a user (owned + invited)
  getRoomsForUser(userId: string, userRole: 'admin' | 'artist' | 'listener', statusFilter?: 'all' | 'active' | 'draft' | 'archived'): Room[] {
    const allRooms = this.getAllRooms();
    
    if (userRole === 'admin') {
      // Admins see all rooms except deleted
      const filtered = allRooms.filter(room => room.status !== 'deleted');
      if (statusFilter && statusFilter !== 'all') {
        return filtered.filter(room => room.status === statusFilter);
      }
      return filtered;
    }

    const userRooms = allRooms.filter(room => {
      // Skip rooms without artistId (old rooms)
      if (!room.artistId) return false;
      
      // Skip deleted rooms
      if (room.status === 'deleted') return false;
      
      // User owns the room
      if (room.artistId === userId) return true;
      // User is invited artist
      if (userRole === 'artist' && room.invitedArtistIds?.includes(userId)) return true;
      return false;
    });

    // Apply status filter (default: show draft + active)
    if (statusFilter && statusFilter !== 'all') {
      return userRooms.filter(room => room.status === statusFilter);
    }
    
    // Default: show draft + active (not archived or deleted)
    return userRooms.filter(room => room.status === 'draft' || room.status === 'active');
  },

  // Update room status
  updateRoomStatus(roomId: string, status: 'draft' | 'active' | 'archived' | 'deleted'): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;
    
    room.status = status;
    room.updatedAt = Date.now();
    return true;
  },

  // Invite artist to room
  inviteArtistToRoom(roomId: string, artistId: string, inviterId: string): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;
    
    // Only room owner can invite
    if (room.artistId !== inviterId) return false;
    
    // Don't add if already invited or is the owner
    if (room.invitedArtistIds.includes(artistId) || room.artistId === artistId) {
      return false;
    }
    
    room.invitedArtistIds.push(artistId);
    return true;
  },
};

