import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { BadgeCheck, User, Users, X } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import { useArtists } from '../hooks/useRSpaceQueries';
import { generateBio } from '../lib/generateBio';

export default function ArtistsView() {
  const { data: artists, isLoading, isError, error } = useArtists();
  const [selected, setSelected] = useState(null);

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
            <button
              key={artist.id}
              onClick={() => setSelected(artist)}
              className="flex flex-col items-center gap-2 text-center hover:opacity-80"
            >
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
            </button>
          ))}
        </div>
      )}

      <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="animate-overlay-in fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content className="animate-dialog-in fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md border border-black bg-white">
            {selected && (
              <>
                <div className="flex items-center justify-between border-b border-black bg-black px-3 py-2 text-white">
                  <Dialog.Title className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider">
                    {selected.display_name}
                    {selected.is_verified && <BadgeCheck size={13} strokeWidth={1.75} />}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button aria-label="Close">
                      <X size={15} strokeWidth={1.5} />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-black"
                      style={{ backgroundColor: selected.color }}
                    >
                      {selected.avatar_url ? (
                        <img src={selected.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User size={22} strokeWidth={1.25} className="text-white/70" />
                      )}
                    </div>
                    <p className="font-mono text-xs text-neutral-400">@{selected.handle}</p>
                  </div>
                  <Dialog.Description className="font-sans text-sm leading-relaxed text-neutral-700">
                    {generateBio(selected)}
                  </Dialog.Description>
                  <p className="font-mono text-[10px] text-neutral-400">
                    Bio generated from this profile&rsquo;s real data &mdash; there&rsquo;s no free-text bio field
                    in the schema yet.
                  </p>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </RSpacePanel>
  );
}
