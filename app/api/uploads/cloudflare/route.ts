import { NextRequest, NextResponse } from 'next/server';
import {
  isR2Configured,
  generateStorageKey,
  getUploadUrl,
  getPublicUrl,
  isSupportedAudioType,
  getExtensionForType,
} from '@/app/lib/cloudflare-r2';
import { userStore } from '@/app/lib/users';
import { supabaseServer } from '@/app/lib/supabase-server';

// POST /api/uploads/cloudflare - Get a pre-signed upload URL
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as 'admin' | 'artist' | 'listener' | null;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only artists and admins can upload
    if (userRole !== 'artist' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only artists can upload files' },
        { status: 403 }
      );
    }

    // Check if R2 is configured
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Cloud storage is not configured' },
        { status: 503 }
      );
    }

    // Check if user has permission to use managed uploads
    const user = await userStore.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Enforce managed-upload permissions and per-artist caps (artists only)
    if (userRole !== 'admin') {
      const allowManaged = user.allowManagedUploads !== false; // default to true if undefined
      if (!allowManaged) {
        return NextResponse.json(
          {
            error: 'Cloud uploads are disabled for your account. Contact support if you need access.',
            code: 'MANAGED_UPLOADS_DISABLED',
          },
          { status: 403 }
        );
      }

      const maxCloudSongs = user.maxCloudSongs ?? 6;
      if (maxCloudSongs <= 0) {
        return NextResponse.json(
          {
            error: 'You are not allowed to upload songs to SongPig Cloud at this time.',
            code: 'MANAGED_UPLOADS_DISABLED',
          },
          { status: 403 }
        );
      }

      // Count existing Cloudflare-hosted songs for this uploader
      const { count, error: countError } = await supabaseServer
        .from('songs')
        .select('id', { count: 'exact', head: true })
        .eq('uploader_id', userId)
        .eq('storage_type', 'cloudflare');

      if (!countError && typeof count === 'number' && count >= maxCloudSongs) {
        return NextResponse.json(
          {
            error: `You have reached your SongPig Cloud upload limit (${maxCloudSongs} songs).`,
            code: 'STORAGE_LIMIT_REACHED',
            maxCloudSongs,
            currentCloudSongs: count,
          },
          { status: 403 }
        );
      }
    }

    // Parse request body
    const body = await request.json();
    const { roomId, fileName, contentType = 'audio/mpeg' } = body as {
      roomId?: string;
      fileName?: string;
      contentType?: string;
    };

    if (!roomId || !fileName) {
      return NextResponse.json(
        { error: 'roomId and fileName are required' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!isSupportedAudioType(contentType)) {
      return NextResponse.json(
        { error: `Unsupported audio format. Supported: MP3, WAV, AIFF, FLAC, OGG, WebM, M4A` },
        { status: 400 }
      );
    }

    // Generate storage key
    const extension = getExtensionForType(contentType);
    const baseFileName = fileName.replace(/\.[^/.]+$/, ''); // Remove existing extension
    const storageKey = generateStorageKey(roomId, `${baseFileName}${extension}`);

    // Get pre-signed upload URL
    const uploadUrl = await getUploadUrl(storageKey, contentType);

    // Get public URL for playback
    const publicUrl = getPublicUrl(storageKey);

    return NextResponse.json({
      uploadUrl,
      storageKey,
      publicUrl,
      contentType,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

