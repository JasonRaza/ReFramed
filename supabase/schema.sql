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
  winner text,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "rooms are readable by players"
  on public.rooms
  for select
  using (true);

create policy "rooms can be created by clients"
  on public.rooms
  for insert
  with check (true);

create policy "rooms can be updated by clients"
  on public.rooms
  for update
  using (true)
  with check (true);
