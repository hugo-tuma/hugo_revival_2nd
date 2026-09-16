import { useState } from 'react';
import { Heart, Library as LibraryIcon, ListMusic, Plus } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';

export default function LibraryView() {
  const [playlistName, setPlaylistName] = useState('');
  const [playlists, setPlaylists] = useState([]);

  const addPlaylist = () => {
    const name = playlistName.trim();
    if (!name) return;
    setPlaylists((p) => [...p, { id: `${Date.now()}`, name }]);
    setPlaylistName('');
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <RSpacePanel title="Your Library" icon={LibraryIcon} bodyClassName="p-0">
        <button className="flex w-full items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-left text-white">
          <Heart size={18} strokeWidth={1.75} fill="white" />
          <span className="flex-1 font-sans text-sm font-semibold">Liked Songs</span>
          <span className="font-mono text-xs">0</span>
        </button>

        {playlists.length > 0 && (
          <div className="flex flex-col divide-y divide-neutral-200">
            {playlists.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <ListMusic size={16} strokeWidth={1.5} className="shrink-0 text-black" />
                <span className="flex-1 truncate font-sans text-sm">{p.name}</span>
                <span className="font-mono text-xs text-neutral-400">0</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 border-t border-neutral-200 p-3">
          <input
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlaylist()}
            placeholder="new playlist name"
            className="min-w-0 flex-1 border border-black px-2 py-1.5 text-sm outline-none"
          />
          <button
            onClick={addPlaylist}
            className="flex shrink-0 items-center gap-1 border border-black px-2.5 py-1.5 text-xs font-semibold uppercase hover:bg-black hover:text-white"
          >
            <Plus size={13} strokeWidth={1.75} /> Add
          </button>
        </div>
      </RSpacePanel>

      <RSpacePanel title="Liked Songs" icon={Heart}>
        <EmptyState>No liked songs yet.</EmptyState>
      </RSpacePanel>
    </div>
  );
}
