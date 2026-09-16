-- =============================================================================
-- R'SPACE — initial schema, RLS policies, and stored procedures
-- Run against a Supabase (or vanilla Postgres 14+) database.
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- =============================================================================
-- TABLES
-- =============================================================================

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  handle         citext not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name   text not null check (char_length(display_name) between 1 and 60),
  avatar_url     text,
  color          text not null default '#111111',
  bio_mood       text not null default '' check (char_length(bio_mood) <= 140),
  is_verified    boolean not null default false,
  sparks_balance bigint not null default 500 check (sparks_balance >= 0),
  forked_from_id uuid references public.profiles (id) on delete set null,
  fork_count     int not null default 0 check (fork_count >= 0),
  theme_vars     jsonb not null default '{"accent":"#FF4F00","bg":"#FDFBF7","text":"#111111"}'::jsonb,
  custom_css     text not null default '' check (char_length(custom_css) <= 20000),
  layout_config  jsonb not null default '{"autoplay":false,"showTop8":true,"wallVisible":true}'::jsonb,
  created_at     timestamptz not null default now()
);

create table public.tracks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 120),
  duration       double precision not null check (duration > 0),
  audio_url      text not null,
  waveform_data  jsonb,
  is_wip         boolean not null default false,
  created_at     timestamptz not null default now()
);
create index tracks_user_id_idx on public.tracks (user_id);

