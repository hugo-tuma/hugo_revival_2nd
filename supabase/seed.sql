-- =============================================================================
-- R'SPACE — realistic community seed data
--
-- Populates: profiles, tracks, track_likes, playlists/playlist_tracks, gigs,
-- groups/group_members/group_posts, merch_items, sparks_ledger, follows,
-- wall_comments, notifications.
--
-- Idempotent: every profile/track/gig/group id is DERIVED deterministically
-- from its handle/slug (see pg_temp.seed_uuid below), every insert uses
-- ON CONFLICT DO NOTHING/DO UPDATE, and setseed() pins the "random" jitter
-- so re-running this script does not create duplicates or drift.
--
-- ASSUMES: supabase/migrations/0001 through 0005 have already been applied
-- to this database (profiles.role, groups, playlists, track_likes,
-- notifications, etc. all come from those files).
--
-- Paste this whole file into the Supabase SQL Editor and run it once. Safe
-- to re-run any time you want to top up sparks_ledger with a fresh 60-day
-- window (see the final NOTICE for what changes on a re-run).
-- =============================================================================

begin;

select setseed(0.4173);

create or replace function pg_temp.seed_uuid(seed text) returns uuid
language sql immutable as $$
  select (
    substr(md5('rspace-seed:' || seed), 1, 8) || '-' ||
    substr(md5('rspace-seed:' || seed), 9, 4) || '-' ||
    substr(md5('rspace-seed:' || seed), 13, 4) || '-' ||
    substr(md5('rspace-seed:' || seed), 17, 4) || '-' ||
    substr(md5('rspace-seed:' || seed), 21, 12)
  )::uuid
$$;

-- =============================================================================
-- 1. PROFILES — 18 personas (12 artists/labels/collectives, 6 listeners)
-- =============================================================================
-- auth.users rows are inserted first (profiles.id is a hard FK to it); the
-- existing on_auth_user_created trigger will also fire and create a stub
-- profiles row. That stub insert and this script's own profiles upsert are
-- kept as two SEPARATE top-level statements (via a temp table) rather than
-- chained in one WITH: Postgres data-modifying CTEs share one snapshot with
-- the statement's primary query, so a trigger side-effect that writes to the
-- same table a later part of the *same* statement also writes to can raise a
-- spurious duplicate-key error even under ON CONFLICT. Splitting into two
-- statements (each gets a fresh snapshot that sees the prior statement's
-- work) avoids that entirely.
--
-- These are non-authenticatable demo accounts (random bcrypt hash,
-- @seed.rspace.fm emails) — they exist only to own relational data, never to
-- log in.

create temporary table tmp_persona (
  handle text, display_name text, role text, color text, bio_mood text, avatar_seed text
) on commit drop;

