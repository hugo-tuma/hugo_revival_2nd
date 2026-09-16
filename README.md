# R'SPACE

A clean, monochrome wireframe prototype of the R'SPACE UI shell — the
"early functional prototype" pass, built for structural/interaction parity
with the reference screenshots rather than live data. Every screen is a
real, working React view with real local state (sidebar collapse, active
nav, play/pause, playlist creation, group creation), but nothing is wired
to a backend yet: balances, feeds, and lists are intentionally the zero/
empty states shown in the reference design.

## Stack

- **Frontend**: React 18, Vite, Tailwind
- **Icons**: lucide-react (thin strokes, 16–18px, no fills)
- **Headless primitives**: @radix-ui/react-slider (transport scrubber +
  volume), @radix-ui/react-dialog ("+ New group"), @radix-ui/react-tooltip
  (collapsed sidebar labels)
- **Class utilities**: clsx + tailwind-merge (`src/lib/cn.js`)

## Design system

- Canvas `#F4F4F5`, panels pure white, 1px solid black borders, sharp
  corners, no drop shadows.
- Panel headers are solid black strips (`bg-black text-white`, mono,
  uppercase, tracked).
- UI text is `font-sans` (Inter); timers, metrics, and panel headers are
  `font-mono` (IBM Plex Mono).
- Zero states throughout: centered gray copy, no populated mock content
  except the Artists grid's placeholder cards (there to demonstrate the
  card layout) and the intentionally red-accented "Liked Songs" row.

## Running it

```sh
npm install
npm run dev
```

No environment variables or external services are required — this is a
pure client-side prototype.

## Project structure

```
src/
  lib/
    cn.js            clsx + tailwind-merge class helper
    navItems.js       shared sidebar nav config (id, label, icon)
  components/
    RSpacePanel.jsx   the one reusable panel shape (black header + white body)
    EmptyState.jsx     centered gray zero-state copy
    SparkBadge.jsx      black pill "⚡0" badge
    layout/
      Shell.jsx          composes TopBar + Sidebar + routed view + BottomTransportBar
      TopBar.jsx          hamburger, wordmark, search, store/chat/sparks/avatar/logout
      Sidebar.jsx         7-item nav, collapsible, Radix Tooltip labels when collapsed
      BottomTransportBar.jsx  transport controls, dashed scrubber, repeat, volume (Radix Slider)
  views/
    LibraryView.jsx, ArtistsView.jsx, GigsView.jsx, SparksView.jsx,
    MusicPlayerView.jsx, GroupsView.jsx, PayoutsView.jsx
  App.jsx             owns activeView / sidebarCollapsed / player state, no routing library
```

## What's deliberately not here

This pass replaces the previous full-stack build (Supabase Postgres + RLS +
Realtime + Storage, wavesurfer.js audio decoding, dnd-kit, CodeMirror). That
backend and its schema still live untouched in `supabase/` and `scripts/`
in this repo for reference, but the frontend in `src/` no longer calls it —
this is a from-scratch UI rebuild targeting the wireframe reference, not an
integration of the two. Wiring these views back up to real data is a
follow-up, not part of this pass.
