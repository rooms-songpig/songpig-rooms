-- Adds source metadata for each song so we can distinguish direct links from SoundCloud embeds.
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'direct'
    CHECK (source_type IN ('direct', 'soundcloud'));


