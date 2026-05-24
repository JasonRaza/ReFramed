-- Migration 008: True Battle Royale support
-- Adds a per-round image map (playerId → imageUrl) for concurrent uploads

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS royale_player_images JSONB DEFAULT '{}'::jsonb;

-- Atomic merge: updates a single player's image URL without overwriting others.
-- Safe for concurrent uploads because JSONB || only touches the given key.
CREATE OR REPLACE FUNCTION public.merge_royale_player_image(
  p_room_id   UUID,
  p_player_id TEXT,
  p_image_url TEXT
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.rooms
  SET royale_player_images =
        COALESCE(royale_player_images, '{}'::jsonb)
        || jsonb_build_object(p_player_id, p_image_url)
  WHERE id = p_room_id;
$$;
