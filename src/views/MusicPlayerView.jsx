import { useMemo } from 'react';
import { Disc, ListMusic, Music, Pause, Play } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import { useTrackCatalog } from '../hooks/useRSpaceQueries';
import { formatDuration } from '../lib/format';

function TrackRow({ track, isActive, isPlaying, onPlay }) {
  return (
    <button
      onClick={onPlay}
      className={`flex w-full items-center gap-2 py-2 text-left first:pt-0 last:pb-0 hover:bg-neutral-50 ${
        isActive ? 'bg-neutral-50' : ''
      }`}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {isActive && isPlaying ? (
          <Pause size={13} strokeWidth={1.5} />
        ) : (
          <Play size={13} strokeWidth={1.5} className={isActive ? '' : 'text-neutral-400'} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-sans text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>{track.title}</p>
        <p className="truncate font-sans text-[11px] text-neutral-400">{track.artist?.display_name}</p>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-neutral-400">{formatDuration(track.duration)}</span>
    </button>
  );
}

export default function MusicPlayerView({ nowPlaying, isPlaying, currentTime, onPlayTrack, onTogglePlay }) {
  const { data: tracks, isLoading, isError, error } = useTrackCatalog();

  const { featured, queue, recentlyPlayed } = useMemo(() => {
    if (!tracks || tracks.length === 0) return { featured: null, queue: [], recentlyPlayed: [] };
    const byLikes = [...tracks].sort((a, b) => b.like_count - a.like_count);
    const top = byLikes[0];
    const rest = tracks.filter((t) => t.id !== top.id);
    return {
      featured: top,
      queue: byLikes.slice(1, 6),
      recentlyPlayed: rest.slice(0, 5),
    };
  }, [tracks]);

  const displayed = tracks?.find((t) => t.id === nowPlaying?.id) ?? featured;
  const isDisplayedPlaying = isPlaying && nowPlaying?.id === displayed?.id;

  function handlePlayPause(track) {
    if (nowPlaying?.id === track.id) onTogglePlay();
    else onPlayTrack(track);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <RSpacePanel title="Now Playing" icon={Disc}>
        {isLoading ? (
          <div className="mx-auto flex max-w-xs flex-col items-center gap-4 py-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ) : isError ? (
          <EmptyState>Couldn&rsquo;t load tracks: {error.message}</EmptyState>
        ) : !displayed ? (
          <div className="mx-auto flex max-w-xs flex-col items-center gap-4 py-4">
            <div className="flex aspect-square w-full items-center justify-center border border-black bg-neutral-50">
              <Music size={40} strokeWidth={1.25} className="text-neutral-300" />
            </div>
            <div className="w-full text-center">
              <p className="font-sans text-sm font-semibold text-neutral-400">&mdash;</p>
              <p className="font-sans text-xs text-neutral-400">&mdash;</p>
            </div>
            <div className="dashed-track h-[2px] w-full" />
          </div>
        ) : (
          <div className="mx-auto flex max-w-xs flex-col items-center gap-4 py-4">
            <div
              className="flex aspect-square w-full items-center justify-center border border-black"
              style={{ backgroundColor: displayed.artist?.color ?? '#f5f5f5' }}
            >
              <Music size={40} strokeWidth={1.25} className="text-white/60" />
            </div>
            <div className="w-full text-center">
              <p className="truncate font-sans text-sm font-semibold">{displayed.title}</p>
              <p className="truncate font-sans text-xs text-neutral-400">{displayed.artist?.display_name}</p>
            </div>
            <button
              onClick={() => handlePlayPause(displayed)}
              className="flex h-9 w-9 items-center justify-center border border-black hover:bg-neutral-100"
              aria-label={isDisplayedPlaying ? 'Pause' : 'Play'}
            >
              {isDisplayedPlaying ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}
            </button>
            <div className="dashed-track h-[2px] w-full" />
            <p className="font-mono text-[10px] text-neutral-400">
              {formatDuration(nowPlaying?.id === displayed.id ? currentTime : 0)} / {formatDuration(displayed.duration)}
            </p>
          </div>
        )}
      </RSpacePanel>

      <div className="flex flex-col gap-4">
        <RSpacePanel title="Queue" icon={ListMusic}>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <EmptyState>Queue is empty.</EmptyState>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-200">
              {queue.map((t) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  isActive={nowPlaying?.id === t.id}
                  isPlaying={isPlaying}
                  onPlay={() => handlePlayPause(t)}
                />
              ))}
            </div>
          )}
        </RSpacePanel>

        <RSpacePanel title="Recently Played" icon={ListMusic}>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : recentlyPlayed.length === 0 ? (
            <EmptyState>Nothing played yet.</EmptyState>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-200">
              {recentlyPlayed.map((t) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  isActive={nowPlaying?.id === t.id}
                  isPlaying={isPlaying}
                  onPlay={() => handlePlayPause(t)}
                />
              ))}
            </div>
          )}
        </RSpacePanel>
      </div>
    </div>
  );
}
