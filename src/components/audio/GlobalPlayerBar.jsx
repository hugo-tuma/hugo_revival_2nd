import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, Repeat, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import WaveformPlayer from '../WaveformPlayer';
import { useAudioStore } from '../../stores/audioStore';
import { formatTime } from '../../utils/format';
import { updateMyListening } from '../../hooks/usePresence';

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

// Mounted exactly once at the App root (see App.jsx), outside the routed
// board content, so this is the one and only WaveSurfer instance for the
// session — navigating between Your Space / Artist Page / Customize never
// touches it, satisfying the "must not cut out or restart" requirement.
export default function GlobalPlayerBar() {
  const playerRef = useRef(null);
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isReady = useAudioStore((s) => s.isReady);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const volume = useAudioStore((s) => s.volume);
  const loop = useAudioStore((s) => s.loop);
  const queue = useAudioStore((s) => s.queue);
  const queueIndex = useAudioStore((s) => s.queueIndex);

  const setWavesurfer = useAudioStore((s) => s.setWavesurfer);
  const onReady = useAudioStore((s) => s._onReady);
  const onPlay = useAudioStore((s) => s._onPlay);
  const onPause = useAudioStore((s) => s._onPause);
  const onTimeUpdate = useAudioStore((s) => s._onTimeUpdate);
  const onFinish = useAudioStore((s) => s._onFinish);
  const toggle = useAudioStore((s) => s.toggle);
  const seekBy = useAudioStore((s) => s.seekBy);
  const seekToRatio = useAudioStore((s) => s.seekToRatio);
  const setVolume = useAudioStore((s) => s.setVolume);
  const toggleLoop = useAudioStore((s) => s.toggleLoop);
  const playNext = useAudioStore((s) => s.playNext);
  const playPrev = useAudioStore((s) => s.playPrev);

  const handleInstanceReady = useCallback(
    (ws) => {
      setWavesurfer(ws);
      ws.setVolume(useAudioStore.getState().volume);
    },
    [setWavesurfer]
  );

  useEffect(() => {
    function onKeyDown(e) {
      if (isTypingTarget(e.target)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowLeft') {
        seekBy(-5);
      } else if (e.code === 'ArrowRight') {
        seekBy(5);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle, seekBy]);

  useEffect(() => {
    updateMyListening(isPlaying ? currentTrack?.title ?? null : null);
  }, [isPlaying, currentTrack?.title]);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const hasNext = queueIndex >= 0 && queueIndex < queue.length - 1;
  const hasPrev = queueIndex > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-black bg-cream">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:gap-4 sm:px-4">
        <button
          onClick={playPrev}
          disabled={!hasPrev}
          className="hidden shrink-0 items-center justify-center border-2 border-black p-1.5 disabled:opacity-30 sm:flex"
          aria-label="Previous track"
        >
          <SkipBack size={14} />
        </button>

        <button
          onClick={toggle}
          disabled={!currentTrack}
          className="flex shrink-0 h-9 w-9 items-center justify-center border-2 border-black bg-black text-cream hover:bg-spark hover:text-black disabled:opacity-30 transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>

        <button
          onClick={playNext}
          disabled={!hasNext}
          className="hidden shrink-0 items-center justify-center border-2 border-black p-1.5 disabled:opacity-30 sm:flex"
          aria-label="Next track"
        >
          <SkipForward size={14} />
        </button>

        <div className="min-w-0 shrink-0 w-28 sm:w-40">
          {currentTrack ? (
            <Link to={`/space/${currentTrack.handle ?? ''}`} className="block truncate">
              <p className="truncate text-xs font-bold">{currentTrack.title}</p>
              <p className="truncate text-[10px] text-black/50">{currentTrack.artist_name ?? 'Unknown artist'}</p>
            </Link>
          ) : (
            <p className="text-xs text-black/40">Nothing playing</p>
          )}
        </div>

        <div className="hidden flex-1 items-center gap-2 sm:flex">
          <span className="w-9 shrink-0 text-right text-[10px] font-bold text-black/50">{formatTime(currentTime)}</span>
          <div
            className="relative flex-1 cursor-pointer"
            onClick={(e) => {
              if (!isReady) return;
              const rect = e.currentTarget.getBoundingClientRect();
              seekToRatio((e.clientX - rect.left) / rect.width);
            }}
          >
            <WaveformPlayer
              ref={playerRef}
              track={currentTrack}
              height={32}
              onInstanceReady={handleInstanceReady}
              onReady={onReady}
              onTimeUpdate={onTimeUpdate}
              onPlay={onPlay}
              onPause={onPause}
              onFinish={onFinish}
            />
          </div>
          <span className="w-9 shrink-0 text-[10px] font-bold text-black/50">{formatTime(duration)}</span>
        </div>

        <button
          onClick={toggleLoop}
          className={`hidden shrink-0 items-center justify-center border-2 border-black p-1.5 sm:flex ${
            loop ? 'bg-spark' : ''
          }`}
          aria-label="Toggle loop"
          title="Loop"
        >
          <Repeat size={14} />
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          <VolumeIcon size={14} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 accent-black"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
