-- Migration: Add auth_id and avatar_url columns to users table
-- This migration adds support for Supabase Auth integration and profile pictures

-- Add auth_id column to link Supabase Auth users with app users
-- This allows users to sign in with OAuth providers (Google, etc.)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_id TEXT UNIQUE;

-- Add index on auth_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Add avatar_url column for profile pictures
-- This stores the URL to the user's profile picture (from OAuth provider or uploaded)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment to document the columns
COMMENT ON COLUMN users.auth_id IS 'Supabase Auth user ID for OAuth integration';
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture';

