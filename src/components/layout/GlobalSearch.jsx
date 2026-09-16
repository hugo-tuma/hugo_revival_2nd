import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useGlobalSearch } from '../../hooks/useSpacesQueries';
import { initialsOf } from '../../utils/format';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useGlobalSearch(debounced);
  const tracks = data?.tracks ?? [];
  const profiles = data?.profiles ?? [];
  const hasResults = tracks.length > 0 || profiles.length > 0;

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function goToProfile(handle) {
    if (!handle) return;
    navigate(`/space/${handle}`);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 max-w-xs">
      <div className="flex items-center gap-1.5 border-2 border-black bg-white px-2 py-1.5">
        <Search size={13} className="shrink-0 text-black/50" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.trim().length > 1 && setOpen(true)}
          placeholder="Search tracks, artists, users"
          className="w-full min-w-0 bg-transparent font-mono text-xs outline-none placeholder:text-black/40"
        />
      </div>

      {open && debounced.trim().length > 1 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto border-2 border-black bg-cream shadow-[3px_3px_0_0_#111111]">
          {isFetching && (
            <p className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-black/40">Searching...</p>
          )}

          {!isFetching && !hasResults && (
            <p className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-black/40">No results</p>
          )}

          {tracks.length > 0 && (
            <div>
              <p className="border-b-2 border-black bg-black/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-black/50">
                Tracks
              </p>
              <div className="divide-y-2 divide-black/10">
                {tracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => goToProfile(t.artist?.handle)}
                    className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-black/5"
                  >
                    <span className="truncate font-bold">{t.title}</span>
                    <span className="shrink-0 text-[10px] text-black/50">{t.artist?.display_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {profiles.length > 0 && (
            <div>
              <p className="border-b-2 border-t-2 border-black bg-black/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-black/50">
                Profiles
              </p>
              <div className="divide-y-2 divide-black/10">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => goToProfile(p.handle)}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-black/5"
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center border border-black text-[8px] font-black"
                      style={{ backgroundColor: p.color, color: p.color === '#111111' ? '#FDFBF7' : '#111111' }}
                    >
                      {initialsOf(p.display_name)}
                    </span>
                    <span className="truncate font-bold">{p.display_name}</span>
                    <span className="shrink-0 text-black/40">@{p.handle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
