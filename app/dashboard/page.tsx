'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getAuthHeaders, logout, setCurrentUser } from '@/app/lib/auth-helpers';
import { normalizeText } from '@/app/lib/utils';
import UserProfile from '@/app/components/UserProfile';
import ScrollToTop from '@/app/components/ScrollToTop';
import PageLabel from '@/app/components/PageLabel';

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
  const [showAllSongs, setShowAllSongs] = useState(false);

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
      
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !user) return;

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
        alert(data.error);
      } else if (data.room && data.room.id) {
        let roomVerified = false;
        let verifyAttempts = 0;
        const maxVerifyAttempts = 10;
        const delays = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
        
        while (!roomVerified && verifyAttempts < maxVerifyAttempts) {
          if (verifyAttempts > 0) {
            const delay = delays[Math.min(verifyAttempts - 1, delays.length - 1)];
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
                break;
              }
            }
          } catch (e) {
            // Continue trying
          }
          
          verifyAttempts++;
        }
        
        if (roomVerified) {
          await fetchRooms();
          await new Promise(resolve => setTimeout(resolve, 200));
          router.push(`/room/${data.room.id}`);
        } else {
          await fetchRooms();
          alert(`Room "${data.room.name}" created successfully! It will appear in your room list.`);
        }
      } else {
        alert('Failed to create room. Please try again.');
      }
    } catch (error) {
      alert('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (checkingAuth) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #050816 0%, #0a1628 50%, #050816 100%)',
          color: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐷</div>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const isArtist = user.role === 'artist' || user.role === 'admin';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #050816 0%, #0a1628 50%, #050816 100%)',
        color: '#f9fafb',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: '1.5rem',
        overflowX: 'hidden',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <PageLabel pageName="Home" />
      <UserProfile />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 0.5rem', boxSizing: 'border-box' }}>
        
        {/* Hero Section for Artists */}
        {isArtist && artistStats && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            marginTop: '1rem',
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ 
                fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
                fontWeight: '700',
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {getGreeting()}, {user.username}! 🎵
              </h1>
              <p style={{ opacity: 0.8, fontSize: '1rem' }}>
                Here's how your music is performing
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '1rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.15)',
                borderRadius: '0.75rem',
                padding: '1rem',
                textAlign: 'center',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}>
                <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>
                  {artistStats.totalRooms}
                </p>
                <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: 0 }}>Rooms</p>
              </div>
              <div style={{
                background: 'rgba(139, 92, 246, 0.15)',
                borderRadius: '0.75rem',
                padding: '1rem',
                textAlign: 'center',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}>
                <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 'bold', color: '#a78bfa', margin: 0 }}>
                  {artistStats.totalSongs}
                </p>
                <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: 0 }}>Songs</p>
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                borderRadius: '0.75rem',
                padding: '1rem',
                textAlign: 'center',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}>
                <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 'bold', color: '#34d399', margin: 0 }}>
                  {artistStats.totalComparisons}
                </p>
                <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: 0 }}>Votes</p>
              </div>
              <div style={{
                background: recentComments.length > 0 
                  ? 'rgba(245, 158, 11, 0.2)' 
                  : 'rgba(245, 158, 11, 0.15)',
                borderRadius: '0.75rem',
                padding: '1rem',
                textAlign: 'center',
                border: recentComments.length > 0 
                  ? '2px solid rgba(245, 158, 11, 0.5)' 
                  : '1px solid rgba(245, 158, 11, 0.3)',
                position: 'relative',
              }}>
                <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 'bold', color: '#fbbf24', margin: 0 }}>
                  {artistStats.totalComments}
                </p>
                <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: 0 }}>Comments</p>
                {recentComments.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '999px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                  }}>
                    NEW
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ✨ {showCreateForm ? 'Cancel' : 'Create New Room'}
              </button>
              <Link
                href="/join"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#f9fafb',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                🔗 Join Room
              </Link>
            </div>
          </div>
        )}

        {/* Listener Welcome */}
        {!isArtist && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            marginTop: '2rem',
            padding: '2rem',
            background: 'rgba(26, 26, 46, 0.5)',
            borderRadius: '1rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              Welcome, {user.username}! 🎧
            </h1>
            <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
              Join rooms to listen and vote on songs
            </p>
            <Link
              href="/join"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                color: 'white',
                padding: '0.875rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-block',
              }}
            >
              🎵 Join a Room
            </Link>
          </div>
        )}

        {/* Create Room Form */}
        {showCreateForm && isArtist && (
          <form
            onSubmit={handleCreateRoom}
            style={{
              background: 'rgba(26, 26, 46, 0.8)',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              marginBottom: '2rem',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
              Create New Room
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
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
                  background: 'rgba(15, 15, 30, 0.6)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '0.5rem',
                  color: '#f9fafb',
                  fontSize: '1rem',
                }}
                placeholder="e.g., My New Album"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
                Description
              </label>
              <textarea
                ref={descriptionRef}
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(15, 15, 30, 0.6)',
                  border: '1px solid rgba(255,255,255,0.15)',
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
                background: loading ? '#4b5563' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
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

        {/* Song Performance - For Artists */}
        {isArtist && songStats.length > 0 && (
          <div style={{ 
            background: 'rgba(26, 26, 46, 0.6)', 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            marginBottom: '2rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📊 Song Performance
              </h2>
              {songStats.length > 4 && (
                <button
                  onClick={() => setShowAllSongs(!showAllSongs)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  {showAllSongs ? 'Show less' : `View all (${songStats.length})`}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(showAllSongs ? songStats : songStats.slice(0, 4)).map((song) => (
                <Link
                  key={song.songId}
                  href={`/room/${song.roomId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(15, 15, 30, 0.6)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: '#f9fafb',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{song.songTitle}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{song.roomName}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 'bold',
                        color: song.winRate >= 60 ? '#34d399' : song.winRate >= 40 ? '#fbbf24' : '#f87171',
                      }}>
                        {song.winRate.toFixed(0)}%
                        <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                          {song.winRate >= 60 ? '📈' : song.winRate >= 40 ? '➡️' : '📉'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                        {song.wins}W / {song.losses}L
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Feedback - For Artists */}
        {isArtist && recentComments.length > 0 && (
          <div style={{ 
            background: 'rgba(26, 26, 46, 0.6)', 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            marginBottom: '2rem',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💬 Recent Feedback
                <span style={{
                  background: '#f59e0b',
                  color: '#000',
                  borderRadius: '999px',
                  padding: '0.15rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                }}>
                  {recentComments.length}
                </span>
              </h2>
              {recentComments.length > 3 && (
                <button
                  onClick={() => setShowAllComments(!showAllComments)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f59e0b',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  {showAllComments ? 'Show less' : `View all (${recentComments.length})`}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(showAllComments ? recentComments : recentComments.slice(0, 3)).map((comment) => (
                <Link
                  key={comment.id}
                  href={`/room/${comment.roomId}`}
                  style={{
                    background: 'rgba(15, 15, 30, 0.6)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: '#f9fafb',
                    display: 'block',
                    borderLeft: '3px solid #f59e0b',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 15, 30, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 15, 30, 0.6)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                      <strong style={{ color: '#f59e0b' }}>{comment.authorUsername}</strong> on <em>{comment.songTitle}</em>
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>
                    "{comment.text.length > 150 ? comment.text.slice(0, 150) + '...' : comment.text}"
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.5 }}>
                    {comment.roomName}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Your Rooms - For Artists */}
        {isArtist && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🎤 Your Rooms
              </h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  background: 'rgba(26, 26, 46, 0.8)',
                  color: '#f9fafb',
                  border: '1px solid rgba(255,255,255,0.15)',
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
              <div style={{ 
                opacity: 0.7, 
                textAlign: 'center', 
                padding: '3rem',
                background: 'rgba(26, 26, 46, 0.4)',
                borderRadius: '0.75rem',
                border: '1px dashed rgba(255,255,255,0.2)',
              }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎵</p>
                <p>No rooms yet. Create one to get started!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/room/${room.id}`}
                    style={{
                      display: 'block',
                      background: 'rgba(26, 26, 46, 0.6)',
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      textDecoration: 'none',
                      color: '#f9fafb',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'border-color 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '600' }}>
                            {room.name}
                          </h3>
                          <span
                            style={{
                              background: room.status === 'draft' ? '#f59e0b' : room.status === 'active' ? '#10b981' : room.status === 'archived' ? '#6b7280' : '#ef4444',
                              color: 'white',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.65rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                            }}
                          >
                            {room.status}
                          </span>
                        </div>
                        {room.description && (
                          <p style={{ opacity: 0.7, margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                            {room.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.6, flexWrap: 'wrap' }}>
                          <span>📝 Code: <strong>{room.inviteCode}</strong></span>
                          <span>🎵 {room.songs.length} song{room.songs.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <span style={{ opacity: 0.4, fontSize: '1.5rem' }}>→</span>
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
