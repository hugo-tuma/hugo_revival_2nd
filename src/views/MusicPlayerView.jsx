import { Disc, ListMusic, Music } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';

export default function MusicPlayerView() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <RSpacePanel title="Now Playing" icon={Disc}>
        <div className="mx-auto flex max-w-xs flex-col items-center gap-4 py-4">
          <div className="flex aspect-square w-full items-center justify-center border border-black bg-neutral-50">
            <Music size={40} strokeWidth={1.25} className="text-neutral-300" />
          </div>
          <div className="w-full text-center">
            <p className="font-sans text-sm font-semibold text-neutral-400">&mdash;</p>
            <p className="font-sans text-xs text-neutral-400">&mdash;</p>
          </div>
          <div className="dashed-track h-[2px] w-full" />
        </div>
      </RSpacePanel>

      <div className="flex flex-col gap-4">
        <RSpacePanel title="Queue" icon={ListMusic}>
          <EmptyState>Queue is empty.</EmptyState>
        </RSpacePanel>
        <RSpacePanel title="Recently Played" icon={ListMusic}>
          <EmptyState>Nothing played yet.</EmptyState>
        </RSpacePanel>
      </div>
    </div>
  );
}
