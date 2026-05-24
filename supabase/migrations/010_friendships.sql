-- ── 010_friendships.sql ──────────────────────────────────────────────────────
-- Adds rank_points to user_profiles and creates a friendships table.

-- ── rank_points column ────────────────────────────────────────────────────────

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS rank_points INT NOT NULL DEFAULT 1000;

-- ── friendships table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.friendships (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Read own friendships
CREATE POLICY "friendships_select_own"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id);

-- Add a friend (you can only insert rows where you are user_id)
CREATE POLICY "friendships_insert_own"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Remove a friend
CREATE POLICY "friendships_delete_own"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id);
