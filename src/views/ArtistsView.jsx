import { BadgeCheck, User, Users } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import { useArtists } from '../hooks/useRSpaceQueries';

export default function ArtistsView() {
  const { data: artists, isLoading, isError, error } = useArtists();

  return (
    <RSpacePanel title="Artists" icon={Users}>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState>Couldn&rsquo;t load artists: {error.message}</EmptyState>
      ) : artists.length === 0 ? (
        <EmptyState>No artists yet.</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {artists.map((artist) => (
            <div key={artist.id} className="flex flex-col items-center gap-2 text-center">
              <div
                className="flex aspect-square w-full items-center justify-center overflow-hidden border border-neutral-300 bg-neutral-50"
                style={{ backgroundColor: artist.color }}
              >
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <User size={28} strokeWidth={1.25} className="text-neutral-300" />
                )}
              </div>
              <p className="flex w-full items-center justify-center gap-1 truncate font-sans text-sm font-medium">
                <span className="truncate">{artist.display_name}</span>
                {artist.is_verified && <BadgeCheck size={13} strokeWidth={1.75} className="shrink-0" />}
              </p>
              <p className="w-full truncate font-sans text-xs text-neutral-400">@{artist.handle}</p>
            </div>
          ))}
        </div>
      )}
    </RSpacePanel>
  );
}