insert into tmp_persona (handle, display_name, role, color, bio_mood, avatar_seed) values
  ('mira_voltage',     'Mira Voltage',          'artist',   '#111111', 'modular patches recorded straight to tape, no overdubs',        'mira-voltage'),
  ('kreis_null',       'Kreis Null',            'artist',   '#FF4F00', 'Berlin basement techno, 909s and detuned Junos',                'kreis-null'),
  ('deep_wobble',      'Deep Wobble',           'artist',   '#111111', 'Detroit-adjacent dub techno, still mixed down to DAT',          'deep-wobble'),
  ('fieldnotes_ln',    'Fieldnotes LN',         'artist',   '#111111', 'contact mics and hydrophones, London canal recordings',         'fieldnotes-ln'),
  ('cassette_orbit',   'Cassette Orbit',        'artist',   '#FF4F00', 'DIY tape label, hand-dubbed runs of 90, no digital masters',    'cassette-orbit'),
  ('null_signal',      'Null Signal',           'artist',   '#111111', 'noise/ambient duo, Buchla and a chorus of broken tape decks',   'null-signal'),
  ('glass_hallway',    'Glass Hallway',         'artist',   '#111111', 'shoegaze-adjacent bedroom pop, every take is the first take',   'glass-hallway'),
  ('rust_belt_radio',  'Rust Belt Radio',       'artist',   '#FF4F00', 'post-industrial Midwest, field recordings from shut foundries', 'rust-belt-radio'),
  ('subaquatic_dub',   'Subaquatic Dub',        'artist',   '#111111', 'Bristol sound-system lineage, built for the low end',           'subaquatic-dub'),
  ('patch_bay_prague', 'Patch Bay Prague',      'artist',   '#111111', 'Eurorack live sets out of a Prague warehouse residency',        'patch-bay-prague'),
  ('mtl_musique',      'MTL Musique Concrete',  'artist',   '#FF4F00', 'tape-splicing collective working out of Mile-Ex',               'mtl-musique'),
  ('east_coast_diy',   'East Coast DIY Tour',   'artist',   '#111111', 'booking basement shows from Richmond up to Providence',         'east-coast-diy'),
  ('juno_static',      'Juno Static',           'listener', '#111111', 'collects lathe cuts, writes a zine nobody asked for',           'juno-static'),
  ('reel_to_real',     'Reel To Real',          'listener', '#FF4F00', 'archivist, digitizing community radio tapes before they rot',   'reel-to-real'),
  ('low_end_theorem',  'Low End Theorem',       'listener', '#111111', 'sub-bass enthusiast, front row at every sound-system night',    'low-end-theorem'),
  ('patina_press',     'Patina Press',          'listener', '#111111', 'risograph zine about the venues that keep almost closing',      'patina-press'),
  ('static_and_din',   'Static & Din',          'listener', '#FF4F00', 'noise-show promoter, basement circuit regular',                 'static-and-din'),
  ('gain_stage',       'Gain Stage',            'listener', '#111111', 'mixes tapes for the label, bad at small talk, great at gain',   'gain-stage');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  pg_temp.seed_uuid(handle),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  handle || '@seed.rspace.fm',
  crypt('rspace-seed-not-a-real-account', gen_salt('bf')),
  now(),
  '{"provider":"seed","providers":["seed"]}'::jsonb,
  jsonb_build_object('display_name', display_name, 'role', role),
  now() - (random() * interval '400 days'),
  now(),
  '', '', '', ''
from tmp_persona
on conflict (id) do nothing;

insert into public.profiles (id, handle, display_name, avatar_url, color, bio_mood, role, sparks_balance, created_at)
select
  pg_temp.seed_uuid(p.handle),
  p.handle,
  p.display_name,
  'https://api.dicebear.com/7.x/identicon/svg?seed=' || p.avatar_seed || '&backgroundColor=f4f4f5&backgroundType=solid',
  p.color,
  p.bio_mood,
  p.role,
  (300 + floor(random() * 2200))::bigint,
  now() - (random() * interval '380 days')
from tmp_persona p
on conflict (id) do update set
  handle       = excluded.handle,
  display_name = excluded.display_name,
  avatar_url   = excluded.avatar_url,
  color        = excluded.color,
  bio_mood     = excluded.bio_mood,
  role         = excluded.role;

-- =============================================================================
-- 2. TRACKS — 24 releases across the 11 producing artists
-- =============================================================================
-- audio_url is a placeholder (no real files are hosted) — the NOT NULL
-- constraint requires a value, but nothing plays back until real audio is
-- uploaded through the app's own upload flow.

