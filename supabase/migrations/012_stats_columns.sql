-- ── 012_stats_columns.sql ─────────────────────────────────────────────────────
-- Adds per-user game statistics columns to user_profiles and an RPC to
-- increment them atomically from the client.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS games_played INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wins         INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_games  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_wins   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_score   INT NOT NULL DEFAULT 0;

-- record_game_result — increments stats for the currently authenticated user.
-- Keeps both naming schemes in sync for older screens/seeds.
CREATE OR REPLACE FUNCTION public.record_game_result(
  p_won   BOOLEAN,
  p_score INT
)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    games_played = games_played + 1,
    wins         = wins + (CASE WHEN p_won THEN 1 ELSE 0 END),
    total_games  = total_games + 1,
    total_wins   = total_wins + (CASE WHEN p_won THEN 1 ELSE 0 END),
    best_score   = GREATEST(best_score, p_score)
  WHERE id = auth.uid();
END;
$$;
