-- =============================================================================
-- R'SPACE — realistic community seed data (expanded / high-volume pass)
--
-- Populates every user-generated-content table in the schema: profiles,
-- tracks, track_notes (WIP pinned notes + replies), track_likes, playlists/
-- playlist_tracks, top_friends, gigs, groups/group_members/group_posts,
-- merch_items/merch_orders, sparks_ledger, supports, follows, wall_comments,
-- conversations/messages, feed_events (post/fork/badge_mint), profile_badges,
-- and notifications.
--
-- Idempotent: every id is DERIVED deterministically from a stable text key
-- (see pg_temp.seed_uuid below — same handle/slug always yields the same
-- UUID), every insert uses ON CONFLICT DO NOTHING/DO UPDATE, and setseed()
-- pins the "random" jitter. Re-running this script updates existing rows in
-- place and adds nothing extra for any seed key it already wrote.
--
-- ASSUMES: supabase/migrations/0001 through 0005 have already been applied
-- to this database.
--
-- Paste this whole file into the Supabase SQL Editor and run it once.
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
-- 1. PROFILES — 48 personas (20 artists/labels/collectives, 28 listeners)
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
-- log in. created_at is spread across the last ~10 months so the community
-- reads as one that grew over time, not one that all signed up on day one.

create temporary table tmp_persona (
  handle text, display_name text, role text, color text, bio_mood text, avatar_seed text, joined_days_ago int
) on commit drop;

insert into tmp_persona (handle, display_name, role, color, bio_mood, avatar_seed, joined_days_ago) values
  -- founding-era artists / labels / collectives
  ('mira_voltage',     'Mira Voltage',          'artist',   '#111111', 'modular patches recorded straight to tape, no overdubs',        'mira-voltage',     312),
  ('kreis_null',       'Kreis Null',            'artist',   '#FF4F00', 'Berlin basement techno, 909s and detuned Junos',                'kreis-null',       298),
  ('deep_wobble',      'Deep Wobble',           'artist',   '#111111', 'Detroit-adjacent dub techno, still mixed down to DAT',          'deep-wobble',      287),
  ('fieldnotes_ln',    'Fieldnotes LN',         'artist',   '#111111', 'contact mics and hydrophones, London canal recordings',         'fieldnotes-ln',    276),
  ('cassette_orbit',   'Cassette Orbit',        'artist',   '#FF4F00', 'DIY tape label, hand-dubbed runs of 90, no digital masters',    'cassette-orbit',   341),
  ('null_signal',      'Null Signal',           'artist',   '#111111', 'noise/ambient duo, Buchla and a chorus of broken tape decks',   'null-signal',      264),
  ('glass_hallway',    'Glass Hallway',         'artist',   '#111111', 'shoegaze-adjacent bedroom pop, every take is the first take',   'glass-hallway',    203),
  ('rust_belt_radio',  'Rust Belt Radio',       'artist',   '#FF4F00', 'post-industrial Midwest, field recordings from shut foundries', 'rust-belt-radio',  231),
  ('subaquatic_dub',   'Subaquatic Dub',        'artist',   '#111111', 'Bristol sound-system lineage, built for the low end',           'subaquatic-dub',   256),
  ('patch_bay_prague', 'Patch Bay Prague',      'artist',   '#111111', 'Eurorack live sets out of a Prague warehouse residency',        'patch-bay-prague', 219),
  ('mtl_musique',      'MTL Musique Concrete',  'artist',   '#FF4F00', 'tape-splicing collective working out of Mile-Ex',               'mtl-musique',      188),
  ('east_coast_diy',   'East Coast DIY Tour',   'artist',   '#111111', 'booking basement shows from Richmond up to Providence',         'east-coast-diy',   167),
  -- newer artists, joined more recently
  ('ravenna_tapes',    'Ravenna Tapes',         'artist',   '#111111', 'dream-pop on a four-track, mixed in one afternoon',             'ravenna-tapes',    94),
  ('mkowalski',        'M. Kowalski',           'artist',   '#FF4F00', 'half-finished ambient loops, fully finished cups of coffee',    'mkowalski',        61),
  ('tuan_vo',          'Tuan Vo',               'artist',   '#111111', 'lo-fi drum machine worship, one pattern at a time',             'tuan-vo',          73),
  ('lena_petrova',     'Lena Petrova',          'artist',   '#111111', 'cold wave vocals over warmer synths than you''d expect',        'lena-petrova',     52),
  ('femi_okoro',       'Femi Okoro',            'artist',   '#FF4F00', 'Afrobeat-adjacent polyrhythms, recorded in a spare room',       'femi-okoro',       44),
  ('billy_tran',       'Billy Tran',            'artist',   '#111111', 'skate-video guitar tones, occasionally on purpose',             'billy-tran',       38),
  ('keiko_amano',      'Keiko Amano',           'artist',   '#111111', 'field recordings from train platforms, mostly at night',        'keiko-amano',      29),
  ('paige_holloway',   'Paige Holloway',        'artist',   '#FF4F00', 'kitchen-sink pop, drums recorded on actual pots',               'paige-holloway',   17),
  -- listeners / scene regulars
  ('juno_static',      'Juno Static',           'listener', '#111111', 'collects lathe cuts, writes a zine nobody asked for',           'juno-static',      304),
  ('reel_to_real',     'Reel To Real',          'listener', '#FF4F00', 'archivist, digitizing community radio tapes before they rot',   'reel-to-real',     289),
  ('low_end_theorem',  'Low End Theorem',       'listener', '#111111', 'sub-bass enthusiast, front row at every sound-system night',    'low-end-theorem',  271),
  ('patina_press',     'Patina Press',          'listener', '#111111', 'risograph zine about the venues that keep almost closing',      'patina-press',     248),
  ('static_and_din',   'Static & Din',          'listener', '#FF4F00', 'noise-show promoter, basement circuit regular',                 'static-and-din',   233),
  ('gain_stage',       'Gain Stage',            'listener', '#111111', 'mixes tapes for the label, bad at small talk, great at gain',   'gain-stage',       197),
  ('corey_marsh',      'Corey Marsh',           'listener', '#111111', 'moved here for the scene, stayed for the group chats',          'corey-marsh',      180),
  ('jbarreto',         'J. Barreto',            'listener', '#FF4F00', 'audio engineer by day, insomniac by night',                     'jbarreto',         172),
  ('tobias_lowry',     'Tobias Lowry',          'listener', '#111111', 'still mad I missed the warehouse show',                         'tobias-lowry',     165),
  ('sam_odell',        'Sam O''Dell',           'listener', '#111111', 'converted three friends to vinyl this year',                    'sam-odell',        158),
  ('priya_nathan',     'Priya Nathan',          'listener', '#FF4F00', 'professional lurker, occasional commenter',                     'priya-nathan',     151),
  ('delgado_r',        'R. Delgado',            'listener', '#111111', 'here for the merch drops if I''m honest',                       'delgado-r',        143),
  ('june_esparza',     'June Esparza',          'listener', '#111111', 'found this place through a friend''s mixtape',                  'june-esparza',     136),
  ('hannah_reyes',     'Hannah Reyes',          'listener', '#FF4F00', 'trying to learn modular, failing gracefully',                   'hannah-reyes',     128),
  ('omar_khalil',      'Omar Khalil',           'listener', '#111111', 'collects setlists more than records at this point',            'omar-khalil',      120),
  ('dwight_moss',      'Dwight Moss',           'listener', '#111111', 'here for the bass, staying for the community',                  'dwight-moss',      112),
  ('cassidy_j',        'Cassidy J.',            'listener', '#FF4F00', 'burned through three tape decks this year alone',               'cassidy-j',        104),
  ('greta_lindqvist',  'Greta Lindqvist',       'listener', '#111111', 'Scandinavian noise pilgrim, allergic to major keys',            'greta-lindqvist',  97),
  ('isaiah_park',      'Isaiah Park',           'listener', '#111111', 'keeps a spreadsheet of every show I''ve been to',               'isaiah-park',      89),
  ('noor_hassan',      'Noor Hassan',           'listener', '#FF4F00', 'here because my sister wouldn''t stop talking about it',        'noor-hassan',      81),
  ('rosa_maldonado',   'Rosa Maldonado',        'listener', '#111111', 'runs the merch table so I don''t have to pay for shows',        'rosa-maldonado',   74),
  ('eli_sandoval',     'Eli Sandoval',          'listener', '#111111', 'chronically early to every show, chronically not sorry',        'eli-sandoval',     66),
  ('marcus_odom',      'Marcus Odom',           'listener', '#FF4F00', 'just moved to the city, still figuring out the scene',          'marcus-odom',      58),
  ('tania_fields',     'Tania Fields',          'listener', '#111111', 'burnt out on major labels, this is the detox',                  'tania-fields',     49),
  ('yusuf_demir',      'Yusuf Demir',           'listener', '#111111', 'here for one band, stayed for forty more',                      'yusuf-demir',      41),
  ('ben_castellano',   'Ben Castellano',        'listener', '#FF4F00', 'still learning what half these genres mean',                    'ben-castellano',   33),
  ('simone_arceo',     'Simone Arceo',          'listener', '#111111', 'tips more than I should, no regrets',                           'simone-arceo',     26),
  ('drew_hachigian',   'Drew Hachigian',        'listener', '#111111', 'lurking since the beta, finally made an account',               'drew-hachigian',   9);

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
  now() - (joined_days_ago || ' days')::interval,
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
  now() - (p.joined_days_ago || ' days')::interval
