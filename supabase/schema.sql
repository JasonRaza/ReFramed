create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  state text not null check (state in ('LOBBY', 'PREVIEW', 'POSE', 'CAPTURE', 'SCORING', 'RESULTS')),
  current_pose_id text,
  player1_id text,
  player2_id text,
  player1_image_url text,
  player2_image_url text,
  player1_score integer,
  player2_score integer,
  player1_roast text,
  player2_roast text,
  winner text,
  scored boolean not null default false,
  preview_started_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "rooms are readable by players"
  on public.rooms for select using (true);

create policy "rooms can be created by clients"
  on public.rooms for insert with check (true);

create policy "rooms can be updated by clients"
  on public.rooms for update using (true) with check (true);

-- Run these two statements in the Supabase SQL editor after applying this schema:
--
-- 1. Enable realtime on the rooms table:
--    alter publication supabase_realtime add table public.rooms;
--
-- 2. Create the public storage bucket for player images:
--    insert into storage.buckets (id, name, public)
--    values ('player-images', 'player-images', true)
--    on conflict do nothing;
--
-- 3. Allow public reads + authenticated writes on the bucket:
--    create policy "images are public" on storage.objects for select using (bucket_id = 'player-images');
--    create policy "anyone can upload images" on storage.objects for insert with check (bucket_id = 'player-images');
