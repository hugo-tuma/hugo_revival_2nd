import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Layers, Plus, Users, X } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import { useGroups } from '../hooks/useRSpaceQueries';

export default function GroupsView() {
  const { data: groups, isLoading, isError, error } = useGroups();
  const [open, setOpen] = useState(false);

  return (
    <RSpacePanel
      title="Groups"
      icon={Layers}
      right={
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-1 border border-white px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide hover:bg-white hover:text-black">
              <Plus size={12} strokeWidth={1.75} /> New group
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="animate-overlay-in fixed inset-0 z-40 bg-black/40" />
            <Dialog.Content className="animate-dialog-in fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm border border-black bg-white">
              <div className="flex items-center justify-between border-b border-black bg-black px-3 py-2 text-white">
                <Dialog.Title className="font-mono text-xs uppercase tracking-wider">New group</Dialog.Title>
                <Dialog.Close asChild>
                  <button aria-label="Close">
                    <X size={15} strokeWidth={1.5} />
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="p-4 font-sans text-xs text-neutral-600">
                This is a public, sign-in-free preview of R&rsquo;SPACE, so there&rsquo;s no account to own a new
                group with yet. Creating a group is wired up on the backend (Row Level Security ties every group
                to its creator) &mdash; it just needs a real signed-in account to attach it to.
              </Dialog.Description>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState>Couldn&rsquo;t load groups: {error.message}</EmptyState>
      ) : groups.length === 0 ? (
        <EmptyState>No groups yet &mdash; start one.</EmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-200">
          {groups.map((g) => (
            <div key={g.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <Layers size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm font-medium">{g.name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{g.description}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                  <Users size={11} strokeWidth={1.5} /> {g.member_count} member{g.member_count === 1 ? '' : 's'}
                  {g.owner && <> &middot; started by {g.owner.display_name}</>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </RSpacePanel>
  );
}
