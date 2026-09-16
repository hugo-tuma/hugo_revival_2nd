import { useEffect, useRef, useState } from 'react';
import { ListPlus } from 'lucide-react';
import { useAddToPlaylist, usePlaylists } from '../../hooks/useSpacesQueries';

export default function AddToPlaylistMenu({ userId, trackId }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { data: playlists = [] } = usePlaylists(userId);
  const addToPlaylist = useAddToPlaylist();

  useEffect(() => {
    if (!open) return undefined;
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black hover:bg-black/5"
        aria-label="Add to playlist"
        title="Add to playlist"
      >
        <ListPlus size={13} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 border-2 border-black bg-cream shadow-[3px_3px_0_0_#111111]">
          <p className="border-b-2 border-black bg-black px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-cream">
            Add to playlist
          </p>
          {playlists.length === 0 ? (
            <p className="px-2.5 py-2 text-[10px] text-black/40">No playlists yet — make one in Library.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    addToPlaylist.mutate({ playlistId: p.id, trackId });
                    setOpen(false);
                  }}
                  className="block w-full truncate px-2.5 py-1.5 text-left text-xs font-bold hover:bg-black/5"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
