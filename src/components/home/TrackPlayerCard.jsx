import { useEffect, useRef } from 'react';
import { Music2, Pause, Play } from 'lucide-react';
import { useTracks } from '../../hooks/useSpacesQueries';
import { useAudioStore } from '../../stores/audioStore';
import TrackUploadForm from '../audio/TrackUploadForm';
import SectionHeading from '../ui/SectionHeading';
import { CardSkeleton } from '../ui/Skeleton';
import { formatTime } from '../../utils/format';

// The visible "audio player" on a Space is really just a play trigger into
// the single persistent GlobalPlayerBar — its own waveform/scrubber render
// there, so this stays a lightweight card and playback never gets
// duplicated across two WaveSurfer instances.
export default function TrackPlayerCard({ profile, isOwner }) {
  const { data: tracks, isLoading } = useTracks(profile.id, { wip: false });
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const toggle = useAudioStore((s) => s.toggle);
  const playTrack = useAudioStore((s) => s.playTrack);
  const hasAutoplayed = useRef(false);

  const queue = (tracks ?? []).map((t) => ({ ...t, handle: profile.handle, artist_name: profile.display_name }));
  const latest = queue[0];
  const isThisLoaded = latest && currentTrack?.id === latest.id;

  useEffect(() => {
    if (hasAutoplayed.current) return;
    if (isOwner && profile.layout_config?.autoplay && latest && !currentTrack) {
      hasAutoplayed.current = true;
      playTrack(latest, queue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id]);

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading icon={Music2}>Now spinning</SectionHeading>
      <div className="p-3">
        {isLoading ? (
          <CardSkeleton height={64} />
        ) : !latest ? (
          <p className="text-xs text-black/40">{isOwner ? 'Upload your first track below.' : 'No tracks yet.'}</p>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => (isThisLoaded ? toggle() : playTrack(latest, queue))}
              className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-black text-cream transition-colors hover:bg-spark hover:text-black"
            >
              {isThisLoaded && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{latest.title}</p>
              <p className="text-[10px] text-black/50">
                {isThisLoaded ? `${formatTime(currentTime)} / ${formatTime(duration)}` : formatTime(latest.duration)}
              </p>
            </div>
          </div>
        )}
      </div>
      {isOwner && (
        <div className="border-t-2 border-black p-3">
          <TrackUploadForm userId={profile.id} isWip={false} />
        </div>
      )}
    </div>
  );
}
