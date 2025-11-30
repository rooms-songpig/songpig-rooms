-- Adds source metadata for each song so we can distinguish direct links from SoundCloud embeds.
-- NOTE: If you already ran the previous migration with only 'direct' and 'soundcloud',
-- you need to drop and recreate the constraint:
--   ALTER TABLE songs DROP CONSTRAINT IF EXISTS songs_source_type_check;
--   ALTER TABLE songs ADD CONSTRAINT songs_source_type_check CHECK (source_type IN ('direct', 'soundcloud', 'soundcloud_embed'));

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'direct'
    CHECK (source_type IN ('direct', 'soundcloud', 'soundcloud_embed'));


