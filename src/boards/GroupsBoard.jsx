import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users2 } from 'lucide-react';
import { useAuth } from '../components/auth/AuthGate';
import { useCreateGroup, useGroups } from '../hooks/useSpacesQueries';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function GroupsBoard() {
  const { profile } = useAuth();
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup(profile.id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createGroup.mutate(
      { name: name.trim(), description: description.trim() },
      { onSuccess: () => { setName(''); setDescription(''); setShowForm(false); } }
    );
  };

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-4">
      <div className="space-card border-2 border-black bg-white">
        <SectionHeading
          icon={Users2}
          right={
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1 text-cream/80 hover:text-cream"
            >
              <Plus size={14} /> New group
            </button>
          }
        >
          Groups
        </SectionHeading>

        {showForm && (
          <form onSubmit={submit} className="flex flex-col gap-2 border-b-2 border-black p-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              maxLength={60}
              className="border-2 border-black px-2 py-1.5 text-sm font-mono"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's it about?"
              maxLength={280}
              rows={2}
              className="resize-none border-2 border-black px-2 py-1.5 text-xs font-mono"
            />
            <button
              type="submit"
              disabled={!name.trim() || createGroup.isPending}
              className="border-2 border-black bg-spark px-3 py-1.5 text-xs font-bold uppercase hover:bg-black hover:text-cream disabled:opacity-40"
            >
              Create
            </button>
          </form>
        )}

        {isLoading ? (
          <div className="p-3">
            <CardSkeleton height={160} />
          </div>
        ) : (groups ?? []).length === 0 ? (
          <p className="p-6 text-center text-xs text-black/40">No groups yet — start one.</p>
        ) : (
          <div className="divide-y-2 divide-black/10">
            {groups.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`} className="flex items-start gap-3 px-3 py-3 hover:bg-black/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-black text-cream">
                  <Users2 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{g.name}</p>
                  {g.description && <p className="truncate text-xs text-black/60">{g.description}</p>}
                  <p className="text-[10px] text-black/40">
                    {g.group_members?.[0]?.count ?? 1} member{(g.group_members?.[0]?.count ?? 1) === 1 ? '' : 's'} &middot; started
                    by @{g.owner?.handle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
