-- Ranked and Battle Royale MVP support

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS royale_players JSONB;

-- Existing installs may have a mode constraint from local experiments.
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_mode_check;
ALTER TABLE rooms ADD CONSTRAINT rooms_mode_check CHECK (
  mode IN ('duel', 'practice', 'mirror', 'royale', 'ranked')
);
