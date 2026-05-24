-- Poses table — replaces hardcoded poses.json

CREATE TABLE IF NOT EXISTS public.poses (
  id         TEXT PRIMARY KEY,
  title      TEXT    NOT NULL,
  artist     TEXT    NOT NULL,
  category   TEXT    NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  image_url  TEXT    NOT NULL
);

ALTER TABLE public.poses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "poses_public_read" ON public.poses;
CREATE POLICY "poses_public_read"
  ON public.poses FOR SELECT
  USING (true);
