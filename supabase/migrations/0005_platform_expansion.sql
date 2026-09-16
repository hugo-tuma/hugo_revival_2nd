-- =============================================================================
-- R'SPACE — Library, Notifications, DMs, Groups, Marketplace tags
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Library: user playlists + liked songs
-- -----------------------------------------------------------------------------

create table public.playlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  created_at  timestamptz not null default now()
);
create index playlists_user_id_idx on public.playlists (user_id);

create table public.playlist_tracks (
  playlist_id  uuid not null references public.playlists (id) on delete cascade,
  track_id     uuid not null references public.tracks (id) on delete cascade,
  position     int not null default 0,
  added_at     timestamptz not null default now(),
  primary key (playlist_id, track_id)
);

create table public.track_likes (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  track_id    uuid not null references public.tracks (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, track_id)
);

alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.track_likes enable row level security;

create policy "playlists_select_all" on public.playlists for select using (true);
create policy "playlists_owner_write" on public.playlists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "playlist_tracks_select_all" on public.playlist_tracks for select using (true);
create policy "playlist_tracks_owner_write" on public.playlist_tracks for all
  using (auth.uid() = (select user_id from public.playlists where id = playlist_id))
  with check (auth.uid() = (select user_id from public.playlists where id = playlist_id));

create policy "track_likes_select_all" on public.track_likes for select using (true);
create policy "track_likes_owner_write" on public.track_likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Notifications (the "Sparks" nav page)
-- -----------------------------------------------------------------------------

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  actor_id      uuid references public.profiles (id) on delete set null,
  type          text not null check (type in ('follow', 'tip', 'support', 'comment', 'merch_purchase')),
  metadata      jsonb not null default '{}'::jsonb,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select
  using (auth.uid() = recipient_id);
create policy "notifications_update_own" on public.notifications for update
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
-- no insert policy: rows are only ever created by the triggers/functions below

create or replace function public.handle_follow_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, metadata)
  values (new.followee_id, new.follower_id, 'follow', '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists on_follow_created on public.follows;
create trigger on_follow_created
  after insert on public.follows
  for each row execute function public.handle_follow_insert();

create or replace function public.handle_wall_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.author_id <> new.target_user_id then
    insert into public.notifications (recipient_id, actor_id, type, metadata)
    values (new.target_user_id, new.author_id, 'comment', jsonb_build_object('text', new.text));
  end if;
  return new;
end;
$$;

drop trigger if exists on_wall_comment_created on public.wall_comments;
create trigger on_wall_comment_created
  after insert on public.wall_comments
  for each row execute function public.handle_wall_comment_insert();

-- tip_artist / purchase_merch / toggle_support: re-declared from 0001 with a
-- notification insert added to each. Bodies are otherwise unchanged.

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

  insert into public.notifications (recipient_id, actor_id, type, metadata)
  values (recipient_id, sender, 'tip', jsonb_build_object('amount', amount));

  return ledger_row;
end;
$$;

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

  insert into public.notifications (recipient_id, actor_id, type, metadata)
  values (item.artist_id, buyer, 'merch_purchase', jsonb_build_object('merch_id', p_merch_id, 'name', item.name));

  return order_row;
end;
$$;

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

  insert into public.notifications (recipient_id, actor_id, type, metadata)
  values (p_artist_id, supporter, 'support', jsonb_build_object('monthly_amount', p_monthly_amount));

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Direct messages
-- -----------------------------------------------------------------------------

create table public.conversations (
  id           uuid primary key default gen_random_uuid(),
  user_a_id    uuid not null references public.profiles (id) on delete cascade,
  user_b_id    uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint conversations_distinct_users check (user_a_id <> user_b_id)
);
create unique index conversations_unique_pair_idx
  on public.conversations (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id));

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  content          text not null check (char_length(content) between 1 and 2000),
  created_at       timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations_select_participant" on public.conversations for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "conversations_insert_participant" on public.conversations for insert
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "messages_select_participant" on public.messages for select
  using (
    auth.uid() = (select user_a_id from public.conversations where id = conversation_id)
    or auth.uid() = (select user_b_id from public.conversations where id = conversation_id)
  );
create policy "messages_insert_participant" on public.messages for insert
  with check (
    auth.uid() = sender_id
    and (
      auth.uid() = (select user_a_id from public.conversations where id = conversation_id)
      or auth.uid() = (select user_b_id from public.conversations where id = conversation_id)
    )
  );

-- Looks up (or lazily creates) the single conversation between the caller and
-- another user, keyed by a canonical (least, greatest) ordering of the pair
-- so both directions always resolve to the same row.
create or replace function public.get_or_create_conversation(p_other_user_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  result public.conversations;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;
  if p_other_user_id = me then
    raise exception 'cannot_message_self';
  end if;

  a := least(me, p_other_user_id);
  b := greatest(me, p_other_user_id);

  select * into result from public.conversations where user_a_id = a and user_b_id = b;
  if not found then
    insert into public.conversations (user_a_id, user_b_id) values (a, b) returning * into result;
  end if;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Groups (user-created communities)
-- -----------------------------------------------------------------------------

create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 60),
  description  text not null default '' check (char_length(description) <= 280),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table public.group_members (
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.group_posts (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 500),
  created_at  timestamptz not null default now()
);
create index group_posts_group_idx on public.group_posts (group_id, created_at);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_posts enable row level security;

create policy "groups_select_all" on public.groups for select using (true);
create policy "groups_insert_own" on public.groups for insert with check (auth.uid() = owner_id);
create policy "groups_update_own" on public.groups for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "groups_delete_own" on public.groups for delete using (auth.uid() = owner_id);

create policy "group_members_select_all" on public.group_members for select using (true);
create policy "group_members_join_self" on public.group_members for insert with check (auth.uid() = user_id);
create policy "group_members_leave_self" on public.group_members for delete using (auth.uid() = user_id);

create policy "group_posts_select_all" on public.group_posts for select using (true);
create policy "group_posts_insert_member" on public.group_posts for insert
  with check (
    auth.uid() = author_id
    and exists (select 1 from public.group_members where group_id = group_posts.group_id and user_id = auth.uid())
  );

-- Auto-join the creator as the first member of their own group.
create or replace function public.handle_group_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id) values (new.id, new.owner_id);
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_group_insert();

-- -----------------------------------------------------------------------------
-- Marketplace tags: badge type + merch album
-- -----------------------------------------------------------------------------

alter table public.badges add column type text not null default 'Collectible';
update public.badges set type = 'Membership' where name = 'Supporter Badge';
update public.badges set type = 'Verification' where name = 'Verified Producer';
update public.badges set type = 'Collectible' where name = 'OG Badge';

alter table public.merch_items add column album text;