create table public.track_notes (
  id             uuid primary key default gen_random_uuid(),
  track_id       uuid not null references public.tracks (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  parent_id      uuid references public.track_notes (id) on delete cascade,
  timestamp_sec  double precision not null default 0 check (timestamp_sec >= 0),
  content        text not null check (char_length(content) between 1 and 2000),
  created_at     timestamptz not null default now()
);
create index track_notes_track_id_idx on public.track_notes (track_id);
create index track_notes_parent_id_idx on public.track_notes (parent_id);

create table public.top_friends (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  friend_id   uuid not null references public.profiles (id) on delete cascade,
  position    int not null check (position between 1 and 8),
  created_at  timestamptz not null default now(),
  primary key (user_id, position),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);
create index top_friends_friend_id_idx on public.top_friends (friend_id);

create table public.wall_comments (
  id              uuid primary key default gen_random_uuid(),
  target_user_id  uuid not null references public.profiles (id) on delete cascade,
  author_id       uuid not null references public.profiles (id) on delete cascade,
  text            text not null check (char_length(text) between 1 and 1000),
  created_at      timestamptz not null default now()
);
create index wall_comments_target_idx on public.wall_comments (target_user_id, created_at desc);

create table public.feed_events (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type in ('music_drop', 'post', 'fork', 'badge_mint')),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index feed_events_created_at_idx on public.feed_events (created_at desc);
create index feed_events_actor_id_idx on public.feed_events (actor_id);

create table public.merch_items (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references public.profiles (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  price_sparks int not null check (price_sparks > 0),
  variants     text[] not null default '{}',
  stock        int not null default 0 check (stock >= 0),
  image_color  text not null default '#111111',
  created_at   timestamptz not null default now()
);
create index merch_items_artist_id_idx on public.merch_items (artist_id);

create table public.merch_orders (
  id            uuid primary key default gen_random_uuid(),
  merch_id      uuid not null references public.merch_items (id) on delete restrict,
  buyer_id      uuid not null references public.profiles (id) on delete cascade,
  variant       text not null,
  price_sparks  int not null check (price_sparks > 0),
  created_at    timestamptz not null default now()
);
create index merch_orders_buyer_id_idx on public.merch_orders (buyer_id);

create table public.sparks_ledger (
  id          uuid primary key default gen_random_uuid(),
  from_id     uuid references public.profiles (id) on delete set null,
  to_id       uuid references public.profiles (id) on delete set null,
  amount      int not null check (amount > 0),
  category    text not null check (category in ('tip', 'merch', 'badge', 'faucet', 'support')),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index sparks_ledger_from_id_idx on public.sparks_ledger (from_id);
create index sparks_ledger_to_id_idx on public.sparks_ledger (to_id);

create table public.badges (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  price_sparks  int not null check (price_sparks > 0),
  icon          text not null
);

create table public.profile_badges (
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  badge_id     uuid not null references public.badges (id) on delete cascade,
  acquired_at  timestamptz not null default now(),
  primary key (profile_id, badge_id)
);

create table public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  followee_id  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_id_idx on public.follows (followee_id);

create table public.supports (
  id                uuid primary key default gen_random_uuid(),
  supporter_id      uuid not null references public.profiles (id) on delete cascade,
  artist_id         uuid not null references public.profiles (id) on delete cascade,
  monthly_amount    int not null default 50 check (monthly_amount > 0),
  active            boolean not null default true,
  last_charged_at   timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  unique (supporter_id, artist_id),
  check (supporter_id <> artist_id)
);
create index supports_artist_id_idx on public.supports (artist_id);

create table public.gigs (
  id                uuid primary key default gen_random_uuid(),
  artist_id         uuid not null references public.profiles (id) on delete cascade,
  gig_date          date not null,
  venue             text not null,
  city              text not null,
  price_cents       int not null check (price_cents >= 0),
  status            text not null default 'on_sale' check (status in ('on_sale', 'sold_out')),
  direct_split_pct  int not null default 92 check (direct_split_pct between 0 and 100),
  ticket_url        text,
  created_at        timestamptz not null default now()
);
create index gigs_artist_id_idx on public.gigs (artist_id);

-- =============================================================================
-- SEED CATALOG DATA (platform-owned reference rows, not user content)
-- =============================================================================

insert into public.badges (name, price_sparks, icon) values
  ('OG Badge', 100, 'Sparkles'),
  ('Supporter Badge', 60, 'Heart'),
  ('Verified Producer', 400, 'BadgeCheck');

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.profiles       enable row level security;
alter table public.tracks         enable row level security;
alter table public.track_notes    enable row level security;
alter table public.top_friends    enable row level security;
alter table public.wall_comments  enable row level security;
alter table public.feed_events    enable row level security;
alter table public.merch_items    enable row level security;
alter table public.merch_orders   enable row level security;
alter table public.sparks_ledger  enable row level security;
alter table public.badges         enable row level security;
alter table public.profile_badges enable row level security;
alter table public.follows        enable row level security;
alter table public.supports       enable row level security;
alter table public.gigs           enable row level security;

-- profiles: readable by anyone (public spaces), row-updatable only by owner.
-- Column grants below further restrict which fields a client can touch even
-- on its own row — sparks_balance / fork_count / forked_from_id / is_verified
-- can only ever move through the SECURITY DEFINER functions further down.
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_self" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (handle, display_name, avatar_url, color, bio_mood, theme_vars, custom_css, layout_config)
  on public.profiles to authenticated;

create policy "tracks_select_all" on public.tracks for select using (true);
create policy "tracks_insert_own" on public.tracks for insert with check (auth.uid() = user_id);
create policy "tracks_update_own" on public.tracks for update using (auth.uid() = user_id);
create policy "tracks_delete_own" on public.tracks for delete using (auth.uid() = user_id);

create policy "track_notes_select_all" on public.track_notes for select using (true);
create policy "track_notes_insert_own" on public.track_notes for insert with check (auth.uid() = user_id);
create policy "track_notes_delete_own" on public.track_notes for delete using (auth.uid() = user_id);

create policy "top_friends_select_all" on public.top_friends for select using (true);
create policy "top_friends_insert_own" on public.top_friends for insert with check (auth.uid() = user_id);
create policy "top_friends_update_own" on public.top_friends for update using (auth.uid() = user_id);
create policy "top_friends_delete_own" on public.top_friends for delete using (auth.uid() = user_id);

create policy "wall_comments_select_all" on public.wall_comments for select using (true);
create policy "wall_comments_insert_own" on public.wall_comments for insert with check (auth.uid() = author_id);
create policy "wall_comments_delete_own_or_target" on public.wall_comments for delete
  using (auth.uid() = author_id or auth.uid() = target_user_id);

create policy "feed_events_select_all" on public.feed_events for select using (true);
-- clients may only author plain 'post' events; music_drop/fork/badge_mint are
-- inserted exclusively by SECURITY DEFINER triggers/functions below.
create policy "feed_events_insert_post_only" on public.feed_events for insert
  with check (auth.uid() = actor_id and type = 'post');

create policy "merch_items_select_all" on public.merch_items for select using (true);
create policy "merch_items_write_own" on public.merch_items for all
  using (auth.uid() = artist_id) with check (auth.uid() = artist_id);

create policy "merch_orders_select_participant" on public.merch_orders for select
  using (
    auth.uid() = buyer_id
    or auth.uid() = (select artist_id from public.merch_items where id = merch_id)
  );
-- no insert/update/delete policy: rows are only ever created by purchase_merch()

create policy "sparks_ledger_select_participant" on public.sparks_ledger for select
  using (auth.uid() = from_id or auth.uid() = to_id);
-- no insert policy: rows are only ever created by the RPCs below

create policy "badges_select_all" on public.badges for select using (true);
-- no client writes: badges are a platform-managed catalog

create policy "profile_badges_select_all" on public.profile_badges for select using (true);
-- no insert policy: rows are only ever created by purchase_badge()

create policy "follows_select_all" on public.follows for select using (true);
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = follower_id);

create policy "supports_select_participant" on public.supports for select
  using (auth.uid() = supporter_id or auth.uid() = artist_id);
-- no insert/update policy: rows are only ever created/toggled by toggle_support()

create policy "gigs_select_all" on public.gigs for select using (true);
create policy "gigs_write_own" on public.gigs for all
  using (auth.uid() = artist_id) with check (auth.uid() = artist_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-provision a profile row the moment someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12),
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New Space')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-publish a music_drop feed event whenever a finished (non-WIP) track lands.
create or replace function public.handle_track_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_wip = false then
    insert into public.feed_events (actor_id, type, metadata)
    values (new.user_id, 'music_drop', jsonb_build_object('track_id', new.id, 'title', new.title));
  end if;
  return new;
end;
$$;

drop trigger if exists on_track_created on public.tracks;
create trigger on_track_created
  after insert on public.tracks
  for each row execute function public.handle_track_insert();

-- Atomically transfer Sparks from the caller to another profile as a tip.
create or replace function public.tip_artist(recipient_id uuid, amount int)
returns public.sparks_ledger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender uuid := auth.uid();
  sender_balance bigint;
  ledger_row public.sparks_ledger;
begin
  if sender is null then
    raise exception 'not_authenticated';
  end if;
  if recipient_id = sender then
    raise exception 'cannot_tip_self';
  end if;
  if amount is null or amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select sparks_balance into sender_balance from public.profiles where id = sender for update;
  if sender_balance < amount then
    raise exception 'insufficient_sparks';
  end if;

  update public.profiles set sparks_balance = sparks_balance - amount where id = sender;
  update public.profiles set sparks_balance = sparks_balance + amount where id = recipient_id;

  insert into public.sparks_ledger (from_id, to_id, amount, category)
  values (sender, recipient_id, amount, 'tip')
  returning * into ledger_row;

  return ledger_row;
end;
$$;

-- Atomically purchase a merch item: locks stock, deducts Sparks, credits the artist.
create or replace function public.purchase_merch(p_merch_id uuid, p_variant text)
returns public.merch_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  buyer uuid := auth.uid();
  item record;
  buyer_balance bigint;
  order_row public.merch_orders;
begin
  if buyer is null then
    raise exception 'not_authenticated';
  end if;

  select * into item from public.merch_items where id = p_merch_id for update;
  if not found then
    raise exception 'merch_not_found';
  end if;
  if item.artist_id = buyer then
    raise exception 'cannot_buy_own_merch';
  end if;
  if not (p_variant = any(item.variants)) then
    raise exception 'invalid_variant';
  end if;
  if item.stock <= 0 then
    raise exception 'out_of_stock';
  end if;

  select sparks_balance into buyer_balance from public.profiles where id = buyer for update;
  if buyer_balance < item.price_sparks then
    raise exception 'insufficient_sparks';
  end if;

  update public.merch_items set stock = stock - 1 where id = p_merch_id;
  update public.profiles set sparks_balance = sparks_balance - item.price_sparks where id = buyer;
  update public.profiles set sparks_balance = sparks_balance + item.price_sparks where id = item.artist_id;

  insert into public.sparks_ledger (from_id, to_id, amount, category, metadata)
  values (buyer, item.artist_id, item.price_sparks, 'merch',
          jsonb_build_object('merch_id', p_merch_id, 'variant', p_variant));

  insert into public.merch_orders (merch_id, buyer_id, variant, price_sparks)
  values (p_merch_id, buyer, p_variant, item.price_sparks)
  returning * into order_row;

  return order_row;
end;
$$;

-- Atomically purchase (mint) a cosmetic badge. Sparks are burned to the platform sink.
create or replace function public.purchase_badge(p_badge_id uuid)
returns public.profile_badges
language plpgsql
security definer
set search_path = public
as $$
declare
  buyer uuid := auth.uid();
  badge record;
  buyer_balance bigint;
  row_out public.profile_badges;
begin
  if buyer is null then
    raise exception 'not_authenticated';
  end if;

  select * into badge from public.badges where id = p_badge_id;
  if not found then
    raise exception 'badge_not_found';
  end if;

  if exists (select 1 from public.profile_badges where profile_id = buyer and badge_id = p_badge_id) then
    raise exception 'badge_already_owned';
  end if;

  select sparks_balance into buyer_balance from public.profiles where id = buyer for update;
  if buyer_balance < badge.price_sparks then
    raise exception 'insufficient_sparks';
  end if;

  update public.profiles set sparks_balance = sparks_balance - badge.price_sparks where id = buyer;

  insert into public.sparks_ledger (from_id, to_id, amount, category, metadata)
  values (buyer, null, badge.price_sparks, 'badge', jsonb_build_object('badge_id', p_badge_id, 'name', badge.name));

  insert into public.profile_badges (profile_id, badge_id) values (buyer, p_badge_id)
  returning * into row_out;

  insert into public.feed_events (actor_id, type, metadata)
  values (buyer, 'badge_mint', jsonb_build_object('badge_id', p_badge_id, 'name', badge.name));

  return row_out;
end;
$$;

-- Copy another Space's theme/CSS/layout into the caller's own draft, and
-- record lineage + fork_count on the source profile.
create or replace function public.fork_space(p_target_profile_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  target record;
  result public.profiles;
begin
  if caller is null then
    raise exception 'not_authenticated';
  end if;
  if p_target_profile_id = caller then
    raise exception 'cannot_fork_self';
  end if;

  select theme_vars, custom_css, layout_config into target
  from public.profiles where id = p_target_profile_id;
  if not found then
    raise exception 'profile_not_found';
  end if;

  update public.profiles
  set theme_vars = target.theme_vars,
      custom_css = target.custom_css,
      layout_config = target.layout_config,
      forked_from_id = p_target_profile_id
  where id = caller
  returning * into result;

  update public.profiles set fork_count = fork_count + 1 where id = p_target_profile_id;

  insert into public.feed_events (actor_id, type, metadata)
  values (caller, 'fork', jsonb_build_object('forked_from_id', p_target_profile_id));

  return result;
end;
$$;

-- Toggle (create/resume/pause) a monthly support pledge. Resuming charges
-- the first month immediately; pausing does not refund.
create or replace function public.toggle_support(p_artist_id uuid, p_monthly_amount int default 50)
returns public.supports
language plpgsql
security definer
set search_path = public
as $$
declare
  supporter uuid := auth.uid();
  existing public.supports;
  existing_found boolean;
  supporter_balance bigint;
  result public.supports;
begin
  if supporter is null then
    raise exception 'not_authenticated';
  end if;
  if p_artist_id = supporter then
    raise exception 'cannot_support_self';
  end if;

  select * into existing from public.supports
  where supporter_id = supporter and artist_id = p_artist_id for update;
  -- Captured immediately: FOUND gets overwritten by the next SELECT below,
  -- so re-reading it later would silently corrupt this branch.
  existing_found := found;

  if existing_found and existing.active then
    update public.supports set active = false where id = existing.id returning * into result;
    return result;
  end if;

  select sparks_balance into supporter_balance from public.profiles where id = supporter for update;
  if supporter_balance < p_monthly_amount then
    raise exception 'insufficient_sparks';
  end if;

  update public.profiles set sparks_balance = sparks_balance - p_monthly_amount where id = supporter;
  update public.profiles set sparks_balance = sparks_balance + p_monthly_amount where id = p_artist_id;
  insert into public.sparks_ledger (from_id, to_id, amount, category)
  values (supporter, p_artist_id, p_monthly_amount, 'support');

  if existing_found then
    update public.supports
    set active = true, monthly_amount = p_monthly_amount, last_charged_at = now()
    where id = existing.id
    returning * into result;
  else
    insert into public.supports (supporter_id, artist_id, monthly_amount, active, last_charged_at)
    values (supporter, p_artist_id, p_monthly_amount, true, now())
    returning * into result;
  end if;

  return result;
end;
$$;

-- Replace the caller's entire Top 8 ordering atomically from a client-supplied
-- ordered array of friend profile ids (as produced by a dnd-kit reorder drop).
create or replace function public.reorder_top_friends(p_friend_ids uuid[])
returns setof public.top_friends
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'not_authenticated';
  end if;
  if array_length(p_friend_ids, 1) > 8 then
    raise exception 'too_many_friends';
  end if;

  delete from public.top_friends where user_id = caller;

  insert into public.top_friends (user_id, friend_id, position)
  select caller, friend_id, ord
  from unnest(p_friend_ids) with ordinality as t (friend_id, ord);

  return query select * from public.top_friends where user_id = caller order by position;
end;
$$;

-- Meant to be invoked on a schedule (e.g. pg_cron: select cron.schedule(
-- 'charge-monthly-supports', '0 3 * * *', 'select public.charge_monthly_supports();'))
-- Requires the pg_cron extension, enabled separately by a project owner.
create or replace function public.charge_monthly_supports()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  balance bigint;
begin
  for s in
    select * from public.supports
    where active and last_charged_at < now() - interval '30 days'
    for update
  loop
    select sparks_balance into balance from public.profiles where id = s.supporter_id for update;
    if balance >= s.monthly_amount then
      update public.profiles set sparks_balance = sparks_balance - s.monthly_amount where id = s.supporter_id;
      update public.profiles set sparks_balance = sparks_balance + s.monthly_amount where id = s.artist_id;
      insert into public.sparks_ledger (from_id, to_id, amount, category)
      values (s.supporter_id, s.artist_id, s.monthly_amount, 'support');
      update public.supports set last_charged_at = now() where id = s.id;
    else
      update public.supports set active = false where id = s.id;
    end if;
  end loop;
end;
$$;

-- =============================================================================
-- REALTIME
-- =============================================================================

alter publication supabase_realtime add table
  public.wall_comments,
  public.feed_events,
  public.profiles,
  public.top_friends,
  public.merch_items,
  public.track_notes;
