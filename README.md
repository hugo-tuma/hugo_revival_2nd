# R'SPACE

A brutalist MySpace × Bandcamp music social platform. React + Vite + Tailwind
on the frontend, Supabase (Postgres + RLS + Realtime + Storage) on the
backend. Every screen is wired against real data — there are no mock arrays
and no stubbed handlers anywhere in `src/`.

## Stack

- **Frontend**: React 18, Vite, Tailwind, React Router, TanStack Query v5, Zustand
- **Audio**: wavesurfer.js v7 (Web Audio decoding, real peak extraction, Regions plugin for pinned notes)
- **Drag & drop**: @dnd-kit (Top 8 reordering)
- **CSS sandbox**: postcss + postcss-selector-parser (browser-side AST sanitizer/scoper)
- **Code editor**: CodeMirror 6 via @uiw/react-codemirror
- **Backend**: Supabase — Postgres, Row Level Security, Realtime (Postgres changes + Presence), Storage

## Why this needs your own Supabase project

The app is fully wired end-to-end against a real backend: real tables, real
Row Level Security policies, real atomic stored procedures for every Sparks
transaction, real Realtime subscriptions, real Storage uploads. What it
cannot ship with is a live database — that requires your own cloud
credentials, which only you can provision. Without them the app shows a
"Connect Supabase to go live" screen instead of crashing; that screen is the
honest state of a backend-dependent app with no backend attached yet, not a
placeholder feature.

## Going live

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (or
   run one locally / self-hosted with the Supabase CLI or Docker).

2. **Run the migrations** against it, in order:
   ```sh
   # Using the Supabase CLI, from this repo:
   supabase link --project-ref <your-project-ref>
   supabase db push

   # ...or paste supabase/migrations/0001_init.sql and then
   # supabase/migrations/0002_storage.sql into the SQL editor in the
   # Supabase dashboard and run them in order.
   ```
   This creates every table, RLS policy, trigger, and stored procedure
   (`tip_artist`, `purchase_merch`, `purchase_badge`, `fork_space`,
   `toggle_support`, `reorder_top_friends`, `charge_monthly_supports`), plus
   the public `audio` storage bucket and its access policies.

3. **Enable Realtime** — the migration already runs
   `alter publication supabase_realtime add table ...` for the tables that
   need live updates (wall comments, the activity feed, profiles, Top 8,
   merch stock, track notes). If your project didn't have that publication
   yet, the Supabase CLI/dashboard creates it automatically on a fresh
   project.

4. **(Optional) Schedule monthly support charges** — `charge_monthly_supports()`
   is written to run on a schedule via the `pg_cron` extension:
   ```sql
   select cron.schedule(
     'charge-monthly-supports', '0 3 * * *',
     'select public.charge_monthly_supports();'
   );
   ```
   `pg_cron` is a separate extension you enable per-project; the app works
   fully without it, monthly supports just won't auto-renew until it's on.

5. **Configure environment variables**:
   ```sh
   cp .env.example .env
   # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   # from Project Settings -> API in the Supabase dashboard
   ```

6. **Install and run**:
   ```sh
   npm install
   npm run dev
   ```

7. Sign up from the app's own auth screen (email + password via Supabase
   Auth). A `profiles` row is created for you automatically by a database
   trigger the moment you sign up — set your handle, mood, and Top 8 from
   there.

## Verifying the schema without a Supabase account

`scripts/pg_test_harness.sql` stubs just enough of Supabase's platform
surface (`auth.users`, `auth.uid()`, the `storage` schema, baseline grants)
to run the real migrations and RPCs against a **plain local Postgres**, and
`scripts/pg_functional_test.sql` exercises every stored procedure
end-to-end as two simulated users (tipping, Top 8 reorder, forking, merch
purchase with stock/ledger, badge minting, monthly support toggling) and
asserts that RLS actually blocks a forged write. This is how the schema in
this repo was validated — against real Postgres 16, not by inspection:

