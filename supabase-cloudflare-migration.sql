-- Migration: Add Cloudflare R2 audio hosting support
-- Run this against your Supabase database

-- 1. Add storage columns to songs table
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS storage_type TEXT NOT NULL DEFAULT 'external'
    CHECK (storage_type IN ('external', 'cloudflare')),
  ADD COLUMN IF NOT EXISTS storage_key TEXT;

-- 2. Add allow_managed_uploads flag to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS allow_managed_uploads BOOLEAN NOT NULL DEFAULT false;

-- 3. Create index for faster lookups on storage_type
CREATE INDEX IF NOT EXISTS idx_songs_storage_type ON songs(storage_type);

-- 4. Comment for documentation
COMMENT ON COLUMN songs.storage_type IS 'Where the audio file is stored: external (URL) or cloudflare (R2)';
COMMENT ON COLUMN songs.storage_key IS 'R2 object key for cloudflare-hosted files (e.g., rooms/abc123/song.mp3)';
COMMENT ON COLUMN users.allow_managed_uploads IS 'Whether this user can upload files to SongPig Cloud (R2)';