from tmp_persona p
on conflict (id) do update set
  handle       = excluded.handle,
  display_name = excluded.display_name,
  avatar_url   = excluded.avatar_url,
  color        = excluded.color,
  bio_mood     = excluded.bio_mood,
  role         = excluded.role;

-- =============================================================================
-- 2. TRACKS — 38 releases across the 20 producing artists
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
    ('mtl_musique',      'mile-ex-tape-loop',        'Mile-Ex Tape Loop',              281, false),
    ('ravenna_tapes',    'four-track-sunday',        'Four Track Sunday',              231, false),
    ('ravenna_tapes',    'static-valentine',         'Static Valentine',               204, false),
    ('mkowalski',        'half-finished-loop',       'Half Finished Loop',             267, true),
    ('tuan_vo',          'one-pattern-only',         'One Pattern Only',               198, false),
    ('tuan_vo',          '808-sermon',               '808 Sermon',                     223, false),
    ('lena_petrova',     'warmer-than-expected',     'Warmer Than You''d Expect',      289, false),
    ('lena_petrova',     'cold-wave-apology',        'Cold Wave Apology',              256, false),
    ('femi_okoro',       'spare-room-polyrhythm',    'Spare Room Polyrhythm',          312, false),
    ('billy_tran',       'skate-video-no-skating',   'Skate Video, No Skating',        187, false),
    ('billy_tran',       'on-purpose-this-time',     'On Purpose This Time',           241, false),
    ('keiko_amano',      'platform-4-midnight',      'Platform 4, Midnight',           334, false),
    ('keiko_amano',      'last-train-static',        'Last Train Static',              276, false),
    ('paige_holloway',   'pots-and-pans-bridge',     'Pots and Pans Bridge',           219, false)
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
-- 3. TRACK NOTES — pinned, timestamped fan notes on WIP stems (+ replies)
-- =============================================================================

-- Top-level notes and their replies are two separate statements: track_notes
-- self-references (parent_id -> track_notes.id), and a multi-row INSERT does
-- not guarantee its source rows are inserted in source order without an
-- ORDER BY, so a reply row can be attempted before its parent row exists
-- within the very same statement. Two statements (a fresh snapshot each)
-- avoids relying on unspecified row-processing order entirely.

