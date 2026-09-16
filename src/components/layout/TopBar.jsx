import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, LogOut, Menu, MessageSquare, Music, Search, ShoppingBag, Users, User, X } from 'lucide-react';
import SparkBadge from '../SparkBadge';
import AccountGateDialog from '../AccountGateDialog';
import { useArtists, useGigs, useGroups, useMerchItems, useTrackCatalog } from '../../hooks/useRSpaceQueries';

const ICON_BUTTON =
  'flex h-8 w-8 items-center justify-center border border-transparent text-black hover:border-black hover:bg-neutral-100';

const RESULT_LIMIT = 4;

function ComposeMessageDialog() {
  const { data: artists } = useArtists();
  const [open, setOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState(false);

  const recipient = artists?.find((a) => a.id === recipientId) ?? artists?.[0];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setDraft('');
          setSent(false);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button className={ICON_BUTTON} aria-label="Messages">
          <MessageSquare size={17} strokeWidth={1.5} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-in fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="animate-dialog-in fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm border border-black bg-white">
          <div className="flex items-center justify-between border-b border-black bg-black px-3 py-2 text-white">
            <Dialog.Title className="font-mono text-xs uppercase tracking-wider">New message</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close">
                <X size={15} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-400">To</span>
              <select
                value={recipient?.id ?? ''}
                onChange={(e) => setRecipientId(e.target.value)}
                className="border border-black px-2 py-1 font-sans text-sm outline-none"
              >
                {artists?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={recipient ? `Message ${recipient.display_name}…` : 'Type a message…'}
              rows={3}
              className="resize-none border border-black px-2 py-1.5 font-sans text-sm outline-none placeholder:text-neutral-400"
            />
            {sent ? (
              <p className="font-sans text-xs text-neutral-500">This feature will be added soon.</p>
            ) : (
              <button
                onClick={() => setSent(true)}
                disabled={!draft.trim()}
                className="self-end border border-black px-3 py-1 font-mono text-[11px] uppercase tracking-wide hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-black"
              >
                Send
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

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
  const { data: groups } = useGroups();
  const { data: gigs } = useGigs();
  const { data: merchItems } = useMerchItems();

  const query = searchValue.trim().toLowerCase();

  const matchedArtists = useMemo(() => {
    if (!query || !artists) return [];
    return artists
      .filter((a) => a.display_name.toLowerCase().includes(query) || a.handle.toLowerCase().includes(query))
      .slice(0, RESULT_LIMIT);
  }, [artists, query]);

  const matchedTracks = useMemo(() => {
    if (!query || !tracks) return [];
    return tracks
      .filter((t) => t.title.toLowerCase().includes(query) || t.artist?.display_name?.toLowerCase().includes(query))
      .slice(0, RESULT_LIMIT);
  }, [tracks, query]);

  const matchedGroups = useMemo(() => {
    if (!query || !groups) return [];
    return groups.filter((g) => g.name.toLowerCase().includes(query)).slice(0, RESULT_LIMIT);
  }, [groups, query]);

  const matchedGigs = useMemo(() => {
    if (!query || !gigs) return [];
    return gigs
      .filter(
        (g) =>
          g.artist?.display_name?.toLowerCase().includes(query) ||
          g.venue?.toLowerCase().includes(query) ||
          g.city?.toLowerCase().includes(query)
      )
      .slice(0, RESULT_LIMIT);
  }, [gigs, query]);

  const matchedMerch = useMemo(() => {
    if (!query || !merchItems) return [];
    return merchItems.filter((m) => m.name.toLowerCase().includes(query)).slice(0, RESULT_LIMIT);
  }, [merchItems, query]);

  const showDropdown = searchFocused && query.length > 0;
  const hasResults =
    matchedArtists.length > 0 ||
    matchedTracks.length > 0 ||
    matchedGroups.length > 0 ||
    matchedGigs.length > 0 ||
    matchedMerch.length > 0;

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
            placeholder="Search everything"
            className="w-full bg-transparent font-sans text-sm outline-none placeholder:text-neutral-400"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-30 max-h-96 overflow-y-auto border border-black bg-white shadow-[2px_2px_0_0_#000]">
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
                {matchedGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => goTo('groups')}
                    className="flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100"
                  >
                    <Users size={14} strokeWidth={1.5} className="shrink-0 text-neutral-500" />
                    <span className="min-w-0 flex-1 truncate font-sans text-sm">{g.name}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                      Group
                    </span>
                  </button>
                ))}
                {matchedGigs.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => goTo('gigs')}
                    className="flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100"
                  >
                    <Calendar size={14} strokeWidth={1.5} className="shrink-0 text-neutral-500" />
                    <span className="min-w-0 flex-1 truncate font-sans text-sm">
                      {g.artist?.display_name} <span className="text-neutral-400">&mdash; {g.venue}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                      Gig
                    </span>
                  </button>
                ))}
                {matchedMerch.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => goTo('shop')}
                    className="flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100"
                  >
                    <ShoppingBag size={14} strokeWidth={1.5} className="shrink-0 text-neutral-500" />
                    <span className="min-w-0 flex-1 truncate font-sans text-sm">{m.name}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                      Shop
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
        <ComposeMessageDialog />
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
          You&rsquo;re browsing R&rsquo;SPACE as a guest, the sign in option will be added soon :)
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
