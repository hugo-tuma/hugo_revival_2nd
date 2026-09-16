import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import { Pin } from 'lucide-react';
import WaveformSkeleton from './ui/WaveformSkeleton';

function buildPinElement(note) {
  const el = document.createElement('div');
  el.className = 'w-3 h-3 -mt-2 bg-spark border-2 border-black cursor-pointer relative z-10';
  el.title = `${note.author?.display_name ?? 'Someone'} @ ${Math.round(note.timestamp_sec)}s: ${note.content}`;
  return el;
}

/**
 * Real wavesurfer.js v7 wrapper (Web Audio decoding, not a fake bar
 * generator). Renders precomputed peaks instantly if `track.waveform_data`
 * is present (from TrackUploadForm's client-side analysis), then continues
 * decoding the actual audio in the background for playback and scrubbing.
 * Exposes an imperative handle so both <GlobalPlayerBar/> (persistent
 * playback) and <WipStemPlayer/> (pinned producer notes via the Regions
 * plugin) can drive one underlying instance without duplicating the
 * WaveSurfer lifecycle.
 */
const WaveformPlayer = forwardRef(function WaveformPlayer(
  {
    track,
    height = 56,
    waveColor = '#111111',
    progressColor = 'var(--accent, #FF4F00)',
    cursorColor = '#111111',
    notes = null,
    onNoteClick,
    onInstanceReady,
    onReady,
    onTimeUpdate,
    onPlay,
    onPause,
    onFinish,
  },
  ref
) {
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const regionsRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Instance lifecycle: created once per mount, destroyed on unmount.
  useEffect(() => {
    if (!containerRef.current) return undefined;

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor,
      progressColor,
      cursorColor,
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 0,
      normalize: true,
      dragToSeek: true,
      plugins: [regions],
    });
    wsRef.current = ws;
    onInstanceReady?.(ws);

    ws.on('ready', (duration) => {
      setIsReady(true);
      setLoadError(null);
      onReady?.(duration);
    });
    ws.on('timeupdate', (t) => onTimeUpdate?.(t));
    ws.on('play', () => onPlay?.());
    ws.on('pause', () => onPause?.());
    ws.on('finish', () => onFinish?.());
    ws.on('error', (err) => setLoadError(String(err?.message || err)));

    if (notes) {
      regions.on('region-clicked', (region, e) => {
        e.stopPropagation();
        region.play();
        const note = notes.find((n) => n.id === region.id);
        if (note) onNoteClick?.(note);
      });
    }

    return () => {
      ws.destroy();
      wsRef.current = null;
      regionsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load whenever the track identity changes.
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !track?.audio_url) return;
    setIsReady(false);
    setLoadError(null);
    const peaks = Array.isArray(track.waveform_data) ? [track.waveform_data] : undefined;
    ws.load(track.audio_url, peaks, track.duration || undefined).catch((err) => {
      if (err?.name !== 'AbortError') setLoadError(String(err?.message || err));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, track?.audio_url]);

  // Keep pinned note markers in sync.
  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions || !notes) return;
    regions.clearRegions();
    for (const note of notes) {
      regions.addRegion({
        id: note.id,
        start: note.timestamp_sec,
        end: note.timestamp_sec,
        drag: false,
        resize: false,
        color: 'transparent',
        content: buildPinElement(note),
      });
    }
  }, [notes]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => wsRef.current?.play(),
      pause: () => wsRef.current?.pause(),
      playPause: () => wsRef.current?.playPause(),
      seekToRatio: (r) => wsRef.current?.seekTo(Math.min(1, Math.max(0, r))),
      seekToSeconds: (s) => {
        const d = wsRef.current?.getDuration();
        if (d) wsRef.current.seekTo(s / d);
      },
      setVolume: (v) => wsRef.current?.setVolume(v),
      getCurrentTime: () => wsRef.current?.getCurrentTime() ?? 0,
      getDuration: () => wsRef.current?.getDuration() ?? 0,
      getWaveSurfer: () => wsRef.current,
    }),
    []
  );

  return (
    <div className="relative">
      <div ref={containerRef} className={isReady ? '' : 'invisible h-0 overflow-hidden'} />
      {!isReady && !loadError && <WaveformSkeleton height={height} />}
      {loadError && (
        <div
          style={{ height }}
          className="flex items-center justify-center border-2 border-dashed border-black/30 text-[10px] font-bold uppercase text-black/40"
        >
          Waveform unavailable
        </div>
      )}
      {notes && notes.length > 0 && isReady && (
        <p className="mt-1 flex items-center gap-1 text-[9px] text-black/40">
          <Pin size={9} /> {notes.length} pinned note{notes.length === 1 ? '' : 's'} on the timeline
        </p>
      )}
    </div>
  );
});

export default WaveformPlayer;
