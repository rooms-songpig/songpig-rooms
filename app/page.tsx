'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getAuthHeaders, logout } from '@/app/lib/auth-helpers';
import { normalizeText } from '@/app/lib/utils';
import UserProfile from '@/app/components/UserProfile';
import ScrollToTop from '@/app/components/ScrollToTop';

interface Room {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  status: 'draft' | 'active' | 'archived' | 'deleted';
  createdAt: number;
  updatedAt?: number;
  lastAccessed?: number;
  songs: any[];
  artistId?: string;
  artistName?: string;
  artistBio?: string;
}

interface ArtistStats {
  totalRooms: number;
  totalSongs: number;
  totalComparisons: number;
  totalComments: number;
}

interface RecentComment {
  id: string;
  text: string;
  authorUsername: string;
  songId: string;
  songTitle: string;
  roomId: string;
  roomName: string;
  createdAt: string;
}

interface SongStat {
  songId: string;
  songTitle: string;
  roomId: string;
  roomName: string;
  wins: number;
  losses: number;
  totalComparisons: number;
  winRate: number;
}

export default function Home() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const roomNameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Artist stats
  const [artistStats, setArtistStats] = useState<ArtistStats | null>(null);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [songStats, setSongStats] = useState<SongStat[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);

  const formatRoomNameWithArtist = useCallback(
    (value: string) => {
      const normalizedName = normalizeText(value);
      if (!normalizedName) return '';
      const artistName = user?.username ? normalizeText(user.username) : '';
      if (!artistName) {
        return normalizedName;
      }
      const suffix = ` - ${artistName}`;
      return normalizedName.toLowerCase().endsWith(suffix.toLowerCase())
        ? normalizedName
        : `${normalizedName}${suffix}`;
    },
    [user]
  );

  const applyRoomNameFormatting = useCallback(() => {
    setRoomName((prev) => {
      if (!prev.trim()) return prev;
      return formatRoomNameWithArtist(prev);
    });
  }, [formatRoomNameWithArtist]);

  const fetchArtistStats = useCallback(async () => {
    try {
      const res = await fetch('/api/artist/stats', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.error) {
        setArtistStats(data.stats);
        setRecentComments(data.recentComments || []);
        setSongStats(data.songStats || []);
      }
    } catch (error) {
      console.error('Failed to fetch artist stats:', error);
    }
  }, []);

  useEffect(() => {
    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    setCheckingAuth(false);
    fetchRooms();
    
    // Fetch artist stats if user is an artist or admin
    if (currentUser.role === 'artist' || currentUser.role === 'admin') {
      fetchArtistStats();
    }
  }, [router, fetchArtistStats]);

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [statusFilter, user]);

  useEffect(() => {
    if (showCreateForm && roomNameRef.current) {
      roomNameRef.current.focus();
    }
  }, [showCreateForm]);

  const fetchRooms = async () => {
    if (!user) return;
    
    try {
      const url = statusFilter === 'all' 
        ? '/api/rooms' 
        : `/api/rooms?status=${statusFilter}`;
      
      const res = await fetch(url, { 
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (data.error) {
        if (data.error === 'Authentication required') {
          logout();
          router.push('/login');
          return;
        }
        console.error('Error fetching rooms:', data.error);
        return;
      }
      
      console.log('Fetched rooms:', data.rooms?.length || 0, 'rooms', 'filter:', statusFilter);
      if (data.rooms) {
        data.rooms.forEach((room: Room) => {
          console.log('Room ID:', room.id, 'Name:', room.name, 'Status:', room.status);
        });
      }
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !user) return;

    // Only artists and admins can create rooms
    if (user.role !== 'artist' && user.role !== 'admin') {
      alert('Only artists can create rooms. Please register as an artist.');
      return;
    }

    setLoading(true);
    try {
      const formattedName = formatRoomNameWithArtist(roomName) || normalizeText(roomName);
      setRoomName(formattedName);
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formattedName,
          description: roomDescription,
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        console.error('Room creation error:', data.error);
        alert(data.error);
      } else if (data.room && data.room.id) {
        console.log('Room created successfully, ID:', data.room.id);
        
        // Verify room is accessible before navigating
        let roomVerified = false;
        let verifyAttempts = 0;
        const maxVerifyAttempts = 10;
        const delays = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
        
        console.log('Verifying room after creation:', data.room.id);
        
        while (!roomVerified && verifyAttempts < maxVerifyAttempts) {
          if (verifyAttempts > 0) {
            const delay = delays[Math.min(verifyAttempts - 1, delays.length - 1)];
            console.log(`Room verification attempt ${verifyAttempts + 1}/${maxVerifyAttempts}, waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          try {
            const verifyRes = await fetch(`/api/rooms/${data.room.id}`, {
              headers: getAuthHeaders(),
              cache: 'no-store',
            });
            
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData.room && verifyData.room.id === data.room.id) {
                roomVerified = true;
                console.log(`✅ Room verified after ${verifyAttempts + 1} attempt(s), navigating...`);
                break;
              } else {
                console.log(`Room verification: data mismatch, expected ${data.room.id}, got ${verifyData.room?.id}`);
              }
            } else {
              const errorData = await verifyRes.json().catch(() => ({}));
              console.log(`Room verification: API returned ${verifyRes.status}, error:`, errorData.error);
            }
          } catch (e) {
            console.log(`Room verification attempt ${verifyAttempts + 1} failed:`, e);
          }
          
          verifyAttempts++;
        }
        
        if (roomVerified) {
          // Refresh the room list to show the new room
          await fetchRooms();
          // Small delay before navigation to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 200));
          // Navigate directly to the room
          router.push(`/room/${data.room.id}`);
        } else {
          console.warn(`⚠️ Room not immediately accessible after ${maxVerifyAttempts} attempts, but created. User can navigate manually.`);
          // Refresh the room list anyway
          await fetchRooms();
          // Show success message and let user navigate manually
          alert(`Room "${data.room.name}" created successfully! It will appear in your room list. You can click on it to open it.`);
        }
      } else {
        console.error('Room creation failed or missing room data:', data);
        alert('Failed to create room. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#050816',
          color: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050816',
        color: '#f9fafb',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '2rem',
      }}
    >
      <UserProfile />
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              Songpig Listening Rooms
            </h1>
            <p style={{ opacity: 0.8, marginBottom: '0.5rem' }}>
              Welcome, {user.username} ({user.role})
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                style={{
                  background: '#1a1a2e',
                  color: '#f9fafb',
                  border: '1px solid #333',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
            {user.role === 'artist' || user.role === 'admin'
              ? 'Create rooms to A/B test your songs and get feedback from listeners.'
              : 'Join rooms to provide feedback on songs.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {(user.role === 'artist' || user.role === 'admin') && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {showCreateForm ? 'Cancel' : '+ Create Room'}
              </button>
            )}
            <Link
              href="/join"
              style={{
                background: '#1a1a2e',
                color: '#f9fafb',
                border: '1px solid #333',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-block',
              }}
            >
              Join Room
            </Link>
          </div>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateRoom}
            style={{
              background: '#1a1a2e',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
              Create New Room
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  opacity: 0.9,
                }}
              >
                Room Name *
              </label>
              <input
                type="text"
                ref={roomNameRef}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onBlur={applyRoomNameFormatting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyRoomNameFormatting();
                    descriptionRef.current?.focus();
                  }
                }}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f0f1e',
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  color: '#f9fafb',
                  fontSize: '1rem',
                }}
                placeholder="e.g., My New Album"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  opacity: 0.9,
                }}
              >
                Description
              </label>
              <textarea
                ref={descriptionRef}
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f0f1e',
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  color: '#f9fafb',
                  fontSize: '1rem',
                  minHeight: '80px',
                  resize: 'vertical',
                }}
                placeholder="What's this room for?"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !roomName.trim()}
              style={{
                background: loading ? '#555' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        )}

        {/* Artist Stats Summary */}
        {(user.role === 'artist' || user.role === 'admin') && artistStats && (
          <div style={{ 
            background: '#1a1a2e', 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            marginBottom: '2rem',
            border: '1px solid #333',
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Your Stats</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
                  {artistStats.totalRooms}
                </p>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>Rooms</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', margin: 0 }}>
                  {artistStats.totalSongs}
                </p>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>Songs</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                  {artistStats.totalComparisons}
                </p>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>Votes</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
                  {artistStats.totalComments}
                </p>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>Comments</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        {(user.role === 'artist' || user.role === 'admin') && recentComments.length > 0 && (
          <div style={{ 
            background: '#1a1a2e', 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            marginBottom: '2rem',
            border: '1px solid #333',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Recent Feedback</h2>
              {recentComments.length > 5 && (
                <button
                  onClick={() => setShowAllComments(!showAllComments)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  {showAllComments ? 'Show less' : `Show all (${recentComments.length})`}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(showAllComments ? recentComments : recentComments.slice(0, 5)).map((comment) => (
                <Link
                  key={comment.id}
                  href={`/room/${comment.roomId}`}
                  style={{
                    background: '#0f0f1e',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: '#f9fafb',
                    display: 'block',
                    borderLeft: '3px solid #3b82f6',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      <strong>{comment.authorUsername}</strong> on <em>{comment.songTitle}</em>
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>
                    &ldquo;{comment.text.length > 150 ? comment.text.slice(0, 150) + '...' : comment.text}&rdquo;
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.5 }}>
                    {comment.roomName}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Only show "Your Rooms" section for artists/admins, not listeners */}
        {(user.role === 'artist' || user.role === 'admin') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                Your Rooms
              </h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  background: '#1a1a2e',
                  color: '#f9fafb',
                  border: '1px solid #333',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {rooms.length === 0 ? (
              <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>
                No rooms yet. Create one to get started!
              </p>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/room/${room.id}`}
                  style={{
                    display: 'block',
                    background: '#1a1a2e',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    color: '#f9fafb',
                    border: '1px solid #333',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                          {room.name}
                        </h3>
                        <span
                          style={{
                            background: room.status === 'draft' ? '#f59e0b' : room.status === 'active' ? '#10b981' : room.status === 'archived' ? '#6b7280' : '#ef4444',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                          }}
                        >
                          {room.status}
                        </span>
                      </div>
                      {room.artistName && (
                        <p
                          style={{ opacity: 0.7, margin: '0 0 0.5rem 0', fontStyle: 'italic', fontSize: '0.85rem' }}
                          title={room.artistBio || 'Artist bio coming soon'}
                        >
                          by {room.artistName}
                        </p>
                      )}
                      {room.description && (
                        <p style={{ opacity: 0.8, marginBottom: '0.5rem' }}>
                          {room.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', opacity: 0.6 }}>
                        <span>
                          Invite code: <strong>{room.inviteCode}</strong>
                        </span>
                        <span>
                          {room.songs.length} song{room.songs.length !== 1 ? 's' : ''}
                        </span>
                        {room.status === 'draft' && (
                          <span>
                            {room.songs.length}/2 songs
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ opacity: 0.5 }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>
        )}
      </div>
      <ScrollToTop />
    </main>
  );
}