with note_seed(track_slug, author_handle, timestamp_sec, content, days_ago) as (
  values
    ('unpatched-sketch-11', 'juno_static',     12.5, 'this intro texture is unreal, what osc is that', 6),
    ('unpatched-sketch-11', 'reel_to_real',    47.0, 'the drop could hit harder here imo', 5),
    ('eurorack-live-cut',   'static_and_din',  30.0, 'warehouse crowd noise mixed right into the low end, love it', 8),
    ('eurorack-live-cut',   'low_end_theorem', 95.0, 'this is the part I was screaming about after the show', 7),
    ('half-finished-loop',  'hannah_reyes',     8.0, 'please finish this, it''s already my favorite unfinished thing', 3),
    ('half-finished-loop',  'drew_hachigian',  40.0, 'reminds me of early tim hecker, in the best way', 2)
)
insert into public.track_notes (id, track_id, user_id, parent_id, timestamp_sec, content, created_at)
select
  pg_temp.seed_uuid('note:' || track_slug || ':' || author_handle || ':' || timestamp_sec),
  pg_temp.seed_uuid('track:' || track_slug),
  pg_temp.seed_uuid(author_handle),
  null,
  timestamp_sec,
  content,
  now() - (days_ago || ' days')::interval
from note_seed
on conflict (id) do nothing;

with reply_seed(track_slug, author_handle, parent_track_slug, parent_author_handle, parent_timestamp_sec, timestamp_sec, content, days_ago) as (
  values
    ('unpatched-sketch-11', 'mira_voltage', 'unpatched-sketch-11', 'juno_static',   12.5, 12.5, 'it''s just a detuned saw through the wasp filter, nothing fancy', 5),
    ('half-finished-loop',  'mkowalski',    'half-finished-loop',  'hannah_reyes',   8.0,  8.0, 'working on it between shifts, promise', 2)
)
insert into public.track_notes (id, track_id, user_id, parent_id, timestamp_sec, content, created_at)
select
  pg_temp.seed_uuid('note:' || track_slug || ':' || author_handle || ':' || timestamp_sec),
  pg_temp.seed_uuid('track:' || track_slug),
  pg_temp.seed_uuid(author_handle),
  pg_temp.seed_uuid('note:' || parent_track_slug || ':' || parent_author_handle || ':' || parent_timestamp_sec),
  timestamp_sec,
  content,
  now() - (days_ago || ' days')::interval
from reply_seed
on conflict (id) do nothing;

-- =============================================================================
-- 4. TRACK LIKES — populates the "Liked Songs" count in Library
-- =============================================================================

insert into public.track_likes (user_id, track_id, created_at)
select liker.id, t.id, now() - (random() * interval '75 days')
from (
  select pg_temp.seed_uuid(handle) as id
  from (values
    ('juno_static'), ('reel_to_real'), ('low_end_theorem'), ('patina_press'),
    ('static_and_din'), ('gain_stage'), ('corey_marsh'), ('jbarreto'),
    ('tobias_lowry'), ('sam_odell'), ('priya_nathan'), ('delgado_r'),
    ('june_esparza'), ('hannah_reyes'), ('omar_khalil'), ('dwight_moss'),
    ('cassidy_j'), ('greta_lindqvist'), ('isaiah_park'), ('noor_hassan'),
    ('rosa_maldonado'), ('eli_sandoval'), ('marcus_odom'), ('tania_fields'),
    ('yusuf_demir'), ('ben_castellano'), ('simone_arceo'), ('drew_hachigian'),
    ('mira_voltage'), ('kreis_null'), ('cassette_orbit'), ('ravenna_tapes')
  ) as listeners(handle)
) liker
cross join lateral (
  select id from public.tracks order by random() limit (2 + floor(random() * 6)::int)
) t
on conflict do nothing;

-- =============================================================================
-- 5. PLAYLISTS — Library playlists with tracks
-- =============================================================================

with playlist_seed(owner_handle, slug, name) as (
  values
    ('juno_static',      'late-shift-rotation',   'Late Shift Rotation'),
    ('reel_to_real',     'basement-tape-rips',    'Basement Tape Rips'),
    ('patch_bay_prague', 'warehouse-warmup',      'Warehouse Warmup'),
    ('low_end_theorem',  'sub-bass-only',         'Sub Bass Only'),
    ('static_and_din',   'noise-night-shortlist', 'Noise Night Shortlist'),
    ('marcus_odom',      'new-to-the-scene',      'New To The Scene'),
    ('simone_arceo',     'stuff-i-tipped-for',    'Stuff I Tipped For'),
    ('greta_lindqvist',  'no-major-keys',         'No Major Keys Allowed')
),
ins_playlists as (
  insert into public.playlists (id, user_id, name, created_at)
  select
    pg_temp.seed_uuid('playlist:' || slug),
    pg_temp.seed_uuid(owner_handle),
    name,
    now() - (random() * interval '90 days')
  from playlist_seed
  on conflict (id) do nothing
  returning id
)
insert into public.playlist_tracks (playlist_id, track_id, position, added_at)
select
  pg_temp.seed_uuid('playlist:' || ps.slug),
  t.id,
  row_number() over (partition by ps.slug order by random()),
  now() - (random() * interval '85 days')
from playlist_seed ps
cross join lateral (
  select id from public.tracks order by random() limit (4 + floor(random() * 5)::int)
) t
on conflict do nothing;

-- =============================================================================
-- 6. TOP 8 — a hand-picked friends list for a cross-section of profiles
-- =============================================================================

