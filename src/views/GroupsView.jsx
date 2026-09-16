import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, Layers, LogOut, Plus, Send, Users, X } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import AccountGateDialog from '../components/AccountGateDialog';
import { useGroupPosts, useGroups } from '../hooks/useRSpaceQueries';
import useJoinedGroups from '../hooks/useJoinedGroups';
import { timeAgo } from '../lib/format';

function Chatroom({ group, onBack, onLeave }) {
  const { data: posts, isLoading, isError, error } = useGroupPosts(group.id);
  const [draft, setDraft] = useState('');

  return (
    <>
      <div className="flex items-center gap-2 border-b border-black bg-black px-3 py-1.5 text-white">
        <button onClick={onBack} className="flex h-6 w-6 items-center justify-center hover:bg-white/10" aria-label="Back to groups">
          <ArrowLeft size={14} strokeWidth={1.75} />
        </button>
        <Layers size={14} strokeWidth={1.75} />
        <span className="flex-1 truncate font-mono text-xs uppercase tracking-wider">{group.name}</span>
        <button
          onClick={onLeave}
          className="flex items-center gap-1 border border-white px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide hover:bg-white hover:text-black"
        >
          <LogOut size={11} strokeWidth={1.75} /> Leave
        </button>
      </div>
      <div className="flex h-96 flex-col p-4">
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-2/3" />
              ))}
            </div>
          ) : isError ? (
            <EmptyState>Couldn&rsquo;t load chat: {error.message}</EmptyState>
          ) : posts.length === 0 ? (
            <EmptyState>No messages yet &mdash; be the first once sign-in is live.</EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map((p) => (
                <div key={p.id} className="flex items-start gap-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center border border-black font-mono text-[10px] font-bold text-white"
                    style={{ backgroundColor: p.author?.color ?? '#111111' }}
                  >
                    {p.author?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2">
                      <span className="font-sans text-xs font-semibold">{p.author?.display_name}</span>
                      <span className="font-mono text-[10px] text-neutral-400">{timeAgo(p.created_at)}</span>
                    </p>
                    <p className="break-words font-sans text-sm text-neutral-700">{p.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AccountGateDialog
          trigger={
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-3 flex items-center gap-2 border border-black px-2 py-1.5"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${group.name}…`}
                className="w-full bg-transparent font-sans text-sm outline-none placeholder:text-neutral-400"
              />
              <button
                type="submit"
                className="flex h-6 w-6 shrink-0 items-center justify-center text-black hover:bg-neutral-100"
                aria-label="Send"
              >
                <Send size={14} strokeWidth={1.5} />
              </button>
            </form>
          }
          title="Coming soon"
        >
          This feature will be added soon.
        </AccountGateDialog>
      </div>
    </>
  );
}

export default function GroupsView() {
  const { data: groups, isLoading, isError, error } = useGroups();
  const { joined, join, leave, isJoined } = useJoinedGroups();
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [openChatGroupId, setOpenChatGroupId] = useState(null);

  const openChatGroup = groups?.find((g) => g.id === openChatGroupId);
  const joinedGroups = groups?.filter((g) => joined.has(g.id)) ?? [];

  if (openChatGroup) {
    return (
      <div className="border border-black bg-white">
        <Chatroom
          group={openChatGroup}
          onBack={() => setOpenChatGroupId(null)}
          onLeave={() => {
            leave(openChatGroup.id);
            setOpenChatGroupId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {joinedGroups.length > 0 && (
        <RSpacePanel title="Joined groups" icon={Users}>
          <div className="flex flex-col divide-y divide-neutral-200">
            {joinedGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => setOpenChatGroupId(g.id)}
                className="flex items-center gap-3 py-2.5 text-left first:pt-0 last:pb-0 hover:bg-neutral-50"
              >
                <Layers size={15} strokeWidth={1.5} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate font-sans text-sm font-medium">{g.name}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                  Open chat
                </span>
              </button>
            ))}
          </div>
        </RSpacePanel>
      )}

      <RSpacePanel
        title="Groups"
        icon={Layers}
        right={
          <Dialog.Root open={newGroupOpen} onOpenChange={setNewGroupOpen}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-1 border border-white px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide hover:bg-white hover:text-black">
                <Plus size={12} strokeWidth={1.75} /> New group
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="animate-overlay-in fixed inset-0 z-40 bg-black/40" />
              <Dialog.Content className="animate-dialog-in fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm border border-black bg-white">
                <div className="flex items-center justify-between border-b border-black bg-black px-3 py-2 text-white">
                  <Dialog.Title className="font-mono text-xs uppercase tracking-wider">Coming soon</Dialog.Title>
                  <Dialog.Close asChild>
                    <button aria-label="Close">
                      <X size={15} strokeWidth={1.5} />
                    </button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="p-4 font-sans text-xs text-neutral-600">
                  This feature will be added soon.
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
                <button
                  onClick={() => {
                    if (!isJoined(g.id)) join(g.id);
                    setOpenChatGroupId(g.id);
                  }}
                  className="shrink-0 border border-black px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide hover:bg-black hover:text-white"
                >
                  {isJoined(g.id) ? 'Open chat' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        )}
      </RSpacePanel>
    </div>
  );
}