```sh
createdb spaces_test
psql -d spaces_test -f scripts/pg_test_harness.sql
psql -d spaces_test -f supabase/migrations/0001_init.sql
psql -d spaces_test -f supabase/migrations/0002_storage.sql
psql -d spaces_test -f scripts/pg_functional_test.sql
```
It should end with `--- ALL FUNCTIONAL TESTS PASSED ---` and no errors above
it. This harness is a local verification tool only — it doesn't replace a
real Supabase project (no real Auth, no real Storage, no real Realtime
sockets), but it does prove the SQL itself is correct.

## Project structure

```
supabase/
  migrations/
    0001_init.sql       tables, RLS policies, triggers, stored procedures
    0002_storage.sql    the "audio" storage bucket + its access policies
scripts/
  pg_test_harness.sql       stubs Supabase's platform surface for local testing
  pg_functional_test.sql    end-to-end RPC + RLS test script
src/
  lib/
    supabase.js         Supabase client + storage helpers
    queryClient.js       TanStack Query client + query key registry
    cssSandbox.js         AST-based CSS sanitizer/scoper (postcss + postcss-selector-parser)
  stores/
    audioStore.js        global playback state (Zustand, persisted queue/volume)
    sessionStore.js       cached auth/profile identity
    toastStore.js         brutalist toast notification queue
    presenceStore.js      Realtime Presence "online now" map
  hooks/
    useSpacesQueries.js  every data query + mutation (profiles, feed, wall,
                          tracks, notes, merch, gigs, badges, tips, support,
                          follows, forking) with realtime subscriptions
    usePresence.js        Presence channel join/track/heartbeat
  components/
    WaveformPlayer.jsx    real wavesurfer.js wrapper (Web Audio decode + Regions)
    SanitizedStyle.jsx    the one place custom_css is sanitized and rendered
    audio/                GlobalPlayerBar, WipStemPlayer, TrackUploadForm
    home/                 ProfileCard, Top8Grid (dnd-kit), ActivityFeed, RightRail, TrackPlayerCard
    artist/                ArtistHeader, GigList, MerchShop
    customize/             LayoutToggles, ThemeVarsPicker, CssEditor (CodeMirror 6), BadgeShop, ForkDiffViewer
    auth/                  AuthGate, AuthForm
    layout/                Header, ToastViewport, ErrorBoundary, ResponsiveShell
    ui/                    Toggle, Drawer, Skeleton, SectionHeading
  boards/
    ProfileBoard.jsx, CustomizeBoard.jsx
  utils/
    format.js, audioDecode.js
```

## Notable design decisions

- **CSS sandboxing** (`src/lib/cssSandbox.js`): every rule in a user's
  `custom_css` is parsed with `postcss`, walked with
  `postcss-selector-parser`, and rejected unless it targets `.space-card`,
  `.space-btn`, or `.space-banner` — with `html`, `body`, `:root`, `*`,
  attribute selectors, `url()`, `@import`, `expression()`, `javascript:`,
  and `position: fixed/sticky` stripped outright. `@keyframes` are renamed
  per-profile so one Space's animation can't collide with another's.
  Custom property declarations are limited to `--accent`/`--bg`/`--text`/
  `--font-mono`. This runs both in the live CodeMirror linter and again at
  render time in `SanitizedStyle.jsx` — nothing trusts a value just because
  it was previously persisted.
- **One audio engine**: `GlobalPlayerBar` mounts exactly once, at the App
  root, outside the routed board content, and owns the only WaveSurfer
  instance backing the "now playing" track — so navigating between Your
  Space / Artist Page / Customize never interrupts playback. The WIP Stem
  Player on the Artist page is intentionally a separate, independent
  WaveSurfer instance (it's a producer's work-in-progress demo, not the
  persistent queue).
- **Sparks are ledgered, not just counted**: every transfer (tips, merch,
  badges, monthly support) goes through a `SECURITY DEFINER` Postgres
  function that locks the relevant rows, checks balances, and writes an
  audit row to `sparks_ledger` in the same transaction — a client can never
  write `sparks_balance` directly (see the column-level `GRANT`/`REVOKE` in
  the migration).
- **Fork preview before commit**: forking pulls up a real diff
  (`ForkDiffViewer.jsx`, using `diff`'s `diffLines`) of the target's
  `custom_css` and `theme_vars` against your current draft before
  `fork_space()` runs, so a fork can't silently clobber unsaved
  customization.
