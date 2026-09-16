import { User, Users } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';

const PLACEHOLDER_ARTISTS = Array.from({ length: 8 }, (_, i) => ({
  id: `artist-${i + 1}`,
  name: `Artist ${i + 1}`,
  handle: `artist${i + 1}`,
}));

export default function ArtistsView() {
  return (
    <RSpacePanel title="Artists" icon={Users}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {PLACEHOLDER_ARTISTS.map((artist) => (
          <div key={artist.id} className="flex flex-col items-center gap-2 text-center">
            <div className="flex aspect-square w-full items-center justify-center border border-neutral-300 bg-neutral-50">
              <User size={28} strokeWidth={1.25} className="text-neutral-300" />
            </div>
            <p className="w-full truncate font-sans text-sm font-medium">{artist.name}</p>
            <p className="w-full truncate font-sans text-xs text-neutral-400">@{artist.handle}</p>
          </div>
        ))}
      </div>
    </RSpacePanel>
  );
}
