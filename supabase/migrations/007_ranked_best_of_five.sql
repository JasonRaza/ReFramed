-- Ranked best-of-five match counters

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS ranked_player1_rounds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranked_player2_rounds INTEGER NOT NULL DEFAULT 0;
