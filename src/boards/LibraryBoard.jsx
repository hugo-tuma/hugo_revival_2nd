import { useState } from 'react';
import { Heart, ListMusic, Music2, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../components/auth/AuthGate';
import {
  useCreatePlaylist,
  useDeletePlaylist,
  useLikedTracks,
  usePlaylists,
  usePlaylistTracks,
  useRemoveFromPlaylist,
} from '../hooks/useSpacesQueries';
import { useAudioStore } from '../stores/audioStore';
import { formatTime } from '../utils/format';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton } from '../components/ui/Skeleton';

function normalizeTrack(track) {
  return { ...track, handle: track.profiles?.handle, artist_name: track.profiles?.display_name };
}

function TrackRow({ track, queue, onRemove }) {
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const toggle = useAudioStore((s) => s.toggle);
  const playTrack = useAudioStore((s) => s.playTrack);
  const isThisLoaded = currentTrack?.id === track.id;

  return (
    <div className="flex items-center gap-3 border-b-2 border-black/10 px-3 py-2 last:border-b-0">
      <button
        onClick={() => (isThisLoaded ? toggle() : playTrack(track, queue))}
        className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-black text-cream hover:bg-spark hover:text-black"
      >
        {isThisLoaded && isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold">{track.title}</p>
        <p className="truncate text-[10px] text-black/50">{track.artist_name ?? 'Unknown artist'}</p>
      </div>
      <span className="shrink-0 text-[10px] text-black/40">{formatTime(track.duration)}</span>
      {onRemove && (
        <button onClick={onRemove} className="shrink-0 text-black/30 hover:text-red-600" aria-label="Remove from playlist">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

export default function LibraryBoard() {
  const { profile } = useAuth();
  const [selected, setSelected] = useState('liked');
  const [newName, setNewName] = useState('');

  const { data: playlists, isLoading: playlistsLoading } = usePlaylists(profile.id);
  const { data: likedRows, isLoading: likedLoading } = useLikedTracks(profile.id);
  const { data: playlistRows, isLoading: tracksLoading } = usePlaylistTracks(selected !== 'liked' ? selected : null);
  const createPlaylist = useCreatePlaylist(profile.id);
  const deletePlaylist = useDeletePlaylist(profile.id);
  const removeFromPlaylist = useRemoveFromPlaylist(selected !== 'liked' ? selected : null);

  const likedTracks = (likedRows ?? []).map((r) => normalizeTrack(r.track));
  const selectedTracks = (playlistRows ?? []).map((r) => normalizeTrack(r.track));
  const selectedPlaylist = (playlists ?? []).find((p) => p.id === selected);

  const submitCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createPlaylist.mutate(newName.trim());
    setNewName('');
  };

  return (
    <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-[280px_1fr]">
      <div className="space-card border-2 border-black bg-white">
        <SectionHeading icon={ListMusic}>Your library</SectionHeading>
        <div className="flex flex-col">
          <button
            onClick={() => setSelected('liked')}
            className={`flex items-center gap-2 border-b-2 border-black/10 px-3 py-2.5 text-left text-xs font-bold hover:bg-black/5 ${
              selected === 'liked' ? 'bg-spark' : ''
            }`}
          >
            <Heart size={13} /> Liked Songs
            <span className="ml-auto text-[10px] text-black/50">{likedTracks.length}</span>
          </button>

          {playlistsLoading ? (
            <div className="p-3">
              <CardSkeleton height={100} />
            </div>
          ) : (
            (playlists ?? []).map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`flex items-center gap-2 border-b-2 border-black/10 px-3 py-2.5 text-left text-xs font-bold last:border-b-0 hover:bg-black/5 ${
                  selected === p.id ? 'bg-spark' : ''
                }`}
              >
                <Music2 size={13} />
                <span className="truncate">{p.name}</span>
                <span className="ml-auto shrink-0 text-[10px] text-black/50">{p.playlist_tracks?.[0]?.count ?? 0}</span>
              </button>
            ))
          )}
        </div>

        <form onSubmit={submitCreate} className="flex gap-1.5 border-t-2 border-black p-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New playlist name"
            maxLength={60}
            className="flex-1 border-2 border-black px-2 py-1 text-xs font-mono"
          />
          <button
            type="submit"
            className="flex items-center justify-center border-2 border-black bg-spark px-2 hover:bg-black hover:text-cream"
            aria-label="Create playlist"
          >
            <Plus size={13} />
          </button>
        </form>
      </div>

      <div className="space-card border-2 border-black bg-white">
        <SectionHeading
          icon={selected === 'liked' ? Heart : Music2}
          right={
            selected !== 'liked' && selectedPlaylist ? (
              <button
                onClick={() => {
                  deletePlaylist.mutate(selected);
                  setSelected('liked');
                }}
                className="text-cream/70 hover:text-red-400"
                aria-label="Delete playlist"
              >
                <Trash2 size={13} />
              </button>
            ) : null
          }
        >
          {selected === 'liked' ? 'Liked Songs' : selectedPlaylist?.name ?? 'Playlist'}
        </SectionHeading>

        {selected === 'liked' ? (
          likedLoading ? (
            <CardSkeleton height={200} />
          ) : likedTracks.length === 0 ? (
            <p className="p-6 text-center text-xs text-black/40">
              No liked songs yet — heart a track on any profile to save it here.
            </p>
          ) : (
            likedTracks.map((t) => <TrackRow key={t.id} track={t} queue={likedTracks} />)
          )
        ) : tracksLoading ? (
          <CardSkeleton height={200} />
        ) : selectedTracks.length === 0 ? (
          <p className="p-6 text-center text-xs text-black/40">
            Empty playlist — add tracks from any artist&rsquo;s profile.
          </p>
        ) : (
          selectedTracks.map((t) => (
            <TrackRow key={t.id} track={t} queue={selectedTracks} onRemove={() => removeFromPlaylist.mutate(t.id)} />
          ))
        )}
      </div>
    </div>
  );
}
