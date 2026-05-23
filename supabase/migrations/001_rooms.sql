-- ReFramed: rooms table
-- Run this in the Supabase SQL editor or via `supabase db push`

CREATE TABLE IF NOT EXISTS rooms (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT         NOT NULL UNIQUE,
  state              TEXT         NOT NULL DEFAULT 'LOBBY',
  current_pose_id    TEXT,
  player1_id         TEXT,
  player2_id         TEXT,
  player1_image_url  TEXT,
  player2_image_url  TEXT,
  player1_score      INTEGER,
  player2_score      INTEGER,
  winner             TEXT,
  phase_started_at   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code  ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_state ON rooms(state);

-- Row Level Security: all players can read/write rooms (no auth for this game)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rooms_public" ON rooms;
CREATE POLICY "rooms_public"
  ON rooms FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for this table
-- Also toggle it in Supabase Dashboard → Database → Replication
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
