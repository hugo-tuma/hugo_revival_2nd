-- =============================================================================
-- R'SPACE — public, privacy-preserving aggregates for unauthenticated browsing
-- =============================================================================
-- sparks_ledger is intentionally locked down by RLS to its two participants
-- (see 0001_init.sql) — a visitor with no session should never be able to
-- read who tipped whom. But the Payouts and Sparks/activity views need to
-- show *some* real numbers without requiring a login (the seeded demo
-- profiles can't log in at all — see supabase/seed.sql).
--
-- These two views resolve that: they aggregate/select only the fields that
-- are safe to make public (an artist's own totals, and anonymized category+
-- amount+timestamp for a public activity feed) and never expose from_id
-- (who sent it) or per-transaction detail beyond that. Views execute with
-- the privileges of their owner (the migration role) by default in Postgres,
-- not the querying role, which is what lets `anon`/`authenticated` read an
-- aggregate over a table their own RLS policy would otherwise block them
-- from querying directly.

create view public.artist_earnings_public as
select
  p.id as artist_id,
  p.handle,
  p.display_name,
  p.color,
  p.avatar_url,
  coalesce(sum(sl.amount) filter (where sl.category = 'tip'), 0)     as lifetime_tips,
  coalesce(sum(sl.amount) filter (where sl.category = 'support'), 0) as lifetime_support,
  coalesce(sum(sl.amount) filter (where sl.category = 'merch'), 0)   as lifetime_merch,
  coalesce(sum(sl.amount), 0) as lifetime_total,
  count(sl.id) as transaction_count,
  max(sl.created_at) as last_transaction_at
from public.profiles p
left join public.sparks_ledger sl on sl.to_id = p.id
where p.role = 'artist'
group by p.id, p.handle, p.display_name, p.color, p.avatar_url;

grant select on public.artist_earnings_public to anon, authenticated;

create view public.recent_activity_public as
select
  sl.id,
  sl.to_id as artist_id,
  p.handle as artist_handle,
  p.display_name as artist_display_name,
  p.color as artist_color,
  sl.category,
  sl.amount,
  sl.created_at
from public.sparks_ledger sl
join public.profiles p on p.id = sl.to_id
where sl.to_id is not null;

grant select on public.recent_activity_public to anon, authenticated;