with track_seed(artist_handle, slug, title, duration, is_wip) as (
  values
    ('mira_voltage',     'patch-memory-no-3',        'Patch Memory No. 3',            238, false),
    ('mira_voltage',     'filter-sweep-at-dawn',     'Filter Sweep at Dawn',           311, false),
    ('mira_voltage',     'unpatched-sketch-11',      'Unpatched Sketch 11',            196, true),
    ('kreis_null',       'kellerklub',               'Kellerklub',                     347, false),
    ('kreis_null',       'detuned-junos',            'Detuned Junos',                  289, false),
    ('deep_wobble',      'sub-basement-transmission','Sub Basement Transmission',      402, false),
    ('deep_wobble',      'dat-loop-04',              'DAT Loop 04',                    264, false),
    ('fieldnotes_ln',    'regents-canal-4am',        'Regent''s Canal, 4AM',           355, false),
    ('fieldnotes_ln',    'hydrophone-study-i',       'Hydrophone Study I',             298, false),
    ('cassette_orbit',   'ninety-minute-fade',       'Ninety Minute Fade',             221, false),
    ('cassette_orbit',   'dubbed-twice-over',        'Dubbed Twice Over',              274, false),
    ('cassette_orbit',   'label-comp-side-b',        'Label Comp, Side B',             318, false),
    ('null_signal',      'broken-deck-chorale',      'Broken Deck Chorale',            412, false),
    ('null_signal',      'buchla-sketch-7',          'Buchla Sketch 7',                203, false),
    ('glass_hallway',    'first-take-only-take',     'First Take, Only Take',          214, false),
    ('glass_hallway',    'bedroom-reverb',           'Bedroom Reverb',                 258, false),
    ('rust_belt_radio',  'foundry-hum',              'Foundry Hum',                    389, false),
    ('rust_belt_radio',  'shift-change',             'Shift Change',                   301, false),
    ('subaquatic_dub',   'low-end-only',             'Low End Only',                   334, false),
    ('subaquatic_dub',   'sound-system-test-press',  'Sound System Test Press',        292, false),
    ('patch_bay_prague', 'warehouse-residency-vol-2','Warehouse Residency Vol. 2',     420, false),
    ('patch_bay_prague', 'eurorack-live-cut',        'Eurorack Live Cut',              365, true),
    ('mtl_musique',      'splice-number-nine',       'Splice Number Nine',             246, false),
    ('mtl_musique',      'mile-ex-tape-loop',        'Mile-Ex Tape Loop',              281, false)
)
insert into public.tracks (id, user_id, title, duration, audio_url, is_wip, created_at)
select
  pg_temp.seed_uuid('track:' || slug),
  pg_temp.seed_uuid(artist_handle),
  title,
  duration::double precision,
  'https://cdn.rspace.fm/seed-audio/' || slug || '.mp3',
  is_wip,
  now() - (random() * interval '90 days')
from track_seed
on conflict (id) do nothing;

-- =============================================================================
-- 3. TRACK LIKES — populates the "Liked Songs" count in Library
-- =============================================================================

insert into public.track_likes (user_id, track_id, created_at)
select liker.id, t.id, now() - (random() * interval '45 days')
from (
  select pg_temp.seed_uuid(handle) as id
  from (values
    ('juno_static'), ('reel_to_real'), ('low_end_theorem'),
    ('patina_press'), ('static_and_din'), ('gain_stage'),
    ('mira_voltage'), ('kreis_null'), ('cassette_orbit')
  ) as listeners(handle)
) liker
cross join lateral (
  select id from public.tracks order by random() limit (3 + floor(random() * 5)::int)
) t
on conflict do nothing;

-- =============================================================================
-- 4. PLAYLISTS — a handful of Library playlists with tracks
-- =============================================================================

with playlist_seed(owner_handle, slug, name) as (
  values
    ('juno_static',     'late-shift-rotation',  'Late Shift Rotation'),
    ('reel_to_real',    'basement-tape-rips',   'Basement Tape Rips'),
    ('patch_bay_prague','warehouse-warmup',     'Warehouse Warmup'),
    ('low_end_theorem', 'sub-bass-only',        'Sub Bass Only'),
    ('static_and_din',  'noise-night-shortlist','Noise Night Shortlist')
),
ins_playlists as (
  insert into public.playlists (id, user_id, name, created_at)
  select
    pg_temp.seed_uuid('playlist:' || slug),
    pg_temp.seed_uuid(owner_handle),
    name,
    now() - (random() * interval '60 days')
  from playlist_seed
  on conflict (id) do nothing
  returning id
)
insert into public.playlist_tracks (playlist_id, track_id, position, added_at)
select
  pg_temp.seed_uuid('playlist:' || ps.slug),
  t.id,
  row_number() over (partition by ps.slug order by random()),
  now() - (random() * interval '55 days')
from playlist_seed ps
cross join lateral (
  select id from public.tracks order by random() limit (4 + floor(random() * 4)::int)
) t
on conflict do nothing;

-- =============================================================================
-- 5. GIGS — 10 shows, split across the last 10 days and the next 45
-- =============================================================================

