// Cloudflare R2 integration for audio file storage
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 configuration from environment variables
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'songpig-audio';
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

// Check if R2 is configured
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL);
}

// Create S3 client for R2
function getR2Client(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Cloudflare R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

// Generate a storage key for a song file
export function generateStorageKey(roomId: string, fileName: string): string {
  // Sanitize filename - keep extension, replace spaces and special chars
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
  
  // Add timestamp to prevent collisions
  const timestamp = Date.now();
  const ext = sanitized.includes('.') ? '' : '.mp3'; // Default to mp3 if no extension
  
  return `rooms/${roomId}/${timestamp}_${sanitized}${ext}`;
}

// Get a pre-signed URL for uploading a file
export async function getUploadUrl(
  storageKey: string,
  contentType: string = 'audio/mpeg',
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const client = getR2Client();
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storageKey,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn });
  return signedUrl;
}

// Get the public URL for a stored file
export function getPublicUrl(storageKey: string): string {
  if (!R2_PUBLIC_URL) {
    throw new Error('R2 public URL not configured');
  }
  
  // Remove trailing slash from public URL if present
  const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
  return `${baseUrl}/${storageKey}`;
}

// Delete a file from R2
export async function deleteFile(storageKey: string): Promise<boolean> {
  try {
    const client = getR2Client();
    
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    return false;
  }
}

// Supported audio content types
export const SUPPORTED_AUDIO_TYPES: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/wave': '.wav',
  'audio/x-wav': '.wav',
  'audio/aiff': '.aiff',
  'audio/x-aiff': '.aiff',
  'audio/flac': '.flac',
  'audio/x-flac': '.flac',
  'audio/ogg': '.ogg',
  'audio/webm': '.webm',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
};

// Check if a content type is supported
export function isSupportedAudioType(contentType: string): boolean {
  return contentType in SUPPORTED_AUDIO_TYPES;
}

// Get file extension for content type
export function getExtensionForType(contentType: string): string {
  return SUPPORTED_AUDIO_TYPES[contentType] || '.mp3';
}

