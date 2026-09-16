import { Link } from 'react-router-dom';
import { Mic2 } from 'lucide-react';
import { useAllArtists } from '../hooks/useSpacesQueries';
import { initialsOf } from '../utils/format';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function ArtistsBoard() {
  const { data: artists, isLoading } = useAllArtists();

  return (
    <div className="p-3 sm:p-4">
      <div className="space-card border-2 border-black bg-white">
        <SectionHeading icon={Mic2}>Artists</SectionHeading>
        <div className="p-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} height={120} />
              ))}
            </div>
          ) : (artists ?? []).length === 0 ? (
            <p className="p-4 text-center text-xs text-black/40">No artists yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {artists.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/space/${artist.handle}`}
                  className="flex flex-col items-center gap-2 border-2 border-black p-3 text-center hover:bg-black/5"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center border-2 border-black text-lg font-black"
                    style={{ backgroundColor: artist.color, color: artist.color === '#111111' ? '#FDFBF7' : '#111111' }}
                  >
                    {initialsOf(artist.display_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{artist.display_name}</p>
                    <p className="truncate text-[10px] text-black/50">@{artist.handle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