with gig_seed(artist_handle, gig_date_offset, venue, city, price_cents, status, split_pct) as (
  values
    ('kreis_null',       -6,  'Hallenbad',              'Berlin, DE',     1200, 'on_sale',  92),
    ('subaquatic_dub',   -3,  'Dub Chamber',             'Bristol, UK',    1000, 'sold_out', 92),
    ('fieldnotes_ln',     2,  'The Marrow',              'London, UK',      800, 'on_sale',  95),
    ('patch_bay_prague',  5,  'Sklep 12',                'Prague, CZ',      900, 'on_sale',  92),
    ('mtl_musique',       9,  'Salle Mile-Ex',           'Montreal, CA',   1100, 'on_sale',  92),
    ('deep_wobble',      14,  'Tape Deck Social Club',   'Detroit, US',    1500, 'sold_out', 88),
    ('null_signal',      18,  'Foxhole Social',          'London, UK',      700, 'on_sale',  95),
    ('east_coast_diy',   22,  'Basement 47',             'Providence, US',  600, 'on_sale',  95),
    ('rust_belt_radio',  29,  'The Foundry Floor',       'Detroit, US',    1300, 'on_sale',  92),
    ('cassette_orbit',   37,  'Kesselhaus Nord',         'Berlin, DE',     1000, 'on_sale',  92)
)
insert into public.gigs (id, artist_id, gig_date, venue, city, price_cents, status, direct_split_pct, created_at)
select
  pg_temp.seed_uuid('gig:' || artist_handle || ':' || gig_date_offset),
  pg_temp.seed_uuid(artist_handle),
  (current_date + (gig_date_offset || ' days')::interval)::date,
  venue,
  city,
  price_cents,
  status,
  split_pct,
  now() - (random() * interval '20 days')
from gig_seed
on conflict (id) do nothing;

-- =============================================================================
-- 6. GROUPS — 7 community hubs + members + a couple of posts each
-- =============================================================================

-- As with profiles/auth.users above: creating a group fires
-- on_group_created, which auto-joins the owner into group_members. That
-- table is populated further below with additional members, so the groups
-- insert and the group_members insert must be separate top-level statements
-- (via a temp table) rather than chained in one WITH, or a random sample
-- that happens to re-select the owner can raise a spurious duplicate-key
-- error under the same CTE/trigger snapshot quirk described above.

create temporary table tmp_group (
  slug text, owner_handle text, name text, description text
) on commit drop;

insert into tmp_group (slug, owner_handle, name, description) values
  ('field-recording',     'fieldnotes_ln',    'Field Recording & Found Sound',
   'Contact mics, hydrophones, tape hiss as texture. Share rigs, swap unedited source, argue about noise floors.'),
  ('cassette-culture',    'cassette_orbit',   'Cassette Culture',
   'Dubbing decks, shell repair, J-card layout tips, and a running list of who still presses to tape.'),
  ('max-msp-puredata',    'patch_bay_prague', 'Max/MSP & PureData',
   'Patch sharing for live visuals and generative audio. Bring your broken patch, leave with a working one.'),
  ('east-coast-tour',     'east_coast_diy',   'East Coast DIY Tour Circuit',
   'Booking basement shows Richmond to Providence. Post your route, find a floor to sleep on.'),
  ('modular-meetup',      'mira_voltage',     'Modular Meetup',
   'Local Eurorack meetups, patch-of-the-month, and a strict no-gear-shaming policy.'),
  ('sound-system-build',  'subaquatic_dub',   'Dub Sound System Builders',
   'Bin design, amp racks, and how to not blow a horn driver at your first outdoor session.'),
  ('tape-loop-collective','null_signal',      'Tape Loop Collective',
   'Splicing techniques, reel-to-reel maintenance, and a shared drive of loop source material.');

insert into public.groups (id, name, description, owner_id, created_at)
select
  pg_temp.seed_uuid('group:' || slug),
  name,
  description,
  pg_temp.seed_uuid(owner_handle),
  now() - (random() * interval '150 days')
from tmp_group
on conflict (id) do nothing;

with member_pool as (
  select pg_temp.seed_uuid(handle) as id from (values
    ('mira_voltage'), ('kreis_null'), ('deep_wobble'), ('fieldnotes_ln'),
    ('cassette_orbit'), ('null_signal'), ('glass_hallway'), ('rust_belt_radio'),
    ('subaquatic_dub'), ('patch_bay_prague'), ('mtl_musique'), ('east_coast_diy'),
    ('juno_static'), ('reel_to_real'), ('low_end_theorem'), ('patina_press'),
    ('static_and_din'), ('gain_stage')
  ) as h(handle)
)
insert into public.group_members (group_id, user_id, joined_at)
select
  pg_temp.seed_uuid('group:' || gs.slug),
  mp.id,
  now() - (random() * interval '120 days')
