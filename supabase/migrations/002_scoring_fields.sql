-- Add per-player roasts, scored flag, and player-images storage bucket

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS player1_roast TEXT,
  ADD COLUMN IF NOT EXISTS player2_roast TEXT,
  ADD COLUMN IF NOT EXISTS scored        BOOLEAN NOT NULL DEFAULT FALSE;

-- Storage bucket for player photos (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-images', 'player-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous uploads (no auth in this game)
DROP POLICY IF EXISTS "player_images_insert" ON storage.objects;
CREATE POLICY "player_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'player-images');

DROP POLICY IF EXISTS "player_images_select" ON storage.objects;
CREATE POLICY "player_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "player_images_update" ON storage.objects;
CREATE POLICY "player_images_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'player-images');
