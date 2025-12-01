-- Migration: Managed uploads caps and per-artist limits
-- Run this against your Supabase database after supabase-cloudflare-migration.sql

-- 1. Update allow_managed_uploads default to true and enable it for existing users
ALTER TABLE users
  ALTER COLUMN allow_managed_uploads SET DEFAULT true;

UPDATE users
SET allow_managed_uploads = true
WHERE allow_managed_uploads IS NOT TRUE;

-- 2. Per-artist cloud song cap
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS max_cloud_songs INTEGER NOT NULL DEFAULT 6;

-- 3. Optional storage usage plumbing (not fully enforced yet)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN users.allow_managed_uploads IS 'Whether this user can upload audio to SongPig-managed Cloudflare storage';
COMMENT ON COLUMN users.max_cloud_songs IS 'Maximum number of Cloudflare-hosted songs this user may upload';
COMMENT ON COLUMN users.storage_limit_bytes IS 'Optional per-user storage cap in bytes for Cloudflare-hosted audio';
COMMENT ON COLUMN users.storage_used_bytes IS 'Approximate storage used in bytes for Cloudflare-hosted audio';