from tmp_group gs
cross join lateral (
  select id from member_pool order by random() limit (5 + floor(random() * 6)::int)
) mp
on conflict do nothing;

with group_post_seed(group_slug, author_handle, content, days_ago) as (
  values
    ('field-recording',    'fieldnotes_ln',    'Finally got a working hydrophone rig for under $40 — writeup coming once I stop losing cables in the canal.', 4),
    ('field-recording',    'rust_belt_radio',  'Recorded three hours inside the old foundry before they seal the building. Sending the raw files to anyone who wants to chop them up.', 11),
    ('cassette-culture',   'cassette_orbit',   'Restocked shells in clear, smoke, and the ugly orange nobody asked for. Dubbing starts Thursday.', 2),
    ('cassette-culture',   'gain_stage',       'PSA: if your deck is eating tape, check the pinch roller before you blame the cassette.', 9),
    ('max-msp-puredata',   'patch_bay_prague', 'Uploaded the warehouse show patch — feedback welcome, the video chain is still held together with tape.', 6),
    ('east-coast-tour',    'east_coast_diy',   'Got three more basements confirmed for the spring run. DM if your act needs a Tuesday show in Providence.', 1),
    ('modular-meetup',     'mira_voltage',     'Bringing the spare Buchla clone to Sunday''s meetup if anyone wants to actually touch one before buying.', 3),
    ('sound-system-build', 'subaquatic_dub',   'Blew a horn driver at the last outdoor session — full post-mortem on what went wrong with the crossover.', 7),
    ('tape-loop-collective','null_signal',     'Shared drive updated with 40 minutes of new loop source, mostly detuned tape hiss and one broken music box.', 5)
)
insert into public.group_posts (id, group_id, author_id, content, created_at)
select
  pg_temp.seed_uuid('grouppost:' || group_slug || ':' || author_handle || ':' || days_ago),
  pg_temp.seed_uuid('group:' || group_slug),
  pg_temp.seed_uuid(author_handle),
  content,
  now() - (days_ago || ' days')::interval
from group_post_seed
on conflict (id) do nothing;

-- =============================================================================
-- 7. MERCH ITEMS — supports the "Merch sales" ledger category below
-- =============================================================================

with merch_seed(artist_handle, slug, name, price_sparks, variants, stock, image_color) as (
  values
    ('cassette_orbit',   'label-comp-tape',    'Label Comp — Cassette',        60,  array['Clear','Smoke'],        40, '#111111'),
    ('kreis_null',       'kellerklub-shirt',   'Kellerklub Longsleeve',        140, array['S','M','L','XL'],       25, '#111111'),
    ('deep_wobble',      'dat-loop-tape',      'DAT Loop 04 — Cassette',       55,  array['Standard'],             30, '#FF4F00'),
    ('fieldnotes_ln',    'canal-study-zine',   'Canal Study — Risograph Zine', 35,  array['Standard'],             50, '#111111'),
    ('subaquatic_dub',   'sound-system-pin',   'Sound System Enamel Pin',      20,  array['Standard'],             80, '#FF4F00'),
    ('rust_belt_radio',  'foundry-hum-shirt',  'Foundry Hum Shirt',            130, array['S','M','L','XL'],       20, '#111111'),
    ('mtl_musique',      'splice-tote',        'Splice Number Nine Tote',      45,  array['Standard'],             35, '#111111')
)
insert into public.merch_items (id, artist_id, name, price_sparks, variants, stock, image_color, created_at)
select
  pg_temp.seed_uuid('merch:' || slug),
  pg_temp.seed_uuid(artist_handle),
  name,
  price_sparks,
  variants,
  stock,
  image_color,
  now() - (random() * interval '100 days')
from merch_seed
on conflict (id) do nothing;

-- =============================================================================
-- 8. FOLLOWS — feeds ArtistHeader "N friends follow" + auto-notifies
-- =============================================================================