with top8_seed(owner_handle, friend_handle, position) as (
  values
    ('mira_voltage', 'kreis_null', 1), ('mira_voltage', 'cassette_orbit', 2), ('mira_voltage', 'null_signal', 3),
    ('mira_voltage', 'patch_bay_prague', 4), ('mira_voltage', 'juno_static', 5), ('mira_voltage', 'reel_to_real', 6),
    ('mira_voltage', 'ravenna_tapes', 7), ('mira_voltage', 'lena_petrova', 8),
    ('kreis_null', 'mira_voltage', 1), ('kreis_null', 'subaquatic_dub', 2), ('kreis_null', 'deep_wobble', 3),
    ('kreis_null', 'static_and_din', 4), ('kreis_null', 'gain_stage', 5), ('kreis_null', 'keiko_amano', 6),
    ('cassette_orbit', 'mira_voltage', 1), ('cassette_orbit', 'rust_belt_radio', 2), ('cassette_orbit', 'reel_to_real', 3),
    ('cassette_orbit', 'gain_stage', 4), ('cassette_orbit', 'mtl_musique', 5),
    ('juno_static', 'mira_voltage', 1), ('juno_static', 'mtl_musique', 2), ('juno_static', 'reel_to_real', 3),
    ('juno_static', 'patina_press', 4), ('juno_static', 'tuan_vo', 5), ('juno_static', 'femi_okoro', 6),
    ('reel_to_real', 'cassette_orbit', 1), ('reel_to_real', 'mira_voltage', 2), ('reel_to_real', 'juno_static', 3),
    ('reel_to_real', 'low_end_theorem', 4), ('reel_to_real', 'keiko_amano', 5),
    ('subaquatic_dub', 'kreis_null', 1), ('subaquatic_dub', 'rust_belt_radio', 2), ('subaquatic_dub', 'low_end_theorem', 3),
    ('subaquatic_dub', 'static_and_din', 4),
    ('patch_bay_prague', 'mira_voltage', 1), ('patch_bay_prague', 'mtl_musique', 2), ('patch_bay_prague', 'patina_press', 3),
    ('patch_bay_prague', 'billy_tran', 4),
    ('low_end_theorem', 'subaquatic_dub', 1), ('low_end_theorem', 'deep_wobble', 2), ('low_end_theorem', 'reel_to_real', 3),
    ('low_end_theorem', 'rust_belt_radio', 4), ('low_end_theorem', 'simone_arceo', 5),
    ('east_coast_diy', 'rust_belt_radio', 1), ('east_coast_diy', 'glass_hallway', 2), ('east_coast_diy', 'paige_holloway', 3),
    ('east_coast_diy', 'ben_castellano', 4),
    ('ravenna_tapes', 'mira_voltage', 1), ('ravenna_tapes', 'lena_petrova', 2), ('ravenna_tapes', 'glass_hallway', 3),
    ('ravenna_tapes', 'tania_fields', 4)
)
insert into public.top_friends (user_id, friend_id, position, created_at)
select
  pg_temp.seed_uuid(owner_handle),
  pg_temp.seed_uuid(friend_handle),
  position,
  now() - (random() * interval '60 days')
from top8_seed
on conflict (user_id, position) do nothing;

-- =============================================================================
-- 7. GIGS — 13 shows, split across the last 10 days and the next 45
-- =============================================================================

with gig_seed(artist_handle, gig_date_offset, venue, city, price_cents, status, split_pct) as (
  values
    ('kreis_null',       -6,  'Hallenbad',              'Berlin, DE',      1200, 'on_sale',  92),
    ('subaquatic_dub',   -3,  'Dub Chamber',             'Bristol, UK',     1000, 'sold_out', 92),
    ('fieldnotes_ln',     2,  'The Marrow',              'London, UK',       800, 'on_sale',  95),
    ('patch_bay_prague',  5,  'Sklep 12',                'Prague, CZ',       900, 'on_sale',  92),
    ('mtl_musique',       9,  'Salle Mile-Ex',           'Montreal, CA',    1100, 'on_sale',  92),
    ('deep_wobble',      14,  'Tape Deck Social Club',   'Detroit, US',     1500, 'sold_out', 88),
    ('null_signal',      18,  'Foxhole Social',          'London, UK',       700, 'on_sale',  95),
    ('east_coast_diy',   22,  'Basement 47',             'Providence, US',   600, 'on_sale',  95),
    ('rust_belt_radio',  29,  'The Foundry Floor',       'Detroit, US',     1300, 'on_sale',  92),
    ('cassette_orbit',   37,  'Kesselhaus Nord',         'Berlin, DE',      1000, 'on_sale',  92),
    ('keiko_amano',       7,  'Platform Gallery',        'Tokyo, JP',       1400, 'on_sale',  92),
    ('femi_okoro',        12, 'The Annex',               'Providence, US',   900, 'on_sale',  95),
    ('paige_holloway',    25, 'Kitchen Sink Studios',    'London, UK',       750, 'on_sale',  95)
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
-- 8. GROUPS — 7 community hubs + members + posts
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
  select pg_temp.seed_uuid(handle) as id from tmp_persona
)
insert into public.group_members (group_id, user_id, joined_at)
select
  pg_temp.seed_uuid('group:' || gs.slug),
  mp.id,
  now() - (random() * interval '120 days')
from tmp_group gs
cross join lateral (
  select id from member_pool order by random() limit (8 + floor(random() * 10)::int)
) mp
on conflict do nothing;

