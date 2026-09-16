import * as Slider from '@radix-ui/react-slider';
import { Pause, Play, Repeat, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatDuration } from '../../lib/format';

const ICON_BUTTON =
  'flex h-8 w-8 items-center justify-center border border-transparent text-black hover:border-black hover:bg-neutral-100 disabled:opacity-30 disabled:hover:border-transparent disabled:hover:bg-transparent';

export default function BottomTransportBar({
  nowPlaying,
  isPlaying,
  onTogglePlay,
  currentTime = 0,
  duration = 0,
  onSeek,
  repeat,
  onToggleRepeat,
  volume,
  onVolumeChange,
}) {
  return (
    <footer className="flex h-16 shrink-0 items-center gap-4 border-t border-black bg-white px-3 sm:px-4">
      <div className="flex shrink-0 items-center gap-3">
        <button className={ICON_BUTTON} disabled aria-label="Previous track">
          <SkipBack size={17} strokeWidth={1.5} />
        </button>
        <button
          onClick={onTogglePlay}
          disabled={!nowPlaying}
          className="flex h-9 w-9 items-center justify-center border border-black text-black hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}
        </button>
        <button className={ICON_BUTTON} disabled aria-label="Next track">
          <SkipForward size={17} strokeWidth={1.5} />
        </button>

        <div className="hidden max-w-[10rem] flex-col leading-tight sm:flex">
          <span className="truncate font-sans text-xs text-neutral-700">
            {nowPlaying ? nowPlaying.title : 'Nothing playing'}
          </span>
          <span className="truncate font-mono text-[11px] text-neutral-400">
            {nowPlaying ? `${nowPlaying.artistName} · ` : ''}
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
        </div>
      </div>

      <Slider.Root
        value={[currentTime]}
        max={duration || 100}
        step={0.1}
        disabled={!nowPlaying}
        onValueChange={([v]) => onSeek?.(v)}
        className="relative flex h-4 w-full flex-1 touch-none select-none items-center"
      >
        <Slider.Track
          className={cn('relative h-[2px] w-full grow', nowPlaying ? 'bg-neutral-300' : 'dashed-track bg-transparent')}
        >
          <Slider.Range className={cn('absolute h-full', nowPlaying ? 'bg-black' : 'bg-transparent')} />
        </Slider.Track>
        <Slider.Thumb className="block h-2.5 w-2.5 border border-black bg-white" aria-label="Playback position" />
      </Slider.Root>

      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onToggleRepeat}
          className={cn(
            'flex h-8 w-8 items-center justify-center border',
            repeat ? 'border-black bg-black text-white' : 'border-transparent text-black hover:border-black hover:bg-neutral-100'
          )}
          aria-pressed={repeat}
          aria-label="Toggle repeat"
        >
          <Repeat size={16} strokeWidth={1.5} />
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <Volume2 size={16} strokeWidth={1.5} className="shrink-0 text-black" />
          <Slider.Root
            value={[volume]}
            onValueChange={([v]) => onVolumeChange(v)}
            max={100}
            step={1}
            className="relative flex h-4 w-24 touch-none select-none items-center"
          >
            <Slider.Track className="relative h-[2px] w-full grow bg-neutral-300">
              <Slider.Range className="absolute h-full bg-black" />
            </Slider.Track>
            <Slider.Thumb className="block h-2.5 w-2.5 border border-black bg-white" aria-label="Volume" />
          </Slider.Root>
        </div>
      </div>
    </footer>
  );
}