insert into public.follows (follower_id, followee_id, created_at)
select follower.id, artist.id, now() - (random() * interval '200 days')
from (
  select pg_temp.seed_uuid(handle) as id from (values
    ('juno_static'), ('reel_to_real'), ('low_end_theorem'),
    ('patina_press'), ('static_and_din'), ('gain_stage')
  ) as h(handle)
) follower
cross join lateral (
  select pg_temp.seed_uuid(handle) as id from (values
    ('mira_voltage'), ('kreis_null'), ('deep_wobble'), ('fieldnotes_ln'),
    ('cassette_orbit'), ('null_signal'), ('glass_hallway'), ('rust_belt_radio'),
    ('subaquatic_dub'), ('patch_bay_prague'), ('mtl_musique')
  ) as h(handle)
  order by random()
  limit (3 + floor(random() * 4)::int)
) artist
on conflict do nothing;

-- =============================================================================
-- 9. WALL COMMENTS — activity on profiles, auto-notifies recipients
-- =============================================================================

with comment_seed(target_handle, author_handle, text, days_ago) as (
  values
    ('mira_voltage',    'juno_static',     'that unpatched sketch has been on loop since Tuesday, please finish it', 2),
    ('kreis_null',      'static_and_din',  'kellerklub set was the loudest room I''ve stood in all year', 5),
    ('cassette_orbit',  'reel_to_real',    'the smoke shells are gorgeous, wish you''d warned me before I bought six', 1),
    ('fieldnotes_ln',   'patina_press',    'writing about the canal recordings for the next zine, hope that''s ok', 8),
    ('subaquatic_dub',  'low_end_theorem', 'my subwoofer has never recovered and I mean that as a compliment', 3),
    ('patch_bay_prague','mira_voltage',    'trade you a Buchla patch for that warehouse recording chain', 6),
    ('null_signal',     'gain_stage',      'mixed down your loop material at 2am, sorry to whoever lives below me', 4),
    ('east_coast_diy',  'rust_belt_radio', 'count us in for the spring run, Detroit needs more basement shows', 10),
    ('glass_hallway',   'static_and_din',  'first take only take really shows, in the best way', 7),
    ('mtl_musique',     'juno_static',     'the tape loop material is going straight into my next lathe cut', 12)
)
insert into public.wall_comments (id, target_user_id, author_id, text, created_at)
select
  pg_temp.seed_uuid('comment:' || target_handle || ':' || author_handle || ':' || days_ago),
  pg_temp.seed_uuid(target_handle),
  pg_temp.seed_uuid(author_handle),
  text,
  now() - (days_ago || ' days')::interval
from comment_seed
on conflict (id) do nothing;

-- =============================================================================
-- 10. SPARKS LEDGER — 52 transactions over the last 60 days
-- =============================================================================
-- category is constrained to ('tip','merch','badge','faucet','support') by
-- the schema — these map onto the Payouts breakdown as:
--   'tip'     -> Tips
--   'support' -> Monthly support
--   'merch'   -> Merch sales

with artist_pool as (
  select pg_temp.seed_uuid(handle) as id from (values
    ('mira_voltage'), ('kreis_null'), ('deep_wobble'), ('fieldnotes_ln'),
    ('cassette_orbit'), ('null_signal'), ('glass_hallway'), ('rust_belt_radio'),
    ('subaquatic_dub'), ('patch_bay_prague'), ('mtl_musique')
  ) as h(handle)
),
supporter_pool as (
  select pg_temp.seed_uuid(handle) as id from (values
    ('juno_static'), ('reel_to_real'), ('low_end_theorem'),
    ('patina_press'), ('static_and_din'), ('gain_stage')
  ) as h(handle)
),
tips as (
  select
    (select id from supporter_pool order by random() limit 1) as from_id,
    (select id from artist_pool order by random() limit 1) as to_id,
    (5 + floor(random() * 46))::int as amount,
    'tip'::text as category,
    '{}'::jsonb as metadata,
    now() - (random() * interval '60 days') as created_at
  from generate_series(1, 28)
),
support as (
  select
    (select id from supporter_pool order by random() limit 1) as from_id,
    (select id from artist_pool order by random() limit 1) as to_id,
    (array[25, 50, 100])[1 + floor(random() * 3)::int] as amount,
    'support'::text as category,
    '{}'::jsonb as metadata,
    now() - (random() * interval '60 days') as created_at
  from generate_series(1, 14)
),
merch_sales as (
  select
    (select id from supporter_pool order by random() limit 1) as from_id,
    m.artist_id as to_id,
    m.price_sparks as amount,
    'merch'::text as category,
    jsonb_build_object('merch_id', m.id, 'variant', m.variants[1]) as metadata,
    now() - (random() * interval '60 days') as created_at
  from public.merch_items m
  order by random()
  limit 10
),
all_txns as (
  select * from tips
  union all
  select * from support
  union all
  select * from merch_sales
)
insert into public.sparks_ledger (id, from_id, to_id, amount, category, metadata, created_at)
select
  pg_temp.seed_uuid('ledger:' || from_id || ':' || to_id || ':' || category || ':' || row_number() over ()),
  from_id, to_id, amount, category, metadata, created_at