with group_post_seed(group_slug, author_handle, content, days_ago) as (
  values
    ('field-recording',    'fieldnotes_ln',    'Finally got a working hydrophone rig for under $40 — writeup coming once I stop losing cables in the canal.', 4),
    ('field-recording',    'rust_belt_radio',  'Recorded three hours inside the old foundry before they seal the building. Sending the raw files to anyone who wants to chop them up.', 11),
    ('field-recording',    'keiko_amano',      'Train platform recordings hit different at 1am, nobody tells you how much rats show up in the mix.', 6),
    ('cassette-culture',   'cassette_orbit',   'Restocked shells in clear, smoke, and the ugly orange nobody asked for. Dubbing starts Thursday.', 2),
    ('cassette-culture',   'gain_stage',       'PSA: if your deck is eating tape, check the pinch roller before you blame the cassette.', 9),
    ('cassette-culture',   'ravenna_tapes',    'First run of Four Track Sunday tapes sold out in a day, doing a second dub run next week.', 3),
    ('max-msp-puredata',   'patch_bay_prague', 'Uploaded the warehouse show patch — feedback welcome, the video chain is still held together with tape.', 6),
    ('east-coast-tour',    'east_coast_diy',   'Got three more basements confirmed for the spring run. DM if your act needs a Tuesday show in Providence.', 1),
    ('east-coast-tour',    'femi_okoro',       'Count me in for the Providence date, been wanting to play The Annex forever.', 5),
    ('modular-meetup',     'mira_voltage',     'Bringing the spare Buchla clone to Sunday''s meetup if anyone wants to actually touch one before buying.', 3),
    ('sound-system-build', 'subaquatic_dub',   'Blew a horn driver at the last outdoor session — full post-mortem on what went wrong with the crossover.', 7),
    ('tape-loop-collective','null_signal',     'Shared drive updated with 40 minutes of new loop source, mostly detuned tape hiss and one broken music box.', 5),
    ('tape-loop-collective','mkowalski',       'Grabbed three loops from the shared drive for the new half-finished thing, crediting everyone in the notes.', 2)
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
-- 9. MERCH ITEMS — supports the "Merch sales" ledger category below
-- =============================================================================

with merch_seed(artist_handle, slug, name, price_sparks, variants, stock, image_color) as (
  values
    ('cassette_orbit',   'label-comp-tape',    'Label Comp — Cassette',         60,  array['Clear','Smoke'],        90, '#111111'),
    ('kreis_null',       'kellerklub-shirt',   'Kellerklub Longsleeve',         140, array['S','M','L','XL'],       60, '#111111'),
    ('deep_wobble',      'dat-loop-tape',      'DAT Loop 04 — Cassette',        55,  array['Standard'],             70, '#FF4F00'),
    ('fieldnotes_ln',    'canal-study-zine',   'Canal Study — Risograph Zine',  35,  array['Standard'],            100, '#111111'),
    ('subaquatic_dub',   'sound-system-pin',   'Sound System Enamel Pin',       20,  array['Standard'],            150, '#FF4F00'),
    ('rust_belt_radio',  'foundry-hum-shirt',  'Foundry Hum Shirt',             130, array['S','M','L','XL'],       50, '#111111'),
    ('mtl_musique',      'splice-tote',        'Splice Number Nine Tote',       45,  array['Standard'],             80, '#111111'),
    ('ravenna_tapes',    'four-track-tape',    'Four Track Sunday — Cassette',  50,  array['Standard'],             60, '#FF4F00'),
    ('lena_petrova',     'cold-wave-shirt',    'Cold Wave Apology Shirt',       125, array['S','M','L','XL'],       45, '#111111'),
    ('keiko_amano',      'platform-4-zine',    'Platform 4 — Photo Zine',       40,  array['Standard'],             55, '#111111')
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
-- 10. FOLLOWS — feeds ArtistHeader "N friends follow" + auto-notifies
-- =============================================================================

insert into public.follows (follower_id, followee_id, created_at)
select follower.id, artist.id, now() - (random() * interval '250 days')
from (
  select pg_temp.seed_uuid(handle) as id from tmp_persona where role = 'listener'
) follower
cross join lateral (
  select pg_temp.seed_uuid(handle) as id from tmp_persona where role = 'artist'
  order by random()
  limit (2 + floor(random() * 5)::int)
) artist
on conflict do nothing;

-- =============================================================================
-- 11. WALL COMMENTS — activity on profiles, auto-notifies recipients
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
    ('mtl_musique',     'juno_static',     'the tape loop material is going straight into my next lathe cut', 12),
    ('ravenna_tapes',   'tania_fields',    'four track sunday got me through the whole detox playlist, thank you', 2),
    ('mkowalski',       'hannah_reyes',    'checking in, is the loop finished yet or are we still waiting', 1),
    ('tuan_vo',         'dwight_moss',     '808 sermon has been the only thing in my headphones this week', 4),
    ('lena_petrova',    'greta_lindqvist', 'finally a cold wave record with actual warmth in it, rare', 6),
    ('femi_okoro',      'marcus_odom',     'new to the scene and this was the first track that made me get it', 9),
    ('billy_tran',      'yusuf_demir',     'on purpose this time is a genuinely good title for that riff', 3),
    ('keiko_amano',     'omar_khalil',     'added platform 4 to my show-adjacent playlist immediately', 5),
    ('paige_holloway',  'ben_castellano',  'the pots and pans thing should not work this well but it does', 2),
    ('juno_static',     'sam_odell',       'your zine got three more people into lathe cuts, mission accomplished', 14),
    ('reel_to_real',    'priya_nathan',    'the basement tape rips playlist is doing numbers in my group chat', 11)
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
-- 12. MONTHLY SUPPORT — active (and a couple paused) supporter relationships
-- =============================================================================

create temporary table tmp_support (
  supporter_handle text, artist_handle text, monthly_amount int, active boolean, last_charged_days_ago int
) on commit drop;

insert into tmp_support (supporter_handle, artist_handle, monthly_amount, active, last_charged_days_ago) values
  ('simone_arceo',    'cassette_orbit',   100, true,  6),
  ('simone_arceo',    'kreis_null',        50, true,  6),
  ('static_and_din',  'kreis_null',        50, true, 14),
  ('reel_to_real',    'cassette_orbit',    25, true, 21),
  ('juno_static',     'mira_voltage',      50, true,  9),
  ('gain_stage',      'null_signal',       25, true, 17),
  ('low_end_theorem', 'subaquatic_dub',   100, true,  4),
  ('patina_press',    'fieldnotes_ln',     25, true, 28),
  ('drew_hachigian',  'mkowalski',         25, true,  3),
  ('hannah_reyes',    'mkowalski',         50, true,  3),
  ('tania_fields',    'ravenna_tapes',     50, true, 11),
  ('marcus_odom',     'femi_okoro',        25, true, 19),
  ('rosa_maldonado',  'paige_holloway',    25, false, 45),
  ('isaiah_park',     'rust_belt_radio',   50, false, 60);

insert into public.supports (id, supporter_id, artist_id, monthly_amount, active, last_charged_at, created_at)
select
  pg_temp.seed_uuid('support:' || supporter_handle || ':' || artist_handle),
  pg_temp.seed_uuid(supporter_handle),
  pg_temp.seed_uuid(artist_handle),
  monthly_amount,
  active,
  now() - (last_charged_days_ago || ' days')::interval,
  now() - ((last_charged_days_ago + 30) || ' days')::interval
from tmp_support
on conflict (supporter_id, artist_id) do nothing;

-- =============================================================================
-- 13. SPARKS LEDGER — ~185 transactions over the last 60 days
-- =============================================================================
-- category is constrained to ('tip','merch','badge','faucet','support') by
-- the schema — these map onto the Payouts breakdown as:
--   'tip'     -> Tips
--   'support' -> Monthly support
--   'merch'   -> Merch sales

with artist_pool as (
  select pg_temp.seed_uuid(handle) as id from tmp_persona where role = 'artist'
),
supporter_pool as (
  select pg_temp.seed_uuid(handle) as id from tmp_persona
),
tips as (
  select
    (select id from supporter_pool order by random() limit 1) as from_id,
    (select id from artist_pool order by random() limit 1) as to_id,
    (5 + floor(random() * 76))::int as amount,
    'tip'::text as category,
    '{}'::jsonb as metadata,
    now() - (random() * interval '60 days') as created_at
  from generate_series(1, 120)
),
support_charges as (
  -- 1-2 historical charges per active/paused support relationship, matching
  -- its own monthly_amount, so the ledger and the supports table agree.
  select
    pg_temp.seed_uuid(ts.supporter_handle) as from_id,
    pg_temp.seed_uuid(ts.artist_handle) as to_id,
    ts.monthly_amount as amount,
    'support'::text as category,
    '{}'::jsonb as metadata,
    now() - (random() * interval '55 days' + interval '5 days') as created_at
  from tmp_support ts
  union all
  select
    pg_temp.seed_uuid(ts.supporter_handle),
    pg_temp.seed_uuid(ts.artist_handle),
    ts.monthly_amount,
    'support'::text,
    '{}'::jsonb,
    now() - (random() * interval '25 days')
  from tmp_support ts
  where ts.active
),
merch_sales as (
  select
    (select id from supporter_pool order by random() limit 1) as from_id,
    m.artist_id as to_id,
    m.price_sparks as amount,
    'merch'::text as category,
    jsonb_build_object('merch_id', m.id, 'variant', m.variants[1 + floor(random() * array_length(m.variants, 1))::int]) as metadata,
    now() - (random() * interval '60 days') as created_at
  from public.merch_items m, generate_series(1, 3)
),
all_txns as (
  select * from tips
  union all
  select * from support_charges
  union all
  select * from merch_sales
),
numbered as (
  select row_number() over () as n, * from all_txns
)
insert into public.sparks_ledger (id, from_id, to_id, amount, category, metadata, created_at)
select
  pg_temp.seed_uuid('ledger:v2:' || n),
  from_id, to_id, amount, category, metadata, created_at
from numbered
on conflict (id) do nothing;

-- Keep merch_items.stock consistent with the merch orders derived below.
with sold as (
  select (metadata ->> 'merch_id')::uuid as merch_id, count(*) as qty
  from public.sparks_ledger
  where category = 'merch'
  group by 1
)
update public.merch_items mi
set stock = greatest(0, mi.stock - sold.qty)
from sold
where sold.merch_id = mi.id;

-- Keep profiles.sparks_balance consistent with the full ledger (the seed
-- inserts bypass tip_artist/purchase_merch/toggle_support, which normally
-- keep balance and ledger in sync inside one transaction).
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
set sparks_balance = greatest(0, 500 + net.delta)
from net
where net.id = p.id
  and p.id in (select pg_temp.seed_uuid(handle) from tmp_persona);

-- =============================================================================
-- 14. MERCH ORDERS — one order per merch-category ledger row
-- =============================================================================

insert into public.merch_orders (id, merch_id, buyer_id, variant, price_sparks, created_at)
select
  pg_temp.seed_uuid('order:' || sl.id),
  (sl.metadata ->> 'merch_id')::uuid,
  sl.from_id,
  sl.metadata ->> 'variant',
  sl.amount,
  sl.created_at
from public.sparks_ledger sl
where sl.category = 'merch'
on conflict (id) do nothing;

-- =============================================================================
-- 15. PROFILE BADGES — a handful of minted badges + verified artists
-- =============================================================================

with badge_seed(profile_handle, badge_name, days_ago) as (
  values
    ('mira_voltage',   'OG Badge', 280),
    ('cassette_orbit', 'OG Badge', 310),
    ('juno_static',    'OG Badge', 270),
    ('simone_arceo',   'Supporter Badge', 20),
    ('reel_to_real',   'Supporter Badge', 60),
    ('static_and_din', 'Supporter Badge', 45),
    ('kreis_null',     'Verified Producer', 150),
    ('subaquatic_dub', 'Verified Producer', 130),
    ('cassette_orbit', 'Verified Producer', 200)
)
insert into public.profile_badges (profile_id, badge_id, acquired_at)
select
  pg_temp.seed_uuid(bs.profile_handle),
  b.id,
  now() - (bs.days_ago || ' days')::interval
from badge_seed bs
join public.badges b on b.name = bs.badge_name
on conflict (profile_id, badge_id) do nothing;

update public.profiles
set is_verified = true
where handle in ('kreis_null', 'subaquatic_dub', 'cassette_orbit');

-- =============================================================================
-- 16. FEED EVENTS — extra "post"/"fork"/"badge_mint" activity
-- (music_drop events already arrived automatically via the tracks trigger)
-- =============================================================================

with post_seed(actor_handle, text, days_ago) as (
  values
    ('kreis_null',      'kellerklub was sold out four hours in, thank you to everyone who showed up early', 1),
    ('cassette_orbit',  'restocking the smoke shells this week, sorry for the wait', 2),
    ('juno_static',     'finished the zine issue, print run is small so grab one while they last', 3),
    ('mira_voltage',    'unpatched sketch 11 is very close to done, thanks for the patience', 1),
    ('subaquatic_dub',  'bristol show tonight, doors at 9, bring earplugs seriously', 4),
    ('static_and_din',  'booking noise acts for a spring showcase, DM if you want in', 6),
    ('reel_to_real',    'digitized another box of community radio tapes, 40 more hours of archive up', 7),
    ('rust_belt_radio', 'foundry hum has been streamed more than I expected, thank you all', 5),
    ('patch_bay_prague','warehouse residency vol 2 patch notes are up in the max/msp group', 2),
    ('null_signal',     'buchla sketch 7 almost fried a module, worth it though', 8),
    ('ravenna_tapes',   'second tape run of four track sunday is dubbing now', 3),
    ('lena_petrova',    'cold wave apology got its first radio play last night, surreal', 4),
    ('femi_okoro',      'spare room polyrhythm was recorded in one take at 2am, no regrets', 6),
    ('billy_tran',      'skate video no skating actually has a skate video now, link in bio', 9),
    ('keiko_amano',     'platform 4 midnight was recorded during a 40 minute train delay, silver linings', 5),
    ('paige_holloway',  'pots and pans bridge is exactly what it sounds like, no shame', 7),
    ('east_coast_diy',  'spring tour route is locked, six cities, all basements, all ages', 10),
    ('mtl_musique',     'mile-ex tape loop sold out at the last meetup, doing a repress', 12),
    ('glass_hallway',   'first take only take is the whole philosophy at this point', 14),
    ('mkowalski',       'half finished loop remains half finished, send coffee', 1)
)
insert into public.feed_events (id, actor_id, type, metadata, created_at)
select
  pg_temp.seed_uuid('feedpost:' || actor_handle || ':' || days_ago),
  pg_temp.seed_uuid(actor_handle),
  'post',
  jsonb_build_object('text', text),
  now() - (days_ago || ' days')::interval
from post_seed
on conflict (id) do nothing;

with fork_seed(forker_handle, source_handle, days_ago) as (
  values
    ('tania_fields',    'cassette_orbit', 40),
    ('ben_castellano',  'mira_voltage',   25),
    ('yusuf_demir',     'kreis_null',     15)
)
insert into public.feed_events (id, actor_id, type, metadata, created_at)
select
  pg_temp.seed_uuid('feedfork:' || forker_handle),
  pg_temp.seed_uuid(forker_handle),
  'fork',
  jsonb_build_object('forked_from_id', pg_temp.seed_uuid(source_handle)),
  now() - (days_ago || ' days')::interval
from fork_seed
on conflict (id) do nothing;

with fork_seed(forker_handle, source_handle, days_ago) as (
  values
    ('tania_fields',    'cassette_orbit', 40),
    ('ben_castellano',  'mira_voltage',   25),
    ('yusuf_demir',     'kreis_null',     15)
)
update public.profiles p
set forked_from_id = pg_temp.seed_uuid(fs.source_handle)
from fork_seed fs
where p.id = pg_temp.seed_uuid(fs.forker_handle)
  and p.forked_from_id is distinct from pg_temp.seed_uuid(fs.source_handle);

update public.profiles p
set fork_count = sub.n
from (
  select pg_temp.seed_uuid(source_handle) as id, count(*) as n
  from (values ('cassette_orbit'), ('mira_voltage'), ('kreis_null')) as s(source_handle)
  group by source_handle
) sub
where p.id = sub.id;

with badge_feed_seed(profile_handle, badge_name, days_ago) as (
  values
    ('mira_voltage',   'OG Badge', 280),
    ('cassette_orbit', 'OG Badge', 310),
    ('juno_static',    'OG Badge', 270),
    ('simone_arceo',   'Supporter Badge', 20),
    ('reel_to_real',   'Supporter Badge', 60),
    ('static_and_din', 'Supporter Badge', 45),
    ('kreis_null',     'Verified Producer', 150),
    ('subaquatic_dub', 'Verified Producer', 130),
    ('cassette_orbit', 'Verified Producer', 200)
)
insert into public.feed_events (id, actor_id, type, metadata, created_at)
select
  pg_temp.seed_uuid('feedbadge:' || bfs.profile_handle || ':' || bfs.badge_name),
  pg_temp.seed_uuid(bfs.profile_handle),
  'badge_mint',
  jsonb_build_object('name', bfs.badge_name),
  now() - (bfs.days_ago || ' days')::interval
from badge_feed_seed bfs
on conflict (id) do nothing;

-- =============================================================================
-- 17. DIRECT MESSAGES — a handful of conversations with a short back-and-forth
-- =============================================================================

create temporary table tmp_conversation (
  slug text, user_a_handle text, user_b_handle text
) on commit drop;

insert into tmp_conversation (slug, user_a_handle, user_b_handle) values
  ('juno-mira',    'juno_static',    'mira_voltage'),
  ('static-kreis',  'static_and_din', 'kreis_null'),
  ('reel-cassette', 'reel_to_real',   'cassette_orbit'),
  ('patina-field',  'patina_press',   'fieldnotes_ln'),
  ('lowend-sub',    'low_end_theorem','subaquatic_dub'),
  ('hannah-mkow',   'hannah_reyes',   'mkowalski'),
  ('drew-keiko',    'drew_hachigian', 'keiko_amano'),
  ('rosa-paige',    'rosa_maldonado', 'paige_holloway');

insert into public.conversations (id, user_a_id, user_b_id, created_at)
select
  pg_temp.seed_uuid('conversation:' || slug),
  pg_temp.seed_uuid(user_a_handle),
  pg_temp.seed_uuid(user_b_handle),
  now() - interval '20 days'
from tmp_conversation
on conflict (id) do nothing;

with message_seed(slug, sender_handle, content, minutes_after_start) as (
  values
    ('juno-mira',    'juno_static',     'the unpatched sketch on your page has been stuck in my head all week', 0),
    ('juno-mira',    'mira_voltage',    'that''s the nicest thing I''ve heard all month, almost done with it', 6),
    ('juno-mira',    'juno_static',     'no rush, take the time, it''s worth it', 9),
    ('static-kreis', 'static_and_din',  'any interest in a noise/techno crossover night, thinking march', 0),
    ('static-kreis', 'kreis_null',      'depends on the room, does it have a proper low end', 14),
    ('static-kreis', 'static_and_din',  'hallenbad-sized, so yes', 20),
    ('static-kreis', 'kreis_null',      'then I''m in', 25),
    ('reel-cassette','reel_to_real',    'do you have any of the first cassette orbit run left, for the archive', 0),
    ('reel-cassette','cassette_orbit',  'one copy, I''ll set it aside for you', 45),
    ('reel-cassette','reel_to_real',    'you''re the best, sending sparks now', 50),
    ('patina-field', 'patina_press',    'would you be up for a short interview about the canal recordings', 0),
    ('patina-field', 'fieldnotes_ln',   'sure, though most of the good stories involve almost falling in', 30),
    ('patina-field', 'patina_press',    'even better, keep those in', 33),
    ('lowend-sub',   'low_end_theorem', 'what bins are you running for the outdoor sessions', 0),
    ('lowend-sub',   'subaquatic_dub',  'homemade, still tuning the crossover honestly', 40),
    ('lowend-sub',   'low_end_theorem', 'respect either way, felt it in my chest from the back', 44),
    ('hannah-mkow',  'hannah_reyes',    'checking in on the loop, no pressure, just excited', 0),
    ('hannah-mkow',  'mkowalski',       'closer than last week I promise', 120),
    ('drew-keiko',   'drew_hachigian',  'platform 4 midnight might be my favorite thing on here right now', 0),
    ('drew-keiko',   'keiko_amano',     'that means a lot, that one almost didn''t make the cut', 180),
    ('rosa-paige',   'rosa_maldonado',  'want me to run the merch table at the kitchen sink show', 0),
    ('rosa-paige',   'paige_holloway',  'yes please, you''re a lifesaver', 15),
    ('rosa-paige',   'rosa_maldonado',  'always, see you there', 20)
)
insert into public.messages (id, conversation_id, sender_id, content, created_at)
select
  pg_temp.seed_uuid('message:' || ms.slug || ':' || ms.minutes_after_start || ':' || ms.sender_handle),
  pg_temp.seed_uuid('conversation:' || ms.slug),
  pg_temp.seed_uuid(ms.sender_handle),
  ms.content,
  now() - interval '20 days' + (ms.minutes_after_start || ' minutes')::interval
from message_seed ms
on conflict (id) do nothing;

-- =============================================================================
-- 18. NOTIFICATIONS — top up for tip + merch (follow/comment/support already
-- arrive via triggers, but those don't cover badges, so a couple are added
-- for the tip/merch categories which have the highest transaction volume)
-- =============================================================================

insert into public.notifications (id, recipient_id, actor_id, type, metadata, read, created_at)
select
  pg_temp.seed_uuid('notif:tip:' || sl.id),
  sl.to_id,
  sl.from_id,
  'tip',
  jsonb_build_object('amount', sl.amount),
  (random() < 0.55),
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
  (random() < 0.55),
  sl.created_at
from public.sparks_ledger sl
where sl.category = 'merch'
on conflict (id) do nothing;

commit;

-- =============================================================================
-- Sanity check — run this separately after the script above to see counts.
-- =============================================================================
-- select 'profiles' as table_name, count(*) from public.profiles
-- union all select 'tracks', count(*) from public.tracks
-- union all select 'track_notes', count(*) from public.track_notes
-- union all select 'track_likes', count(*) from public.track_likes
-- union all select 'playlists', count(*) from public.playlists
-- union all select 'playlist_tracks', count(*) from public.playlist_tracks
-- union all select 'top_friends', count(*) from public.top_friends
-- union all select 'gigs', count(*) from public.gigs
-- union all select 'groups', count(*) from public.groups
-- union all select 'group_members', count(*) from public.group_members
-- union all select 'group_posts', count(*) from public.group_posts
-- union all select 'merch_items', count(*) from public.merch_items
-- union all select 'merch_orders', count(*) from public.merch_orders
-- union all select 'follows', count(*) from public.follows
-- union all select 'wall_comments', count(*) from public.wall_comments
-- union all select 'supports', count(*) from public.supports
-- union all select 'sparks_ledger', count(*) from public.sparks_ledger
-- union all select 'profile_badges', count(*) from public.profile_badges
-- union all select 'feed_events', count(*) from public.feed_events
-- union all select 'conversations', count(*) from public.conversations
-- union all select 'messages', count(*) from public.messages
-- union all select 'notifications', count(*) from public.notifications;
