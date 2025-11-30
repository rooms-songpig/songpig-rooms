'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getAuthHeaders, logout, setCurrentUser } from '@/app/lib/auth-helpers';
import { normalizeText, formatTimestamp } from '@/app/lib/utils';
import { logger } from '@/app/lib/logger';
import AudioPlayer from '@/app/components/AudioPlayer';
import Breadcrumb from '@/app/components/Breadcrumb';
import Toast from '@/app/components/Toast';
import UserProfile from '@/app/components/UserProfile';
import GuestPrompt from '@/app/components/GuestPrompt';
import ScrollToTop from '@/app/components/ScrollToTop';
import CommentAuthorTooltip from '@/app/components/CommentAuthorTooltip';
import CommentThread from '@/app/components/CommentThread';

interface Song {
  id: string;
  title: string;
  url: string;
  uploader: string;
  sourceType: 'direct' | 'soundcloud';
  comments: Array<{ id: string; userId: string; text: string; timestamp: number }>;
}

interface Room {
  id: string;
  name: string;
  description: string;
  artistId: string;
  artistName?: string;
  artistBio?: string;
  invitedArtistIds?: string[];
  inviteCode: string;
  status: 'draft' | 'active' | 'archived' | 'deleted';
  createdAt: number;
  updatedAt?: number;
  lastAccessed?: number;
  songs: Song[];
  comparisons: any[];
}

