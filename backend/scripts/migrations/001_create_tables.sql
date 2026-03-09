-- ===========================================
-- DayVault V0 — Initial Schema
-- ===========================================

-- ── events ──────────────────────────────────────────────────────────────────
create table if not exists events (
  id          uuid        primary key default gen_random_uuid(),
  month       int         not null check (month between 1 and 12),
  day         int         not null check (day between 1 and 31),
  year        int,
  title       text        not null,
  description text,
  category    text,
  image_url   text,
  source_url  text,
  created_at  timestamptz not null default now()
);

create index if not exists events_month_day_idx on events (month, day);

-- ── user_preferences ────────────────────────────────────────────────────────
create table if not exists user_preferences (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  tags       jsonb       not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ── user_interactions ───────────────────────────────────────────────────────
create table if not exists user_interactions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  event_id   uuid        not null references events on delete cascade,
  action     text        not null check (action in ('like', 'dislike')),
  created_at timestamptz not null default now()
);

create index if not exists user_interactions_user_idx on user_interactions (user_id);

-- ── daily_feeds ─────────────────────────────────────────────────────────────
create table if not exists daily_feeds (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  feed_date  date        not null,
  feed_data  jsonb       not null default '[]',
  created_at timestamptz not null default now(),
  unique (user_id, feed_date)
);

-- ===========================================
-- Row Level Security
-- ===========================================

alter table events             enable row level security;
alter table user_preferences   enable row level security;
alter table user_interactions  enable row level security;
alter table daily_feeds        enable row level security;

-- events: anyone can read (public historical data)
create policy "events_public_read" on events
  for select using (true);

-- user_preferences: users can only read/write their own row
create policy "prefs_own" on user_preferences
  for all using (auth.uid() = user_id);

-- user_interactions: users can only read/write their own rows
create policy "interactions_own" on user_interactions
  for all using (auth.uid() = user_id);

-- daily_feeds: users can only read/write their own rows
create policy "feeds_own" on daily_feeds
  for all using (auth.uid() = user_id);