from all_txns
on conflict (id) do nothing;

-- Keep profiles.sparks_balance consistent with the ledger we just wrote
-- (the seed inserts bypass tip_artist/purchase_merch/toggle_support, which
-- normally keep balance and ledger in sync inside one transaction).
with net as (
  select id, coalesce(sum(delta), 0) as delta
  from (
    select from_id as id, -amount as delta from public.sparks_ledger
    union all
    select to_id as id, amount as delta from public.sparks_ledger
  ) x
  where id is not null
  group by id
)
update public.profiles p
set sparks_balance = greatest(0, p.sparks_balance + net.delta)
from net
where net.id = p.id
  and p.handle in (
    'mira_voltage','kreis_null','deep_wobble','fieldnotes_ln','cassette_orbit',
    'null_signal','glass_hallway','rust_belt_radio','subaquatic_dub',
    'patch_bay_prague','mtl_musique','east_coast_diy','juno_static',
    'reel_to_real','low_end_theorem','patina_press','static_and_din','gain_stage'
  );

-- =============================================================================
-- 11. NOTIFICATIONS — top up the Sparks/notifications feed for tip + merch
-- (follow/comment/support notifications already arrived via triggers above)
-- =============================================================================

insert into public.notifications (id, recipient_id, actor_id, type, metadata, read, created_at)
select
  pg_temp.seed_uuid('notif:tip:' || sl.id),
  sl.to_id,
  sl.from_id,
  'tip',
  jsonb_build_object('amount', sl.amount),
  (random() < 0.6),
  sl.created_at
from public.sparks_ledger sl
where sl.category = 'tip'
on conflict (id) do nothing;

insert into public.notifications (id, recipient_id, actor_id, type, metadata, read, created_at)
select
  pg_temp.seed_uuid('notif:merch:' || sl.id),
  sl.to_id,
  sl.from_id,
  'merch_purchase',
  sl.metadata,
  (random() < 0.6),
  sl.created_at
from public.sparks_ledger sl
where sl.category = 'merch'
on conflict (id) do nothing;

commit;

-- =============================================================================
-- Sanity check — run this separately after the script above to see counts.
-- =============================================================================
-- select 'profiles' as table_name, count(*) from public.profiles
--   where handle in (
--     'mira_voltage','kreis_null','deep_wobble','fieldnotes_ln','cassette_orbit',
--     'null_signal','glass_hallway','rust_belt_radio','subaquatic_dub',
--     'patch_bay_prague','mtl_musique','east_coast_diy','juno_static',
--     'reel_to_real','low_end_theorem','patina_press','static_and_din','gain_stage')
-- union all select 'tracks', count(*) from public.tracks
-- union all select 'track_likes', count(*) from public.track_likes
-- union all select 'playlists', count(*) from public.playlists
-- union all select 'gigs', count(*) from public.gigs
-- union all select 'groups', count(*) from public.groups
-- union all select 'group_members', count(*) from public.group_members
-- union all select 'group_posts', count(*) from public.group_posts
-- union all select 'merch_items', count(*) from public.merch_items
-- union all select 'follows', count(*) from public.follows
-- union all select 'wall_comments', count(*) from public.wall_comments
-- union all select 'sparks_ledger', count(*) from public.sparks_ledger
-- union all select 'notifications', count(*) from public.notifications;
