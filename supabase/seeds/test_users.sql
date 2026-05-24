-- ── Test Users Seed ───────────────────────────────────────────────────────────
-- Creates 6 dummy accounts at different rank tiers for leaderboard testing.
-- Run this in the Supabase Dashboard → SQL Editor.
-- Safe to re-run (idempotent via ON CONFLICT DO NOTHING / DO UPDATE).
--
-- Prerequisites: run migrations 009–012 first.
--
-- Rank thresholds:
--   Bronze  <  900 pts
--   Argent  ≥  900 pts
--   Or      ≥ 1100 pts
--   Platine ≥ 1300 pts
--   Diamant ≥ 1550 pts
--   Légende ≥ 1850 pts

INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000001-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'legende@test.reframed',
    crypt('TestPass123!', gen_salt('bf', 10)),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000002-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'diamant@test.reframed',
    crypt('TestPass123!', gen_salt('bf', 10)),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000003-0000-0000-0000-000000000003',
    'authenticated', 'authenticated',
    'platine@test.reframed',
    crypt('TestPass123!', gen_salt('bf', 10)),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000004-0000-0000-0000-000000000004',
    'authenticated', 'authenticated',
    'or@test.reframed',
    crypt('TestPass123!', gen_salt('bf', 10)),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000005-0000-0000-0000-000000000005',
    'authenticated', 'authenticated',
    'argent@test.reframed',
    crypt('TestPass123!', gen_salt('bf', 10)),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000006-0000-0000-0000-000000000006',
    'authenticated', 'authenticated',
    'bronze@test.reframed',
    crypt('TestPass123!', gen_salt('bf', 10)),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- Profiles with rank points, stats, and friends
INSERT INTO public.user_profiles (id, username, avatar, rank_points, games_played, wins, best_score)
VALUES
  ('b0000001-0000-0000-0000-000000000001', 'LégendePro',    '🦁|amber',  2200, 312, 241, 98),
  ('b0000002-0000-0000-0000-000000000002', 'DiamondEagle',  '🦅|coral',  1700, 187, 124, 94),
  ('b0000003-0000-0000-0000-000000000003', 'PlatineBot',    '🤖|teal',   1380,  98,  57, 89),
  ('b0000004-0000-0000-0000-000000000004', 'GoldFox',       '🦊|orange', 1150,  64,  34, 82),
  ('b0000005-0000-0000-0000-000000000005', 'SilverPenguin', '🐧|sky',     970,  43,  19, 76),
  ('b0000006-0000-0000-0000-000000000006', 'BronzeWolf',    '🐺|violet',  450,  21,   6, 61)
ON CONFLICT (id) DO UPDATE SET
  username    = EXCLUDED.username,
  avatar      = EXCLUDED.avatar,
  rank_points = EXCLUDED.rank_points,
  games_played = EXCLUDED.games_played,
  wins        = EXCLUDED.wins,
  best_score  = EXCLUDED.best_score;

-- Mutual friendships between test accounts so the friends leaderboard isn't empty
INSERT INTO public.friendships (user_id, friend_id)
VALUES
  ('b0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002'),
  ('b0000002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001'),
  ('b0000001-0000-0000-0000-000000000001', 'b0000003-0000-0000-0000-000000000003'),
  ('b0000003-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001'),
  ('b0000002-0000-0000-0000-000000000002', 'b0000003-0000-0000-0000-000000000003'),
  ('b0000003-0000-0000-0000-000000000003', 'b0000002-0000-0000-0000-000000000002'),
  ('b0000004-0000-0000-0000-000000000004', 'b0000005-0000-0000-0000-000000000005'),
  ('b0000005-0000-0000-0000-000000000005', 'b0000004-0000-0000-0000-000000000004'),
  ('b0000004-0000-0000-0000-000000000004', 'b0000006-0000-0000-0000-000000000006'),
  ('b0000006-0000-0000-0000-000000000006', 'b0000004-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;
