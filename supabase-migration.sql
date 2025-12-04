-- Supabase Migration for Songpig Rooms
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'artist', 'listener')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'deleted')),
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_name TEXT,
  artist_bio TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  access_type TEXT NOT NULL DEFAULT 'invite-code' CHECK (access_type IN ('private', 'invited-artists', 'invite-code')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'deleted')),
  -- Whether this is a globally available Starter Room for reviewers
  is_starter_room BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  last_accessed TIMESTAMPTZ
);

-- Room invited artists (many-to-many)
CREATE TABLE IF NOT EXISTS room_invited_artists (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, artist_id)
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  uploader TEXT NOT NULL,
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  author_username TEXT NOT NULL,
  text TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Comparisons table
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  song_a_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  song_b_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure winner is one of the two songs
  CHECK (winner_id = song_a_id OR winner_id = song_b_id),
  -- Ensure song_a_id != song_b_id
  CHECK (song_a_id != song_b_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_artist_id ON rooms(artist_id);
CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON rooms(invite_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_invited_artists_room_id ON room_invited_artists(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invited_artists_artist_id ON room_invited_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_room_id ON songs(room_id);
CREATE INDEX IF NOT EXISTS idx_songs_uploader_id ON songs(uploader_id);
CREATE INDEX IF NOT EXISTS idx_comments_song_id ON comments(song_id);
CREATE INDEX IF NOT EXISTS idx_comments_room_id ON comments(room_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_room_id ON comparisons(room_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_user_id ON comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_song_a_id ON comparisons(song_a_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_song_b_id ON comparisons(song_b_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_winner_id ON comparisons(winner_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Additional safe-guard migrations (idempotent) -----------------------------

-- Ensure is_starter_room exists on rooms (older databases may not have it)
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS is_starter_room BOOLEAN NOT NULL DEFAULT false;


-- Unique constraint for comparisons: one vote per user per song pair
-- This prevents duplicate votes for the same pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_comparisons_user_pair_unique 
ON comparisons(user_id, room_id, LEAST(song_a_id, song_b_id), GREATEST(song_a_id, song_b_id));



