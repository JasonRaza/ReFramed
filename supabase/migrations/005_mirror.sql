-- Mirror mode columns
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS current_poser  TEXT,
  ADD COLUMN IF NOT EXISTS mirror_ref_url TEXT,
  ADD COLUMN IF NOT EXISTS mirror_copy_url TEXT,
  ADD COLUMN IF NOT EXISTS current_round  INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_rounds   INTEGER NOT NULL DEFAULT 2;

-- Extend the state check constraint to include mirror states
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_state_check;
ALTER TABLE rooms ADD CONSTRAINT rooms_state_check CHECK (
  state IN (
    'LOBBY','PREVIEW','POSE','CAPTURE','SCORING','RESULTS',
    'MIRROR_POSE','MIRROR_COPY','MIRROR_SCORING','MIRROR_ROUND'
  )
);