interface WinRate {
  winRate: number;
  wins: number;
  losses: number;
}

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.id as string | undefined;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'compare' | 'browse'>('compare');
  const [showAddSong, setShowAddSong] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [songSourceType, setSongSourceType] = useState<'direct' | 'soundcloud'>('direct');
  const [uploader, setUploader] = useState('');
  const [userId, setUserId] = useState('');
  const [commentTexts, setCommentTexts] = useState<{ [songId: string]: string }>({});
  const [comparisonPair, setComparisonPair] = useState<{ songA: Song | null; songB: Song | null }>({
    songA: null,
    songB: null,
  });
  const [winRates, setWinRates] = useState<{ [songId: string]: WinRate }>({});
  const [comparing, setComparing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; details?: string } | null>(null);
  
  // Memoize the toast close handler to prevent unnecessary re-renders
  const handleToastClose = useCallback(() => {
    setToast(null);
  }, []);
  const [isGuest, setIsGuest] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [currentVote, setCurrentVote] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasFetchedPair, setHasFetchedPair] = useState(false);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const songTitleRef = useRef<HTMLInputElement>(null);
  const songUrlRef = useRef<HTMLInputElement>(null);
  const [autoVersion2, setAutoVersion2] = useState(false);
  const isSongUrlValid = useMemo(() => {
    const trimmed = songUrl.trim();
    if (!trimmed) return false;
    if (songSourceType === 'soundcloud') {
      return trimmed.toLowerCase().includes('soundcloud.com/');
    }
    return true;
  }, [songUrl, songSourceType]);

  const songUrlError = useMemo(() => {
    if (!songUrl.trim()) return '';
    if (songSourceType === 'soundcloud' && !songUrl.toLowerCase().includes('soundcloud.com/')) {
      return 'SoundCloud private links must include soundcloud.com and the secret code (s-XXXX).';
    }
    return '';
  }, [songUrl, songSourceType]);

  
  // Reply to comments
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; songId: string; authorName: string } | null>(null);
  const [replyText, setReplyText] = useState('');

  const transformAudioUrl = useCallback((url: string, sourceType: 'direct' | 'soundcloud') => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;

    if (sourceType === 'soundcloud') {
      return trimmed;
    }

    if (trimmed.includes('dropbox.com')) {
      if (trimmed.includes('?dl=0') || trimmed.includes('?dl=1')) {
        return trimmed.replace('?dl=0', '?raw=1').replace('?dl=1', '?raw=1');
      }
      return trimmed.includes('?') ? `${trimmed}&raw=1` : `${trimmed}?raw=1`;
    }

    return trimmed;
  }, []);

  const handleExclusiveAudioPlay = useCallback((audio: HTMLAudioElement) => {
    setPlayingAudio((current) => {
      if (current && current !== audio) {
        current.pause();
      }
      return audio;
    });
  }, []);

  const renderSongPlayer = useCallback(
    (song: Song, variant: 'card' | 'compact' = 'card') => {
      if (song.sourceType === 'soundcloud') {
        const height = variant === 'card' ? 160 : 140;
        const iframeHeight = 180;
        const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
          song.url
        )}&color=%233b82f6&auto_play=false&hide_related=false&show_comments=true&show_user=false&show_reposts=false&show_teaser=false&sharing=false&liking=false&show_playcount=false&show_artwork=false`;

        return (
          <div
            style={{
              width: '100%',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              border: '1px solid #1f2937',
              background: '#0b1120',
              height,
            }}
          >
            <iframe
              title={`${song.title} — SoundCloud player`}
              allow="autoplay; encrypted-media"
              width="100%"
              height={iframeHeight}
              style={{ border: 'none' }}
              scrolling="no"
              sandbox="allow-scripts allow-same-origin"
              src={embedUrl}
            />
          </div>
        );
      }

      return (
        <AudioPlayer
          src={song.url}
          onRequestPlay={handleExclusiveAudioPlay}
          className={variant === 'compact' ? 'compact-player' : undefined}
        />
      );
    },
    [handleExclusiveAudioPlay]
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (viewMode !== 'compare') {
      setShowAddSong(false);
    }
  }, [viewMode]);

  useEffect(() => {
    if (!room || room.songs.length !== 1 || room.status !== 'draft') {
      setAutoVersion2(false);
    }
  }, [room?.songs.length, room?.status]);

  useEffect(() => {
    if (room?.songs.length === 2) {
      setShowAddSong(false);
    }
  }, [room?.songs.length]);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      setShowGuestPrompt(true);
      setIsGuest(true);
      setUser(null);
      setUserId('');
      setUploader('');
    } else {
      setUser(currentUser);
      setUserId(currentUser.id);
      setUploader(currentUser.username);
      setIsGuest(false);
      
      // Verify userId is valid
      if (!currentUser.id || typeof currentUser.id !== 'string') {
        console.error('Invalid userId in localStorage:', currentUser.id);
        setToast({ message: 'Invalid user session. Please log in again.', type: 'error' });
        logout();
        router.push('/login');
        return;
      }

      if (typeof window !== 'undefined') {
        const referrer = document.referrer;
        if (referrer) {
          try {
            const url = new URL(referrer);
            if (url.pathname !== window.location.pathname) {
              sessionStorage.setItem('previousPage', url.pathname);
            }
          } catch (e) {
            // ignore invalid referrer
          }
        }
      }
    }

    if (roomId) {
      fetchRoom();
    } else {
      setLoading(false);
    }
  }, [roomId, router]);

  // Auto-focus song title when form opens
  useEffect(() => {
    if (showAddSong && songTitleRef.current) {
      songTitleRef.current.focus();
    }
  }, [showAddSong]);

  // Auto-switch guests to browse mode
  useEffect(() => {
    if (isGuest && viewMode === 'compare') {
      setViewMode('browse');
    }
  }, [isGuest, viewMode]);

  // Fix compare mode - only fetch once when switching to compare mode
  useEffect(() => {
    if (room && viewMode === 'compare' && room.songs.length >= 2 && !hasFetchedPair) {
      console.log('Fetching comparison pair - songs available:', room.songs.length);
      fetchNextComparisonPair();
      setHasFetchedPair(true);
    }
    if (viewMode === 'browse') {
      setHasFetchedPair(false); // Reset when switching away
      calculateWinRates();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, room?.songs.length]);

  // Check for existing vote when comparison pair changes
  useEffect(() => {
    if (room && comparisonPair.songA && comparisonPair.songB && userId) {
      const existingVote = room.comparisons?.find(
        (c: any) => 
          ((c.songAId === comparisonPair.songA?.id && c.songBId === comparisonPair.songB?.id) ||
           (c.songAId === comparisonPair.songB?.id && c.songBId === comparisonPair.songA?.id)) &&
          c.userId === userId
      );
      if (existingVote) {
        setCurrentVote(existingVote.winnerId);
      } else {
        setCurrentVote(null);
      }
    }
  }, [room, comparisonPair, userId]);

  const fetchRoom = async (retryCount = 0): Promise<Room | null> => {
    if (!roomId) {
      setLoading(false);
      logger.warn('fetchRoom called without roomId');
      return null;
    }
    
    logger.info('Fetching room', { roomId, retryCount, userId: userId || 'not set' });
    
    // Add timeout mechanism
    const timeoutId = setTimeout(() => {
      if (retryCount === 0) {
        console.log('Room fetch timeout, retrying...');
        fetchRoom(1);
      } else {
        console.error('Room fetch timeout after retry');
        setRoom(null);
        setLoading(false);
        setToast({ message: 'Failed to load room. Please try again.', type: 'error' });
      }
    }, 10000); // 10 second timeout
    
    try {
      // Allow guest access - send headers if authenticated, otherwise empty
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      };
      
      const authHeaders = getAuthHeaders() as Record<string, string>;
      if (authHeaders['x-user-id']) {
        Object.assign(headers, authHeaders);
      }
      
      const res = await fetch(`/api/rooms/${roomId}`, { 
        cache: 'no-store',
        headers,
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        logger.error('Room fetch error', {
          error: data.error,
          roomId,
          userId: userId || 'not set',
          retryCount,
          status: res.status,
        });
        
        // If room not found, retry with exponential backoff (up to 5 retries)
        if (data.error === 'Room not found' && retryCount < 5) {
          const delays = [1000, 2000, 3000, 4000, 5000];
          const delay = delays[retryCount] || 5000;
          logger.warn('Room not found, retrying', { roomId, retryCount: retryCount + 1, delay });
          setTimeout(() => {
            fetchRoom(retryCount + 1);
          }, delay);
          return null;
        }
        
        // After retry or other errors, show error and stop loading
        setRoom(null);
        setLoading(false);
        const errorDetails = [
          `Error: ${data.error}`,
          `Room ID: ${roomId}`,
          `User ID: ${userId || 'not set'}`,
          `Request URL: /api/rooms/${roomId}`,
          `Response Status: ${res.status}`,
          `Retry Count: ${retryCount}`,
          `Timestamp: ${new Date().toISOString()}`,
        ].join('\n');
        
        // Only show error toast if there isn't already an error toast showing
        const currentToast = toast;
        if (!currentToast || currentToast.type !== 'error') {
          setToast({ 
            message: data.error === 'Room not found' 
              ? 'Room not found. It may have been deleted or you may not have access.' 
              : data.error, 
            type: 'error',
            details: errorDetails
          });
        }
        return null;
      }
      
      if (data.room) {
        logger.info('Room fetched successfully', {
          roomId: data.room.id,
          roomName: data.room.name,
          songCount: data.room.songs.length,
          retryCount,
        });
        setRoom(data.room);
        setLoading(false);
        setComparisonPair((prevPair) => {
          if (!prevPair.songA || !prevPair.songB) {
            return prevPair;
          }
          const updatedSongA = data.room.songs.find((s: Song) => s.id === prevPair.songA?.id) || prevPair.songA;
          const updatedSongB = data.room.songs.find((s: Song) => s.id === prevPair.songB?.id) || prevPair.songB;
          return { songA: updatedSongA, songB: updatedSongB };
        });
        return data.room; // Return the room data
      } else {
        logger.error('No room in response', {
          roomId,
          userId: userId || 'not set',
          responseData: data,
          retryCount,
        });
        setRoom(null);
        setLoading(false);
        const missingDataDetails = [
          `Error: Room data is missing in response`,
          `Room ID: ${roomId}`,
          `User ID: ${userId || 'not set'}`,
          `Response Data: ${JSON.stringify(data, null, 2)}`,
          `Timestamp: ${new Date().toISOString()}`,
        ].join('\n');
        
        // Only show error toast if there isn't already an error toast showing
        const currentToast = toast;
        if (!currentToast || currentToast.type !== 'error') {
          setToast({ 
            message: 'Room data is missing. Please try again.', 
            type: 'error',
            details: missingDataDetails
          });
        }
        return null;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error('Failed to fetch room', {
        roomId,
        userId: userId || 'not set',
        retryCount,
        error: error instanceof Error ? error.message : String(error),
      }, error instanceof Error ? error : undefined);
      
      // Retry once on network error
      if (retryCount === 0) {
        logger.warn('Retrying room fetch after network error', { roomId, delay: 500 });
        setTimeout(() => {
          fetchRoom(1);
        }, 500);
        return null;
      }
      
      // After retry fails, show error and stop loading
      setRoom(null);
      setLoading(false);
      const errorDetails = [
        `Error: Network or fetch error`,
        `Room ID: ${roomId}`,
        `User ID: ${userId || 'not set'}`,
        `Error Message: ${error instanceof Error ? error.message : String(error)}`,
        `Retry Count: ${retryCount}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join('\n');
      
      // Only show error toast if there isn't already an error toast showing
      const currentToast = toast;
      if (!currentToast || currentToast.type !== 'error') {
        setToast({ 
          message: 'Failed to load room. Please check your connection and try again.', 
          type: 'error',
          details: errorDetails
        });
      }
      return null;
    }
  };

  const fetchNextComparisonPair = useCallback(async () => {
    if (isGuest || !userId || !roomId) {
      console.log('Skipping comparison pair fetch:', { isGuest, userId, roomId });
      setHasFetchedPair(true); // Mark as fetched to prevent infinite retries
      return;
    }
    
    // Check if room has at least 2 songs before attempting fetch
    if (room && room.songs.length < 2) {
      console.log('Not enough songs for comparison:', room.songs.length);
      setHasFetchedPair(true); // Mark as fetched to prevent infinite retries
      return;
    }
    
    try {
      console.log('Fetching comparison pair for user:', userId, 'room:', roomId, 'songs:', room?.songs.length);
      const res = await fetch(`/api/rooms/${roomId}/compare?userId=${userId}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
        const errorMsg = data.error || `HTTP error! status: ${res.status}`;
        console.error('Comparison pair error:', errorMsg, 'Status:', res.status);
        
        // If "not enough songs" error, don't show error toast, just mark as fetched
        if (errorMsg.includes('Not enough songs') || errorMsg.includes('not enough songs')) {
          console.log('Not enough songs in room for comparison');
          setHasFetchedPair(true); // Mark as fetched to prevent infinite retries
          return;
        }
        
        // If room not found, mark as fetched and return (room fetch will handle the error)
        if (errorMsg.includes('Room not found') || res.status === 404) {
          console.log('Room not found in comparison fetch, will be handled by room fetch');
          setHasFetchedPair(true);
          return;
        }
        
        // For other errors, show toast but mark as fetched to prevent infinite retries
        setToast({ 
          message: `Comparison error: ${errorMsg}`, 
          type: 'error',
          details: `Room ID: ${roomId}, User ID: ${userId}, Songs: ${room?.songs.length || 0}, Status: ${res.status}`
        });
        setHasFetchedPair(true); // Mark as fetched even on error to prevent infinite retries
        return;
      }
      
      if (data.songA && data.songB) {
        console.log('✅ Comparison pair fetched:', data.songA.id, 'vs', data.songB.id);
        setComparisonPair({ songA: data.songA, songB: data.songB });
        setHasFetchedPair(true);
      } else {
        console.warn('Comparison pair missing songs:', data);
        setHasFetchedPair(true); // Mark as fetched to prevent infinite retries
        setToast({ 
          message: 'Unable to load comparison pair. Please try again.', 
          type: 'error',
          details: `Room ID: ${roomId}, Response: ${JSON.stringify(data)}`
        });
      }
    } catch (error) {
      console.error('Error fetching comparison pair:', error);
      setHasFetchedPair(true); // Mark as fetched to prevent infinite retries
      setToast({ 
        message: 'Failed to load comparison pair. Please try again.', 
        type: 'error',
        details: `Room ID: ${roomId}, Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }, [isGuest, userId, roomId, room]);

  const calculateWinRates = async () => {
    if (!room) return;
    const rates: { [songId: string]: WinRate } = {};
    for (const song of room.songs) {
      try {
        const res = await fetch(`/api/rooms/${roomId}/winrate/${song.id}`);
        const data = await res.json();
        if (data.winRate !== undefined) {
          rates[song.id] = data;
        }
      } catch (error) {
        console.error('Failed to fetch win rate:', error);
      }
    }
    setWinRates(rates);
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !songUrl.trim() || !room) return;

    logger.info('Starting song addition', { roomId, songTitle, songUrl: songUrl.substring(0, 50) + '...' });

    // Verify user is still authenticated and sync state
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      logger.error('User not authenticated for song addition', { roomId });
      setToast({ message: 'You are not logged in. Please log in again.', type: 'error' });
      router.push('/login');
      return;
    }

    // Ensure userId state matches localStorage
    if (userId !== currentUser.id) {
      logger.warn('userId state out of sync, updating', { old: userId, new: currentUser.id, roomId });
      setUserId(currentUser.id);
      setUser(currentUser);
      setUploader(currentUser.username);
    }

    const currentUserId = currentUser.id;
    logger.info('Adding song - user verification', { 
      userIdFromStorage: currentUserId, 
      userIdState: userId, 
      match: currentUserId === userId,
      roomId,
    });

    // CRITICAL: Enforce MAX 2 songs for draft rooms
    if (room.status === 'draft' && room.songs.length >= 2) {
      setToast({ message: 'Draft rooms can only have 2 songs. Change status to Active to add more songs.', type: 'error' });
      return;
    }

    if (!isSongUrlValid) {
      setToast({
        message: 'Please provide a valid audio link.',
        type: 'error',
        details:
          songSourceType === 'soundcloud'
            ? 'Use the SoundCloud private/secret link (Share → Copy secret link).'
            : undefined,
      });
      return;
    }

    try {
      const authHeaders = getAuthHeaders() as Record<string, string>;
      console.log('Song addition request headers:', { 
        'x-user-id': authHeaders['x-user-id'], 
        'x-user-role': authHeaders['x-user-role'] 
      });
      
      const res = await fetch(`/api/rooms/${roomId}/songs`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: normalizeText(songTitle),
          url: transformAudioUrl(songUrl.trim(), songSourceType),
          sourceType: songSourceType,
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        logger.error('Failed to add song', {
          error: data.error,
          roomId,
          userId: currentUserId,
          status: res.status,
          songTitle,
        });
        
        // Build detailed error information
        const errorDetails = [
          `Error: ${data.error}`,
          `Room ID: ${roomId}`,
          `User ID: ${currentUserId}`,
          `User from localStorage: ${JSON.stringify(currentUser)}`,
          `Request URL: /api/rooms/${roomId}/songs`,
          `Request Method: POST`,
          `Response Status: ${res.status}`,
          `Timestamp: ${new Date().toISOString()}`,
        ].join('\n');
        
        // If invalid user error, try to refresh user data
        if (data.error.includes('Invalid user') || data.error.includes('invalid user')) {
          logger.warn('Invalid user error, attempting to refresh user data', { roomId, userId: currentUserId });
          try {
            // Try to get fresh user data from server
            const userRes = await fetch('/api/auth/me', {
              headers: authHeaders,
            });
            const userData = await userRes.json();
            
            if (userData.user) {
              const refreshedUser = {
                ...userData.user,
                status: userData.user.status || 'active',
              };
              setCurrentUser(refreshedUser);
              setUser(refreshedUser);
              setUserId(refreshedUser.id);
              setUploader(refreshedUser.username);
              
              // Show BOTH the error AND the info message - don't replace the error
              const refreshErrorDetails = errorDetails + `\n\nUser refresh succeeded. User ID: ${userData.user.id}, Username: ${userData.user.username}`;
              setToast({ 
                message: 'Invalid user error occurred. User data refreshed - please try adding the song again. If the error persists, please log out and log back in.', 
                type: 'error',
                details: refreshErrorDetails
              });
              return; // Show error with refresh info, don't let user try again without seeing the error
            }
          } catch (refreshError) {
            console.error('Failed to refresh user data:', refreshError);
            const refreshErrorDetails = errorDetails + `\n\nRefresh Error: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`;
            setToast({ 
              message: 'Invalid user error. Failed to refresh user data. Please log out and log back in.', 
              type: 'error',
              details: refreshErrorDetails
            });
            return;
          }
          
          setToast({ 
            message: 'Invalid user error. User not found on server. Please log out and log back in.', 
            type: 'error',
            details: errorDetails
          });
        } else {
          setToast({ 
            message: `Failed to add song: ${data.error}`, 
            type: 'error',
            details: errorDetails
          });
        }
      } else if (data.song) {
        // Success! Log the song addition
        const newSongId = data.song.id;
        logger.info('Song added successfully', {
          songId: newSongId,
          songTitle: data.song.title,
          roomId,
          userId: currentUserId,
        });

        // Show feedback
        setSongTitle('');
        setSongUrl('');
        setAutoVersion2(false);
        // Reset comparison pair state so it can be fetched again with new songs
        setHasFetchedPair(false);
        setComparisonPair({ songA: null, songB: null });
        
        // Show success message - but don't replace any existing error toasts
        const currentToast = toast;
        if (!currentToast || currentToast.type !== 'error') {
          setToast({ message: `Song "${data.song.title}" added successfully!`, type: 'success' });
        }
        
        // Wait longer for the song to be fully persisted in Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refetch room - ensure we have a valid roomId
        if (!roomId) {
          logger.error('Room ID missing after song addition', { songId: newSongId, userId: currentUserId });
          setToast({ 
            message: 'Error: Room ID missing. Please refresh the page.', 
            type: 'error',
            details: `Song ID: ${newSongId}`
          });
          return;
        }
        
        logger.info('Refetching room after song addition', { roomId, songId: newSongId });
        
        // Retry logic with song verification
        let updatedRoom = null;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries && !updatedRoom) {
          const delay = 1000 * (retries + 1); // 1s, 2s, 3s
          if (retries > 0) {
            logger.warn('Retrying room fetch after song addition', { 
              roomId, 
              songId: newSongId, 
              retry: retries,
              delay 
            });
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          updatedRoom = await fetchRoom();
          
          if (updatedRoom) {
            // Verify the new song exists in the room
            const songExists = updatedRoom.songs.some(s => s.id === newSongId);
            if (songExists) {
              logger.info('Room fetched successfully with new song', {
                roomId,
                songId: newSongId,
                totalSongs: updatedRoom.songs.length,
                retry: retries,
              });
              break; // Success - room found and contains new song
            } else {
              logger.warn('Room found but new song missing', {
                roomId,
                songId: newSongId,
                roomSongs: updatedRoom.songs.map(s => s.id),
                retry: retries,
              });
              updatedRoom = null; // Song missing - retry
            }
          } else {
            logger.warn('Room fetch returned null', { roomId, songId: newSongId, retry: retries });
          }
          
          retries++;
        }
        
        if (!updatedRoom) {
          logger.error('Failed to fetch room with new song after all retries', {
            roomId,
            songId: newSongId,
            maxRetries,
          });
          setToast({
            message: 'Song added but room could not be refreshed. Please refresh the page manually.',
            type: 'error',
            details: `Room ID: ${roomId}, Song ID: ${newSongId}, Retries: ${maxRetries}`,
          });
          return;
        }
        
        // Wait a moment for room state to update, then fetch comparison pair if in compare mode
        if (viewMode === 'compare' && updatedRoom) {
          // Use the updated room data directly (don't wait for state update)
          if (updatedRoom.songs.length >= 2) {
            logger.info('Room has enough songs for comparison', {
              roomId,
              songCount: updatedRoom.songs.length,
            });
            // Reset hasFetchedPair so the useEffect can fetch a new pair
            setHasFetchedPair(false);
            // Small delay to ensure state is updated
            setTimeout(() => {
              fetchNextComparisonPair();
            }, 300);
          } else {
            logger.info('Room has insufficient songs for comparison', {
              roomId,
              songCount: updatedRoom.songs.length,
            });
            // Not enough songs yet, mark as fetched to prevent loading state
            setHasFetchedPair(true);
          }
        } else if (viewMode === 'compare' && !updatedRoom) {
          // Room fetch failed, mark as fetched to prevent infinite loading
          setHasFetchedPair(true);
        }
        
        setTimeout(() => {
          songTitleRef.current?.focus();
        }, 0);
      }
    } catch (error) {
      logger.error('Network error when adding song', {
        roomId,
        userId: userId || 'not set',
        songTitle,
        error: error instanceof Error ? error.message : String(error),
      }, error instanceof Error ? error : undefined);
      
      const addSongErrorDetails = [
        `Error: Network or fetch error when adding song`,
        `Room ID: ${roomId}`,
        `User ID: ${userId || 'not set'}`,
        `Song Title: ${songTitle}`,
        `Error Message: ${error instanceof Error ? error.message : String(error)}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join('\n');
      
      // Only show error toast if there isn't already an error toast showing
      const currentToast = toast;
      if (!currentToast || currentToast.type !== 'error') {
        setToast({ 
          message: 'Failed to add song. Please try again.', 
          type: 'error',
          details: addSongErrorDetails
        });
      }
    }
  };

  const getVersion2Title = () => {
    if (!room || room.songs.length === 0) return '';
    return `${normalizeText(room.songs[0].title)} - Version 2`;
  };

  const handleSongTitleBlur = () => {
    setSongTitle((prev) => {
      if (autoVersion2 && room && room.songs.length === 1) {
        return getVersion2Title();
      }
      return prev ? normalizeText(prev) : '';
    });
  };

  const handleSongTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSongTitleBlur();
      songUrlRef.current?.focus();
    }
  };

  const handleVersion2Toggle = (checked: boolean) => {
    if (!room || room.songs.length !== 1 || room.status !== 'draft') {
      setAutoVersion2(false);
      return;
    }
    setAutoVersion2(checked);
    if (checked) {
      setSongTitle(getVersion2Title());
    } else {
      setSongTitle((prev) => (prev ? normalizeText(prev) : ''));
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!room || room.status !== 'draft') return;
    if (!confirm('Remove this song? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/songs/${songId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      
      if (data.error) {
        setToast({ message: data.error, type: 'error' });
      } else {
        setToast({ message: 'Song removed successfully', type: 'success' });
        fetchRoom();
      }
    } catch (error) {
      console.error('Failed to remove song:', error);
      setToast({ message: 'Failed to remove song. Please try again.', type: 'error' });
    }
  };

  const handleComparison = async (winnerId: string) => {
    if (isGuest) {
      setToast({ message: 'Please register to vote on songs', type: 'info' });
      return;
    }
    
    if (!userId || !comparisonPair.songA || !comparisonPair.songB || comparing || !roomId) return;

    setComparing(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/compare`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          songAId: comparisonPair.songA.id,
          songBId: comparisonPair.songB.id,
          winnerId,
          userId,
        }),
      });
      
      const data = await res.json();
      if (data.error) {
        console.error('Comparison error:', data.error);
        setToast({ message: data.error, type: 'error' });
      } else {
        // Update vote state immediately
        setCurrentVote(winnerId);
        setToast({ message: 'Vote recorded!', type: 'success' });
        fetchRoom();
        fetchNextComparisonPair();
      }
    } catch (error) {
      console.error('Failed to submit comparison:', error);
      setToast({ message: 'Failed to submit comparison. Please try again.', type: 'error' });
    } finally {
      setComparing(false);
    }
  };

  const handleAddComment = async (songId: string, parentCommentId?: string) => {
    if (isGuest) {
      setToast({ message: 'Please register to leave comments', type: 'info' });
      return;
    }
    
    const textToSubmit = parentCommentId ? replyText : commentTexts[songId];
    if (!userId || !textToSubmit?.trim() || !roomId) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/songs/${songId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text: textToSubmit,
          isAnonymous: false,
          parentCommentId: parentCommentId || undefined,
        }),
      });
      
      const data = await res.json();
      if (data.error) {
        console.error('Comment error:', data.error);
        alert(data.error);
      } else {
        if (parentCommentId) {
          setReplyText('');
          setReplyingTo(null);
          setToast({ message: 'Reply added!', type: 'success' });
        } else {
          setCommentTexts({ ...commentTexts, [songId]: '' });
        }
        fetchRoom();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleReply = (commentId: string, songId: string, authorName: string) => {
    setReplyingTo({ commentId, songId, authorName });
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  // formatDate is now replaced by formatTimestamp utility

  if (loading) {
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

  if (!room) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#050816',
          color: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <p>Room not found</p>
        <Link
          href="/"
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
          }}
        >
          Go back home
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050816',
        color: '#f9fafb',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: isMobile ? '0.75rem' : '1.5rem',
        overflowX: 'hidden',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <UserProfile />
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 0.5rem', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              ...(user?.role === 'admin' ? [{ label: 'Admin Dashboard', href: '/admin' }] : []),
              { label: room.name },
            ]}
          />
          <button
            onClick={() => {
              const previousPage = sessionStorage.getItem('previousPage');
              if (previousPage && previousPage !== window.location.pathname) {
                router.push(previousPage);
              } else {
                router.push('/');
              }
            }}
            style={{
              background: '#1a1a2e',
              color: '#f9fafb',
              border: '1px solid #333',
              padding: isMobile ? '0.625rem 1rem' : '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginBottom: '1rem',
              minHeight: isMobile ? '44px' : 'auto',
            }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: isMobile ? '1rem' : '2rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                {/* Status badge on the left */}
                <span
                  style={{
                    background: room.status === 'draft' ? '#f59e0b' : room.status === 'active' ? '#10b981' : room.status === 'archived' ? '#6b7280' : '#ef4444',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}
                >
                  {room.status}
                </span>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>
                  {(() => {
                    const artistName = room.artistName ? normalizeText(room.artistName) : 'Unknown Artist';
                    const baseName = normalizeText(room.name);
                    const suffix = ` - ${artistName}`;
                    const displayName = baseName.toLowerCase().includes(suffix.toLowerCase()) ? baseName : `${baseName}${suffix}`;
                    return displayName;
                  })()}
                </h1>
              </div>
              {room.artistName && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <p style={{
                    fontSize: '0.85rem',
                    opacity: 0.7,
                    marginBottom: '0.25rem',
                    fontStyle: 'italic',
                    fontFamily: 'Georgia, serif'
                  }}>
                    by {room.artistName}
                  </p>
                  {room.artistBio && (
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      marginTop: '0.5rem',
                      lineHeight: '1.4',
                      maxWidth: '600px'
                    }}>
                      {room.artistBio}
                    </p>
                  )}
                </div>
              )}
              {room.description && (
                <p style={{ opacity: 0.8, marginBottom: '0.5rem' }}>
                  {room.description}
                </p>
              )}
              {room.status === 'draft' && (
                <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                  {room.songs.length}/2 songs added
                </p>
              )}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                  Invite code:
                  <strong
                    onClick={() => {
                      if (room.status === 'active') {
                        navigator.clipboard.writeText(room.inviteCode);
                        setToast({ message: 'Invite code copied to clipboard!', type: 'success' });
                      }
                    }}
                    style={{
                      cursor: room.status === 'active' ? 'pointer' : 'not-allowed',
                      userSelect: 'none',
                      padding: '0.25rem 0.5rem',
                      background: room.status === 'active' ? '#0f0f1e' : '#0a0a0a',
                      borderRadius: '0.25rem',
                      border: room.status === 'active' ? '1px solid #333' : '1px solid #222',
                      opacity: room.status === 'active' ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (room.status === 'active') {
                        e.currentTarget.style.background = '#1a1a2e';
                        e.currentTarget.style.borderColor = '#4a9eff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (room.status === 'active') {
                        e.currentTarget.style.background = '#0f0f1e';
                        e.currentTarget.style.borderColor = '#333';
                      }
                    }}
                    title={room.status === 'active' ? 'Click to copy' : 'Room must be active to share'}
                  >
                    {room.inviteCode}
                  </strong>
                </p>
                <button
                  onClick={() => {
                    if (room.status === 'active') {
                      // Use external URL if available, otherwise fall back to current origin
                      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                      const roomLink = `${baseUrl}/room/${room.id}`;
                      navigator.clipboard.writeText(roomLink);
                      setToast({ message: 'Room link copied to clipboard!', type: 'success' });
                    }
                  }}
                  disabled={room.status !== 'active'}
                  style={{
                    background: room.status === 'active' ? '#1a1a2e' : '#0a0a0a',
                    color: '#f9fafb',
                    border: room.status === 'active' ? '1px solid #333' : '1px solid #222',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.85rem',
                    cursor: room.status === 'active' ? 'pointer' : 'not-allowed',
                    opacity: room.status === 'active' ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (room.status === 'active') {
                      e.currentTarget.style.background = '#2a2a3e';
                      e.currentTarget.style.borderColor = '#4a9eff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (room.status === 'active') {
                      e.currentTarget.style.background = '#1a1a2e';
                      e.currentTarget.style.borderColor = '#333';
                    }
                  }}
                  title={room.status === 'active' ? 'Copy room link' : 'Room must be active to share'}
                >
                  Copy Room Link
                </button>
              </div>
            </div>
            {/* Room Status Controls (Owner/Admin Only) */}
            {(room.artistId === userId || user?.role === 'admin') && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {room.status === 'draft' && (
                  <button
                    onClick={async () => {
                      if (room.songs.length < 2) {
                        setToast({ message: 'Please add at least 2 songs before making the room active.', type: 'error' });
                        return;
                      }
                      setChangingStatus(true);
                      try {
                        const res = await fetch(`/api/rooms/${roomId}/status`, {
                          method: 'PATCH',
                          headers: getAuthHeaders(),
                          body: JSON.stringify({ status: 'active' }),
                        });
                        const data = await res.json();
                        if (data.error) {
                          setToast({ message: data.error, type: 'error' });
                        } else {
                          setToast({ message: 'Room status changed to Active!', type: 'success' });
                          fetchRoom();
                        }
                      } catch (error) {
                        setToast({ message: 'Failed to update room status', type: 'error' });
                      } finally {
                        setChangingStatus(false);
                      }
                    }}
                    disabled={changingStatus || room.songs.length < 2}
                    style={{
                      background: changingStatus || room.songs.length < 2 ? '#555' : '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: isMobile ? '0.625rem 1rem' : '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      cursor: changingStatus || room.songs.length < 2 ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      minHeight: isMobile ? '44px' : 'auto',
                    }}
                  >
                    Make Active
                  </button>
                )}
                {room.status === 'active' && (
                  <button
                    onClick={async () => {
                      if (!confirm('Archive this room? It will no longer accept new comparisons.')) return;
                      setChangingStatus(true);
                      try {
                        const res = await fetch(`/api/rooms/${roomId}/status`, {
                          method: 'PATCH',
                          headers: getAuthHeaders(),
                          body: JSON.stringify({ status: 'archived' }),
                        });
                        const data = await res.json();
                        if (data.error) {
                          setToast({ message: data.error, type: 'error' });
                        } else {
                          setToast({ message: 'Room archived successfully', type: 'success' });
                          fetchRoom();
                        }
                      } catch (error) {
                        setToast({ message: 'Failed to update room status', type: 'error' });
                      } finally {
                        setChangingStatus(false);
                      }
                    }}
                    disabled={changingStatus}
                    style={{
                      background: changingStatus ? '#555' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: isMobile ? '0.625rem 1rem' : '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      cursor: changingStatus ? 'not-allowed' : 'pointer',
                      minHeight: isMobile ? '44px' : 'auto',
                    }}
                  >
                    Archive
                  </button>
                )}
                {room.status === 'archived' && (
                  <button
                    onClick={async () => {
                      setChangingStatus(true);
                      try {
                        const res = await fetch(`/api/rooms/${roomId}/status`, {
                          method: 'PATCH',
                          headers: getAuthHeaders(),
                          body: JSON.stringify({ status: 'active' }),
                        });
                        const data = await res.json();
                        if (data.error) {
                          alert(data.error);
                        } else {
                          fetchRoom();
                        }
                      } catch (error) {
                        alert('Failed to update room status');
                      } finally {
                        setChangingStatus(false);
                      }
                    }}
                    disabled={changingStatus}
                    style={{
                      background: changingStatus ? '#555' : '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: isMobile ? '0.625rem 1rem' : '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      cursor: changingStatus ? 'not-allowed' : 'pointer',
                      minHeight: isMobile ? '44px' : 'auto',
                    }}
                  >
                    Restore
                  </button>
                )}
                {room.status !== 'deleted' && (
                  <button
                    onClick={async () => {
                      if (!confirm('Delete this room? This action can be undone by an admin.')) return;
                      setChangingStatus(true);
                      try {
                        const res = await fetch(`/api/rooms/${roomId}/status`, {
                          method: 'PATCH',
                          headers: getAuthHeaders(),
                          body: JSON.stringify({ status: 'deleted' }),
                        });
                        const data = await res.json();
                        if (data.error) {
                          setToast({ message: data.error, type: 'error' });
                        } else {
                          setToast({ message: 'Room deleted successfully', type: 'success' });
                          setTimeout(() => router.push('/'), 1000);
                        }
                      } catch (error) {
                        setToast({ message: 'Failed to delete room', type: 'error' });
                      } finally {
                        setChangingStatus(false);
                      }
                    }}
                    disabled={changingStatus}
                    style={{
                      background: changingStatus ? '#555' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      cursor: changingStatus ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              background: '#1a1a2e',
              padding: '0.25rem',
              borderRadius: '0.5rem',
            }}
          >
            <button
              onClick={() => setViewMode('compare')}
              style={{
                background: viewMode === 'compare' ? '#3b82f6' : 'transparent',
                color: 'white',
                border: 'none',
                padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                minHeight: isMobile ? '44px' : 'auto',
              }}
            >
              Compare Mode
            </button>
            <button
              onClick={() => setViewMode('browse')}
              style={{
                background: viewMode === 'browse' ? '#3b82f6' : 'transparent',
                color: 'white',
                border: 'none',
                padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                minHeight: isMobile ? '44px' : 'auto',
              }}
            >
              Browse All Songs
            </button>
          </div>
          {room && (room.artistId === userId || user?.role === 'admin') && room.status === 'draft' && viewMode === 'compare' && room.songs.length < 2 && (
            <button
              onClick={() => setShowAddSong(!showAddSong)}
              style={{
                background: showAddSong ? '#555' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              {showAddSong ? 'Cancel' : '+ Add Song'}
            </button>
          )}
        </div>

        {showAddSong && viewMode === 'compare' && (
          <div
            style={{
              background: '#1a1a2e',
              padding: isMobile ? '1rem' : '1.5rem',
              borderRadius: '0.75rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
              Add Song
            </h2>
            {room && room.status === 'draft' && (
              <p style={{ marginBottom: '1rem', padding: '0.75rem', background: '#0f0f1e', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                {room.songs.length < 2 
                  ? `${room.songs.length}/2 songs added. Add ${2 - room.songs.length} more to make room active.`
                  : '2/2 songs added! Room is ready. Change status to Active to compare songs.'}
              </p>
            )}
            {/* Show list of added songs with play buttons and remove option */}
            {room && room.songs.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>Added Songs:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {room.songs.map((song) => (
                    <div
                      key={song.id}
                      style={{
                        padding: '1rem',
                        background: '#0f0f1e',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                          {song.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                          by {song.uploader}
                        </div>
                        {renderSongPlayer(song, 'compact')}
                      </div>
                      {room.status === 'draft' && (room.artistId === userId || user?.role === 'admin') && (
                        <button
                          onClick={() => handleRemoveSong(song.id)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: isMobile ? '0.625rem 1rem' : '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            minHeight: isMobile ? '44px' : 'auto',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <form
              onSubmit={handleAddSong}
            >
            {/* Only show input fields if room is not draft with 2 songs */}
            {!(room && room.status === 'draft' && room.songs.length >= 2) && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      opacity: 0.9,
                    }}
                  >
                    Song Title *
                  </label>
                  <input
                    ref={songTitleRef}
                    type="text"
                    value={songTitle}
                    readOnly={autoVersion2}
                    onChange={(e) => setSongTitle(e.target.value)}
                    onBlur={handleSongTitleBlur}
                    onKeyDown={handleSongTitleKeyDown}
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
                    placeholder="e.g., Track 1"
                  />
                </div>
                  {room && room.status === 'draft' && room.songs.length > 0 && (
                    <label
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        opacity: room.songs.length === 1 ? 0.9 : 0.5,
                        marginBottom: '1rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={autoVersion2}
                        disabled={room.songs.length !== 1}
                        onChange={(e) => handleVersion2Toggle(e.target.checked)}
                      />
                      Use "{normalizeText(room.songs[0].title)} - Version 2" for this song
                    </label>
                  )}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      opacity: 0.9,
                    }}
                  >
                    Audio Source *
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {[
                      { value: 'direct' as const, label: 'Direct / Dropbox link' },
                      { value: 'soundcloud' as const, label: 'SoundCloud (private link)' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSongSourceType(option.value)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: '999px',
                          border: option.value === songSourceType ? '1px solid #3b82f6' : '1px solid #333',
                          background: option.value === songSourceType ? 'rgba(59,130,246,0.18)' : 'transparent',
                          color: '#f9fafb',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                    {songSourceType === 'direct'
                      ? 'Paste a cleaned Dropbox, Google Drive (share → anyone with link), AWS S3, or any HTTPS audio URL. Dropbox links are auto-converted to raw playback.'
                      : 'Open SoundCloud → Share → Copy private/secret link (looks like https://soundcloud.com/.../s-XXXX). The track will play inside Song Pig without leaving the page.'}
                  </p>
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
                    Audio URL *
                  </label>
                  <input
                    ref={songUrlRef}
                    type="url"
                    value={songUrl}
                    onChange={(e) => setSongUrl(e.target.value)}
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
                    placeholder={
                      songSourceType === 'soundcloud'
                        ? 'https://soundcloud.com/artist/track/s-XXXX'
                        : 'https://example.com/audio.mp3'
                    }
                  />
                  {songUrlError && (
                    <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      {songUrlError}
                    </p>
                  )}
                  {/* Test profile URLs button */}
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSongSourceType('direct');
                        setSongUrl('https://www.dropbox.com/scl/fi/y1qotzbjavsmo4te8oilq/When-the-Letters-Stopped-659.mp3?rlkey=ip5mrrp04dex4x3myrex5qibj&st=tlaswv6t&dl=0');
                      }}
                      style={{
                        background: '#1a1a2e',
                        color: '#f9fafb',
                        border: '1px solid #333',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Test URL 1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSongSourceType('direct');
                        setSongUrl('https://www.dropbox.com/scl/fi/najl5njoxxgrte5wq0rxq/Marve-My-Love_mastered.wav?rlkey=dh8uo11wn0z4a587t1epaaxrv&st=8hlre10m&dl=0');
                      }}
                      style={{
                        background: '#1a1a2e',
                        color: '#f9fafb',
                        border: '1px solid #333',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Test URL 2
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSongSourceType('soundcloud');
                        setSongUrl('https://soundcloud.com/iron-incense/when-the-letters-stopped-623-ver-1-1/s-BltIfEUQX1F');
                      }}
                      style={{
                        background: '#1a1a2e',
                        color: '#f9fafb',
                        border: '1px solid #333',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      SoundCloud V1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSongSourceType('soundcloud');
                        setSongUrl('https://soundcloud.com/iron-incense/when-the-letters-stopped-659-ver-2-2/s-6QHBgJwCsmi');
                      }}
                      style={{
                        background: '#1a1a2e',
                        color: '#f9fafb',
                        border: '1px solid #333',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      SoundCloud V2
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={!songTitle.trim() || !isSongUrlValid}
                  style={{
                    background: (!songTitle.trim() || !isSongUrlValid) ? '#555' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: isMobile ? '0.875rem 1.25rem' : '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    cursor: (!songTitle.trim() || !isSongUrlValid) ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    minHeight: isMobile ? '44px' : 'auto',
                  }}
                >
                  Add Song
                </button>
                {room.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => setShowAddSong(false)}
                    style={{
                      background: '#1a1a2e',
                      color: '#f9fafb',
                      border: '1px solid #333',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      cursor: 'pointer',
                    }}
                  >
                    Done Adding Songs
                  </button>
                )}
                </div>
              </>
            )}
            {room && room.status === 'draft' && room.songs.length >= 2 && (
              <div style={{ 
                padding: '1rem', 
                background: '#0f0f1e', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                textAlign: 'center',
                fontSize: '0.9rem',
                opacity: 0.8
              }}>
                2/2 songs added! Change status to Active to compare songs.
              </div>
            )}
          </form>
          </div>
        )}

        {viewMode === 'browse' ? (
          <div>
            <details 
              open={showAllSongs}
              style={{ marginBottom: '1rem' }}
            >
              <summary
                onClick={(e) => {
                  e.preventDefault();
                  setShowAllSongs(!showAllSongs);
                }}
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: '1.5rem',
                  fontWeight: '500',
                  padding: '0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ transform: showAllSongs ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
                All Songs ({room.songs.length})
              </summary>
              {!showAllSongs && room.songs.length > 0 && (
                <p style={{ opacity: 0.7, padding: '1rem', textAlign: 'center' }}>
                  Click to expand and view all songs
                </p>
              )}
              {showAllSongs && (
                <>
                {room.songs.length === 0 ? (
                  <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>
                    No songs yet. Add one to get started!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                {room.songs.map((song) => {
                  const winRate = winRates[song.id];
                  const hasStats = winRate && (winRate.wins + winRate.losses > 0);

                  return (
                    <div
                      key={song.id}
                      style={{
                        background: '#1a1a2e',
                        padding: isMobile ? '1rem' : '1.5rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #333',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          justifyContent: 'space-between',
                          alignItems: isMobile ? 'flex-start' : 'flex-start',
                          marginBottom: '1rem',
                          gap: isMobile ? '0.75rem' : 0,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', marginBottom: '0.5rem' }}>
                            {song.title}
                          </h3>
                          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                            Uploaded by {song.uploader}
                          </p>
                          {hasStats && (
                            <div
                              style={{
                                display: 'inline-block',
                                background: winRate.winRate >= 50 ? '#10b98120' : '#ef444420',
                                color: winRate.winRate >= 50 ? '#10b981' : '#ef4444',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                marginTop: '0.5rem',
                              }}
                            >
                              Win Rate: {winRate.winRate.toFixed(0)}% ({winRate.wins} wins, {winRate.losses} {winRate.losses !== 1 ? 'losses' : 'loss'})
                            </div>
                          )}
                        </div>
                      </div>

                      {renderSongPlayer(song)}

                      <div
                        style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #333' }}
                      >
                        <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                          Comments ({song.comments.length})
                        </h4>
                        
                        {/* Comment guidelines */}
                        <div style={{ 
                          background: '#0f0f1e', 
                          padding: '0.75rem', 
                          borderRadius: '0.5rem', 
                          marginBottom: '1rem',
                          fontSize: '0.85rem',
                          opacity: 0.7,
                          fontStyle: 'italic'
                        }}>
                          <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Why we want your feedback:</p>
                          <p style={{ margin: 0, marginBottom: '0.5rem' }}>
                            Help the artist choose the best version by sharing specific, constructive feedback about what works and what doesn't.
                          </p>
                          <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: '500' }}>Helpful feedback examples:</p>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc' }}>
                            <li>&quot;The vocals are clearer in this version&quot;</li>
                            <li>&quot;This mix has better bass response&quot;</li>
                            <li>&quot;The intro is more engaging&quot;</li>
                            <li>&quot;The tempo feels better here&quot;</li>
                          </ul>
                        </div>

                        <CommentThread
                          comments={song.comments.map((c: any) => ({
                            id: c.id,
                            text: c.text,
                            authorId: c.authorId || c.userId,
                            authorUsername: c.authorUsername || c.userId,
                            isAnonymous: c.isAnonymous || false,
                            parentCommentId: c.parentCommentId,
                            createdAt: c.createdAt || c.timestamp,
                          }))}
                          songId={song.id}
                          roomId={roomId || ''}
                          currentUserId={userId}
                          isGuest={isGuest}
                          onCommentAdded={fetchRoom}
                          formatTimestamp={formatTimestamp}
                        />
                      </div>
                    </div>
                  );
                })}
                  </div>
                )}
                </>
              )}
            </details>
          </div>
        ) : (
          <div>
            {room.songs.length < 2 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  background: '#1a1a2e',
                  borderRadius: '0.75rem',
                }}
              >
                <p style={{ opacity: 0.8, marginBottom: '0.5rem' }}>
                  Need at least 2 songs to compare
                </p>
                <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>
                  Add more songs to start comparing
                </p>
              </div>
            ) : comparisonPair.songA && comparisonPair.songB ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: isMobile ? '1.5rem' : '2rem',
                  marginBottom: '2rem',
                }}
              >
                {/* Song A */}
                <div
                  style={{
                    background: '#1a1a2e',
                    padding: isMobile ? '1rem' : '2rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <h3
                    style={{
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      marginBottom: '0.5rem',
                      textAlign: 'center',
                    }}
                  >
                    {comparisonPair.songA.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      opacity: 0.7,
                      marginBottom: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    Uploaded by {comparisonPair.songA.uploader}
                  </p>
                  {renderSongPlayer(comparisonPair.songA)}
                  <button
                    onClick={() => comparisonPair.songA && handleComparison(comparisonPair.songA.id)}
                    disabled={comparing || isGuest}
                    style={{
                      background: comparing ? '#555' : currentVote === comparisonPair.songA.id ? '#10b981' : isGuest ? '#6b7280' : '#10b981',
                      color: 'white',
                      border: currentVote === comparisonPair.songA.id ? '2px solid #10b981' : 'none',
                      padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
                      borderRadius: '0.5rem',
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      cursor: comparing || isGuest ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      width: '100%',
                      marginBottom: '1rem',
                      position: 'relative',
                      minHeight: isMobile ? '44px' : 'auto',
                    }}
                  >
                    {comparing
                      ? 'Submitting...'
                      : isGuest
                      ? 'Register to Vote'
                      : currentVote === comparisonPair.songA.id
                      ? '✓ You Prefer This Song'
                      : 'Prefer This Song'}
                  </button>
                  
                  {/* Comments section for Song A in compare mode */}
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #333' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', opacity: 0.8 }}>
                      Comments ({comparisonPair.songA.comments?.length || 0})
                    </h4>
                    
                    <CommentThread
                      comments={(comparisonPair.songA.comments || []).map((c: any) => ({
                        id: c.id,
                        text: c.text,
                        authorId: c.authorId || c.userId,
                        authorUsername: c.authorUsername || c.userId,
                        isAnonymous: c.isAnonymous || false,
                        parentCommentId: c.parentCommentId,
                        createdAt: c.createdAt || c.timestamp,
                      }))}
                      songId={comparisonPair.songA.id}
                      roomId={roomId || ''}
                      currentUserId={userId}
                      isGuest={isGuest}
                      onCommentAdded={fetchRoom}
                      formatTimestamp={formatTimestamp}
                    />
                  </div>
                </div>

                {/* Song B */}
                <div
                  style={{
                    background: '#1a1a2e',
                    padding: isMobile ? '1rem' : '2rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <h3
                    style={{
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      marginBottom: '0.5rem',
                      textAlign: 'center',
                    }}
                  >
                    {comparisonPair.songB.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      opacity: 0.7,
                      marginBottom: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    Uploaded by {comparisonPair.songB.uploader}
                  </p>
                  {renderSongPlayer(comparisonPair.songB)}
                  <button
                    onClick={() => comparisonPair.songB && handleComparison(comparisonPair.songB.id)}
                    disabled={comparing || isGuest}
                    style={{
                      background: comparing ? '#555' : currentVote === comparisonPair.songB.id ? '#10b981' : isGuest ? '#6b7280' : '#10b981',
                      color: 'white',
                      border: currentVote === comparisonPair.songB.id ? '2px solid #10b981' : 'none',
                      padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
                      borderRadius: '0.5rem',
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      cursor: comparing || isGuest ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      width: '100%',
                      marginBottom: '1rem',
                      position: 'relative',
                      minHeight: isMobile ? '44px' : 'auto',
                    }}
                  >
                    {comparing
                      ? 'Submitting...'
                      : isGuest
                      ? 'Register to Vote'
                      : currentVote === comparisonPair.songB.id
                      ? '✓ You Prefer This Song'
                      : 'Prefer This Song'}
                  </button>
                  
                  {/* Comments section for Song B in compare mode */}
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #333' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', opacity: 0.8 }}>
                      Comments ({comparisonPair.songB.comments?.length || 0})
                    </h4>
                    
                    <CommentThread
                      comments={(comparisonPair.songB.comments || []).map((c: any) => ({
                        id: c.id,
                        text: c.text,
                        authorId: c.authorId || c.userId,
                        authorUsername: c.authorUsername || c.userId,
                        isAnonymous: c.isAnonymous || false,
                        parentCommentId: c.parentCommentId,
                        createdAt: c.createdAt || c.timestamp,
                      }))}
                      songId={comparisonPair.songB.id}
                      roomId={roomId || ''}
                      currentUserId={userId}
                      isGuest={isGuest}
                      onCommentAdded={fetchRoom}
                      formatTimestamp={formatTimestamp}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  background: '#1a1a2e',
                  borderRadius: '0.75rem',
                }}
              >
                <p style={{ opacity: 0.8 }}>Loading comparison...</p>
              </div>
            )}
          </div>
        )}
      </div>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            details={toast.details}
            onClose={handleToastClose}
            duration={toast.type === 'error' ? 0 : 3000} // Errors don't auto-dismiss
          />
        )}
      {showGuestPrompt && (
        <GuestPrompt
          roomId={roomId || ''}
          onContinueAsGuest={() => {
            setShowGuestPrompt(false);
            setIsGuest(true);
            setViewMode('browse'); // Auto-switch to browse mode for guests
            // Ensure room loads for guest
            if (roomId && !room) {
              fetchRoom();
            } else {
              setLoading(false);
            }
          }}
        />
      )}
      <ScrollToTop />
    </main>
  );
}
