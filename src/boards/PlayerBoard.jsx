import { Link } from 'react-router-dom';
import { Clock, History, ListMusic, Music2, Pause, Play, Repeat, SkipBack, SkipForward } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';
import { formatTime, initialsOf } from '../utils/format';
import SectionHeading from '../components/ui/SectionHeading';

function QueueRow({ track, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b-2 border-black/10 px-3 py-2 text-left last:border-b-0 hover:bg-black/5 ${
        active ? 'bg-spark' : ''
      }`}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black text-[9px] font-black"
        style={{ backgroundColor: active ? '#111111' : '#FDFBF7', color: active ? '#FDFBF7' : '#111111' }}
      >
        {active ? <Music2 size={12} /> : initialsOf(track.artist_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold">{track.title}</p>
        <p className="truncate text-[10px] text-black/50">{track.artist_name ?? 'Unknown artist'}</p>
      </div>
      <span className="shrink-0 text-[10px] text-black/40">{formatTime(track.duration)}</span>
    </button>
  );
}

export default function PlayerBoard() {
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const loop = useAudioStore((s) => s.loop);
  const queue = useAudioStore((s) => s.queue);
  const queueIndex = useAudioStore((s) => s.queueIndex);
  const history = useAudioStore((s) => s.history);
  const toggle = useAudioStore((s) => s.toggle);
  const toggleLoop = useAudioStore((s) => s.toggleLoop);
  const playNext = useAudioStore((s) => s.playNext);
  const playPrev = useAudioStore((s) => s.playPrev);
  const loadTrack = useAudioStore((s) => s.loadTrack);
  const seekToRatio = useAudioStore((s) => s.seekToRatio);

  const hasNext = queueIndex >= 0 && queueIndex < queue.length - 1;
  const hasPrev = queueIndex > 0;
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-2">
      <div className="space-card border-2 border-black bg-white">
        <SectionHeading icon={Music2}>Now playing</SectionHeading>
        <div className="flex flex-col items-center gap-4 p-6">
          <div className="flex h-40 w-40 items-center justify-center border-2 border-black bg-black text-cream">
            <Music2 size={40} />
          </div>

          {currentTrack ? (
            <div className="text-center">
              <Link to={`/space/${currentTrack.handle ?? ''}`} className="text-base font-black hover:text-spark">
                {currentTrack.title}
              </Link>
              <p className="text-xs text-black/50">{currentTrack.artist_name ?? 'Unknown artist'}</p>
            </div>
          ) : (
            <p className="text-xs text-black/40">Nothing playing — pick a track from Library or an artist&rsquo;s profile.</p>
          )}

          <div className="flex w-full items-center gap-2">
            <span className="w-9 shrink-0 text-right text-[10px] font-bold text-black/50">{formatTime(currentTime)}</span>
            <div
              className="relative h-2 flex-1 cursor-pointer border-2 border-black bg-cream"
              onClick={(e) => {
                if (!currentTrack) return;
                const rect = e.currentTarget.getBoundingClientRect();
                seekToRatio((e.clientX - rect.left) / rect.width);
              }}
            >
              <div className="h-full bg-black" style={{ width: `${Math.min(1, progress) * 100}%` }} />
            </div>
            <span className="w-9 shrink-0 text-[10px] font-bold text-black/50">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={playPrev}
              disabled={!hasPrev}
              className="flex h-9 w-9 items-center justify-center border-2 border-black disabled:opacity-30"
              aria-label="Previous track"
            >
              <SkipBack size={15} />
            </button>
            <button
              onClick={toggle}
              disabled={!currentTrack}
              className="flex h-12 w-12 items-center justify-center border-2 border-black bg-black text-cream hover:bg-spark hover:text-black disabled:opacity-30"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button
              onClick={playNext}
              disabled={!hasNext}
              className="flex h-9 w-9 items-center justify-center border-2 border-black disabled:opacity-30"
              aria-label="Next track"
            >
              <SkipForward size={15} />
            </button>
            <button
              onClick={toggleLoop}
              className={`flex h-9 w-9 items-center justify-center border-2 border-black ${loop ? 'bg-spark' : ''}`}
              aria-label="Toggle loop"
              title="Loop"
            >
              <Repeat size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="space-card border-2 border-black bg-white">
          <SectionHeading icon={ListMusic}>Queue</SectionHeading>
          {queue.length === 0 ? (
            <p className="p-4 text-center text-xs text-black/40">Queue is empty.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {queue.map((t, i) => (
                <QueueRow key={`${t.id}-${i}`} track={t} active={i === queueIndex} onClick={() => loadTrack(t, queue, true)} />
              ))}
            </div>
          )}
        </div>

        <div className="space-card border-2 border-black bg-white">
          <SectionHeading icon={History}>Recently played</SectionHeading>
          {history.length === 0 ? (
            <p className="flex items-center gap-1.5 p-4 text-center text-xs text-black/40">
              <Clock size={12} /> Nothing played yet this session.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {history.map((t, i) => (
                <QueueRow
                  key={`${t.id}-${i}`}
                  track={t}
                  active={currentTrack?.id === t.id}
                  onClick={() => loadTrack(t, queue.some((q) => q.id === t.id) ? queue : [t], true)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
