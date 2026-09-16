\set ON_ERROR_STOP on
\pset format aligned

-- Two fake auth.users so handle_new_user() fires for each.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local');

select handle, display_name, sparks_balance from public.profiles order by handle;

-- Give Alice a friendly handle/display name as she would set via the UI.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
update public.profiles set handle = 'alice', display_name = 'Alice' where id = auth.uid();
reset role;

set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.profiles set handle = 'bob', display_name = 'Bob' where id = auth.uid();
reset role;

\echo '--- RLS should block Alice from touching her own sparks_balance directly ---'
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$
begin
  begin
    update public.profiles set sparks_balance = 999999 where id = auth.uid();
    raise exception 'SHOULD NOT REACH HERE: direct sparks_balance update succeeded';
  exception when insufficient_privilege then
    raise notice 'OK: direct sparks_balance update correctly rejected';
  end;
end $$;
reset role;

\echo '--- tip_artist: Alice tips Bob 50 Sparks ---'
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select * from public.tip_artist('22222222-2222-2222-2222-222222222222', 50);
reset role;

select handle, sparks_balance from public.profiles order by handle;
select category, amount from public.sparks_ledger;

\echo '--- reorder_top_friends: Alice adds Bob to her Top 8 ---'
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select * from public.reorder_top_friends(array['22222222-2222-2222-2222-222222222222']::uuid[]);
reset role;

select user_id, friend_id, position from public.top_friends;

\echo '--- fork_space: Alice forks Bob''s theme/css/layout ---'
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.profiles set custom_css = '.space-card { border-color: var(--accent); }', theme_vars = '{"accent":"#00AEEF","bg":"#FDFBF7","text":"#111111"}'::jsonb where id = auth.uid();
reset role;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select * from public.fork_space('22222222-2222-2222-2222-222222222222');
reset role;

select handle, forked_from_id, fork_count from public.profiles order by handle;

\echo '--- feed_events: music_drop auto-created by trigger on track insert ---'
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.tracks (user_id, title, duration, audio_url) values (auth.uid(), 'Test Track', 120, 'https://example.invalid/test.mp3');
reset role;

select type, metadata from public.feed_events order by created_at;

\echo '--- merch: Bob lists an item, Alice buys it ---'
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.merch_items (artist_id, name, price_sparks, variants, stock) values (auth.uid(), 'Test Tee', 30, array['S','M'], 2);
reset role;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select * from public.purchase_merch((select id from public.merch_items limit 1), 'M');
reset role;

select handle, sparks_balance from public.profiles order by handle;
select stock from public.merch_items;

\echo '--- badges: Alice mints the OG Badge ---'
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select * from public.purchase_badge((select id from public.badges where name = 'OG Badge'));
reset role;

select p.handle, b.name from public.profile_badges pb
  join public.profiles p on p.id = pb.profile_id
  join public.badges b on b.id = pb.badge_id;

\echo '--- toggle_support: Alice supports Bob monthly, then pauses ---'
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select * from public.toggle_support('22222222-2222-2222-2222-222222222222', 25);
select * from public.toggle_support('22222222-2222-2222-2222-222222222222', 25);
reset role;

select handle, sparks_balance from public.profiles order by handle;

\echo '--- RLS should block Alice from inserting a feed_event she didn''t author ---'
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$
begin
  begin
    insert into public.feed_events (actor_id, type, metadata) values ('22222222-2222-2222-2222-222222222222', 'post', '{"text":"forged"}');
    raise exception 'SHOULD NOT REACH HERE: forged feed_event insert succeeded';
  exception when insufficient_privilege then
    raise notice 'OK: forged feed_event insert correctly rejected';
  end;
end $$;
reset role;

\echo '--- ALL FUNCTIONAL TESTS PASSED ---'
