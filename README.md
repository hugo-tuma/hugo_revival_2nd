# R'SPACE

A monochrome, brutalist-wireframe music platform UI, wired end-to-end
against a real Supabase backend. It's built as a **public showcase with no
login wall**: every view is readable by anyone the moment they land on the
page, because the seeded demo community (48 profiles, 37 tracks, 13 gigs, 7
groups, 176 Sparks transactions — see `supabase/seed.sql`) is intentionally
made of accounts that can't log in. There's no point gating a demo behind a
sign-in that only leads to an empty account.

## Stack

- **Frontend**: React 18, Vite, Tailwind, TanStack Query v5
- **Backend**: Supabase — Postgres + Row Level Security
- **Icons**: lucide-react (thin strokes, 16–18px, no fills)
- **Headless primitives**: @radix-ui/react-slider (transport scrubber +
  volume), @radix-ui/react-dialog ("+ New group"), @radix-ui/react-tooltip
  (collapsed sidebar labels)
- **Class utilities**: clsx + tailwind-merge (`src/lib/cn.js`)

## Going live

1. **Create a Supabase project** (or use an existing one).
2. **Run every file in `supabase/migrations/`, in order** — 0001 through
   0006. The last one (`0006_public_showcase_views.sql`) is what makes this
   a login-free showcase; see "How public read access works" below before
   skipping it.
3. **Run `supabase/seed.sql`** to populate the demo community.
4. **Configure environment variables**:
   ```sh
   cp .env.example .env
   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   # from Project Settings -> API in the Supabase dashboard
   ```
5. **Install and run**:
   ```sh
   npm install
   npm run dev
   ```

Without those env vars the app shows a "Connect Supabase to go live" screen
instead of crashing — that's the honest state of a backend-dependent app
with no backend attached, not a placeholder feature.

## How public read access works

Most tables (`profiles`, `tracks`, `gigs`, `groups`, `playlists`,
`track_likes`, `follows`, `wall_comments`, ...) already have an RLS policy
of `using (true)` — anyone can read them, no session required. That's
enough for Artists, Gigs, Groups, Library, and Music Player.

`sparks_ledger` is different on purpose: its RLS policy restricts reads to
the two participants in each transaction (see `0001_init.sql`), because it
records who tipped whom. A logged-out visitor's requests run as the `anon`
role (that's what the Supabase anon key maps to for a client with no signed-in
session), so a logged-out visitor querying it directly gets zero rows —
verified: `select count(*) from sparks_ledger` as `anon` returns `0`.

Payouts and the Sparks activity feed still need *some* real numbers, so
`0006_public_showcase_views.sql` adds two views instead of loosening that
policy:

- **`artist_earnings_public`** — each artist's lifetime totals, broken down
  by category (tips / support / merch). No `from_id`, no per-tipper detail.
- **`recent_activity_public`** — an anonymized activity stream: which
  artist, what category, how much, when. Never who sent it.

Views run with the privileges of their owner (the migration role) rather
than the querying role, which is what lets `anon` read an aggregate over a
table its own RLS policy blocks it from querying directly — a standard,
documented Postgres/Supabase pattern for exposing safe aggregates without
touching the underlying table's security. Verified locally: the same `anon`
role that gets 0 rows from `sparks_ledger` gets the full, correctly-aggregated
result set from both views.

## What's read-only in this pass

Anything that would need a real signed-in identity to attach a row to (RLS
requires `auth.uid() = owner_id` / `= user_id` / group membership on insert)
is still a real UI affordance, but clicking it opens a small "this feature
will be added soon" dialog instead of faking a local-only success that would
vanish on reload: "+ New group", buying merch, getting gig tickets, sending
a group chat message, sending a direct message, and the account/sign-in
menu. Adding real sign-in is a natural next step if you want all of those to
actually write to the database.

Two things are real without needing auth, implemented as honest,
per-browser workarounds rather than gated:
- **Joining a group** is tracked in `localStorage` (see
  `src/hooks/useJoinedGroups.js`) instead of `group_members`, since that
  insert also needs `auth.uid()`. It's real enough to persist across
  reloads and drive a "Joined groups" section, just not synced to the
  backend or visible to anyone else.
- **Removing a song from your library** hides it from the current
  session's view (component state in `LibraryView.jsx`); it doesn't delete
  the underlying `track_likes` row, since that row isn't yours to delete
  without a real session either.

Artist bios are generated client-side from each profile's real fields
(`src/lib/generateBio.js`) — there's no free-text `bio` column in the
schema, only the short `bio_mood` tagline, so this composes a fuller
paragraph around it deterministically (same artist always reads the same
way) rather than adding a migration for one column.

## Design system

- Canvas `#F4F4F5`, panels pure white, 1px solid black borders, sharp
  corners, no drop shadows.
- Panel headers are solid black strips (`bg-black text-white`, mono,
  uppercase, tracked).
- UI text is `font-sans` (Inter); timers, metrics, and panel headers are
  `font-mono` (IBM Plex Mono).

## Project structure

```
supabase/
  migrations/           0001-0005: full schema + RLS + RPCs (from the
                         earlier full-stack build); 0006: the two public
                         showcase views described above
  seed.sql              48-profile demo community across every UGC table
scripts/
  pg_test_harness.sql, pg_functional_test.sql   local Postgres verification
src/
  lib/
    supabase.js         Supabase client + isSupabaseConfigured guard
    queryClient.js       TanStack Query client
    cn.js                clsx + tailwind-merge class helper
    format.js            timeAgo / formatDuration / formatGigDate helpers
    navItems.js          shared sidebar nav config (id, label, icon)
  hooks/
    useRSpaceQueries.js  every data query: artists, gigs, groups, playlists,
                          track catalog, artist earnings, recent activity
  components/
    RSpacePanel.jsx, EmptyState.jsx, SparkBadge.jsx, Skeleton.jsx
    layout/
      Shell.jsx, TopBar.jsx, Sidebar.jsx, BottomTransportBar.jsx,
      SetupScreen.jsx, ErrorBoundary.jsx
  views/
    ArtistsView, GigsView, GroupsView, LibraryView, SparksView,
    MusicPlayerView, PayoutsView — all wired to live Supabase data
  App.jsx               owns activeView / sidebarCollapsed / player state
```

## Known limits

- **One shared audio file stands in for every track.** Seed track
  `audio_url` values are still structured placeholders
  (`cdn.rspace.fm/seed-audio/...`) with nothing real hosted at them, so
  playback doesn't stream each track's own audio. What *does* work: every
  "play" affordance (Library's liked songs, the Music Player's featured
  track/queue/recently played, and track results in the search dropdown)
  triggers real HTML5 audio playback of one bundled instrumental loop
  (`public/audio/demo-track.wav`, synthesized locally — see
  `src/hooks/usePlayerEngine.js`), and the bottom transport bar reflects
  real state: the actual track's title/artist, real play/pause, a real
  seekable progress bar, and real elapsed/total time (the loop's own
  duration, not the track's fictional metadata duration, since that's
  what's actually playing).
- **Queue / Recently Played are derived, not tracked.** There's no
  per-visitor playback-history table in this schema, so those two panels
  are populated from the real track catalog (most-liked / most-recent
  slices) rather than an actual play history.
