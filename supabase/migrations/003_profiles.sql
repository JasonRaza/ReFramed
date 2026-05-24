-- Add player profiles and game mode

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS mode             TEXT NOT NULL DEFAULT 'duel',
  ADD COLUMN IF NOT EXISTS player1_username TEXT,
  ADD COLUMN IF NOT EXISTS player1_avatar   TEXT,
  ADD COLUMN IF NOT EXISTS player2_username TEXT,
  ADD COLUMN IF NOT EXISTS player2_avatar   TEXT;
