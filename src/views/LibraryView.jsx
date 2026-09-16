import { useState } from 'react';
import { Heart, Library as LibraryIcon, ListMusic, Pause, Play, X } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import { usePublicPlaylists, useTopLikedTracks } from '../hooks/useRSpaceQueries';
import { formatDuration } from '../lib/format';

export default function LibraryView({ nowPlaying, isPlaying, onPlayTrack, onTogglePlay }) {
  const { data: playlists, isLoading: playlistsLoading, isError: playlistsError } = usePublicPlaylists();
  const { data: allLikedTracks, isLoading: tracksLoading, isError: tracksError, error: tracksErr } = useTopLikedTracks(10);
  const [removedIds, setRemovedIds] = useState(() => new Set());

  const likedTracks = allLikedTracks?.filter((t) => !removedIds.has(t.id));
  const totalLikes = likedTracks?.reduce((sum, t) => sum + t.like_count, 0) ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <RSpacePanel title="Community Library" icon={LibraryIcon} bodyClassName="p-0">
        <div className="flex w-full items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-white">
          <Heart size={18} strokeWidth={1.75} fill="white" />
          <span className="flex-1 font-sans text-sm font-semibold">Liked Songs</span>
          <span className="font-mono text-xs">{totalLikes}</span>
        </div>

        {playlistsLoading ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : playlistsError ? (
          <p className="p-3 font-sans text-xs text-neutral-400">Couldn&rsquo;t load playlists.</p>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-200">
            {playlists.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <ListMusic size={16} strokeWidth={1.5} className="shrink-0 text-black" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-sm">{p.name}</p>
                  <p className="truncate font-sans text-[11px] text-neutral-400">by {p.owner?.display_name}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-neutral-400">{p.track_count}</span>
              </div>
            ))}
          </div>
        )}

        <p className="border-t border-neutral-200 p-3 font-sans text-[11px] text-neutral-400">
          This is a public, sign-in-free preview &mdash; creating your own playlist needs a real account (Row
          Level Security ties every playlist to its owner).
        </p>
      </RSpacePanel>

      <RSpacePanel title="Most Liked Songs" icon={Heart}>
        {tracksLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : tracksError ? (
          <EmptyState>Couldn&rsquo;t load tracks: {tracksErr.message}</EmptyState>
        ) : likedTracks.length === 0 ? (
          <EmptyState>No liked songs yet.</EmptyState>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-200">
            {likedTracks.map((t, i) => {
              const isActive = nowPlaying?.id === t.id;
              return (
                <div key={t.id} className="group flex w-full items-center first:pt-0 last:pb-0 hover:bg-neutral-50">
                  <button
                    onClick={() => (isActive ? onTogglePlay() : onPlayTrack(t))}
                    className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left"
                  >
                    <span className="flex w-4 shrink-0 items-center justify-center">
                      {isActive && isPlaying ? (
                        <Pause size={11} strokeWidth={1.5} />
                      ) : isActive ? (
                        <Play size={11} strokeWidth={1.5} />
                      ) : (
                        <span className="font-mono text-xs text-neutral-400">{i + 1}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-sans text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                        {t.title}
                      </p>
                      <p className="truncate font-sans text-xs text-neutral-400">{t.artist?.display_name}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-neutral-400">{formatDuration(t.duration)}</span>
                    <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-neutral-400">
                      <Heart size={11} strokeWidth={1.5} /> {t.like_count}
                    </span>
                  </button>
                  <button
                    onClick={() => setRemovedIds((prev) => new Set(prev).add(t.id))}
                    className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center text-neutral-300 hover:text-black"
                    aria-label={`Remove ${t.title} from library`}
                    title="Remove from library"
                  >
                    <X size={13} strokeWidth={1.5} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </RSpacePanel>
    </div>
  );
}
