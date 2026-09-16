import { useMemo, useState } from 'react';
import { LogOut, Menu, MessageSquare, Music, Search, ShoppingBag, User } from 'lucide-react';
import SparkBadge from '../SparkBadge';
import AccountGateDialog from '../AccountGateDialog';
import { useArtists, useTrackCatalog } from '../../hooks/useRSpaceQueries';

const ICON_BUTTON =
  'flex h-8 w-8 items-center justify-center border border-transparent text-black hover:border-black hover:bg-neutral-100';

const RESULT_LIMIT = 5;

export default function TopBar({
  sidebarCollapsed,
  onToggleSidebar,
  searchValue,
  onSearchChange,
  sparksBalance = 0,
  onSelectView,
  onPlayTrack,
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const { data: tracks } = useTrackCatalog();
  const { data: artists } = useArtists();

  const query = searchValue.trim().toLowerCase();

  const matchedTracks = useMemo(() => {
    if (!query || !tracks) return [];
    return tracks
      .filter((t) => t.title.toLowerCase().includes(query) || t.artist?.display_name?.toLowerCase().includes(query))
      .slice(0, RESULT_LIMIT);
  }, [tracks, query]);

  const matchedArtists = useMemo(() => {
    if (!query || !artists) return [];
    return artists
      .filter((a) => a.display_name.toLowerCase().includes(query) || a.handle.toLowerCase().includes(query))
      .slice(0, RESULT_LIMIT);
  }, [artists, query]);

  const showDropdown = searchFocused && query.length > 0;
  const hasResults = matchedTracks.length > 0 || matchedArtists.length > 0;

  function goTo(view) {
    onSelectView(view);
    onSearchChange('');
    setSearchFocused(false);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-black bg-white px-3 sm:px-4">
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className={ICON_BUTTON}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={!sidebarCollapsed}
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
        <span className="flex items-center gap-1 font-mono text-sm font-semibold tracking-wide">
          R&rsquo;SPACE
          <span className="inline-block h-2 w-2 bg-black" aria-hidden="true" />
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="flex items-center gap-2 border border-black bg-white px-2.5 py-1.5">
          <Search size={15} strokeWidth={1.5} className="shrink-0 text-neutral-500" />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search tracks & artists"
            className="w-full bg-transparent font-sans text-sm outline-none placeholder:text-neutral-400"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-30 max-h-80 overflow-y-auto border border-black bg-white shadow-[2px_2px_0_0_#000]">
            {!hasResults ? (
              <p className="p-3 text-center font-sans text-xs text-neutral-400">No matches for &ldquo;{searchValue}&rdquo;</p>
            ) : (
              <div className="flex flex-col divide-y divide-neutral-200">
                {matchedArtists.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => goTo('artists')}
                    className="flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100"
                  >
                    <User size={14} strokeWidth={1.5} className="shrink-0 text-neutral-500" />
                    <span className="min-w-0 flex-1 truncate font-sans text-sm">{a.display_name}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                      Artist
                    </span>
                  </button>
                ))}
                {matchedTracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onPlayTrack?.(t);
                      goTo('player');
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100"
                  >
                    <Music size={14} strokeWidth={1.5} className="shrink-0 text-neutral-500" />
                    <span className="min-w-0 flex-1 truncate font-sans text-sm">
                      {t.title} <span className="text-neutral-400">&mdash; {t.artist?.display_name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                      Track
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button onClick={() => onSelectView('shop')} className={ICON_BUTTON} aria-label="Shop">
          <ShoppingBag size={17} strokeWidth={1.5} />
        </button>
        <AccountGateDialog
          trigger={
            <button className={ICON_BUTTON} aria-label="Messages">
              <MessageSquare size={17} strokeWidth={1.5} />
            </button>
          }
          title="Messages"
        >
          Direct messages are private &mdash; Row Level Security only lets each conversation&rsquo;s two participants
          read it, so there&rsquo;s no inbox to show a logged-out visitor. Sign in with a real account to see yours.
        </AccountGateDialog>
        <SparkBadge value={sparksBalance} />
        <AccountGateDialog
          trigger={
            <button
              className="flex h-8 w-8 items-center justify-center border border-black font-mono text-[11px] font-semibold hover:bg-neutral-100"
              title="Account"
            >
              AU
            </button>
          }
          title="Account"
        >
          You&rsquo;re browsing R&rsquo;SPACE as a guest &mdash; this public preview has no real signed-in session,
          so there&rsquo;s no account page to show.
        </AccountGateDialog>
        <AccountGateDialog
          trigger={
            <button className={ICON_BUTTON} aria-label="Log out">
              <LogOut size={17} strokeWidth={1.5} />
            </button>
          }
          title="Log out"
        >
          There&rsquo;s nothing to log out of &mdash; you&rsquo;re browsing this public preview without a real
          signed-in session.
        </AccountGateDialog>
      </div>
    </header>
  );
}
