import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Layers, Plus, X } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';

export default function GroupsView() {
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const createGroup = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setGroups((g) => [...g, { id: `${Date.now()}`, name: trimmed }]);
    setName('');
    setOpen(false);
  };

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
              <Dialog.Description className="sr-only">Create a new group by naming it.</Dialog.Description>
              <div className="flex flex-col gap-3 p-4">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                  placeholder="Group name"
                  className="border border-black px-2.5 py-1.5 text-sm outline-none"
                />
                <button
                  onClick={createGroup}
                  className="border border-black bg-black py-1.5 text-xs font-semibold uppercase text-white hover:bg-neutral-800"
                >
                  Create
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      }
    >
      {groups.length === 0 ? (
        <EmptyState>No groups yet &mdash; start one.</EmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-200">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Layers size={16} strokeWidth={1.5} />
              <span className="font-sans text-sm">{g.name}</span>
            </div>
          ))}
        </div>
      )}
    </RSpacePanel>
  );
}
