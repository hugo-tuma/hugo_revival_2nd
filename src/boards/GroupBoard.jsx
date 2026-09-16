import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserCheck, UserPlus, Users2 } from 'lucide-react';
import { useAuth } from '../components/auth/AuthGate';
import {
  useGroup,
  useGroupPosts,
  useIsGroupMember,
  usePostToGroup,
  useToggleGroupMembership,
} from '../hooks/useSpacesQueries';
import { initialsOf, timeAgo } from '../utils/format';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton, FeedSkeleton } from '../components/ui/Skeleton';

export default function GroupBoard() {
  const { groupId } = useParams();
  const { profile } = useAuth();
  const [draft, setDraft] = useState('');

  const { data: group, isLoading } = useGroup(groupId);
  const { data: isMember } = useIsGroupMember(groupId, profile.id);
  const toggleMembership = useToggleGroupMembership(groupId, profile.id);
  const { data: posts, isLoading: postsLoading } = useGroupPosts(groupId);
  const postToGroup = usePostToGroup(groupId, profile.id);

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4">
        <CardSkeleton height={300} />
      </div>
    );
  }

  if (!group) {
    return <div className="p-6 text-center text-xs text-black/50">Group not found.</div>;
  }

  const submit = () => {
    if (!draft.trim() || !isMember) return;
    postToGroup.mutate(draft.trim());
    setDraft('');
  };

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-4">
      <div className="space-card border-2 border-black bg-white">
        <SectionHeading icon={Users2}>{group.name}</SectionHeading>
        <div className="flex items-start gap-3 border-b-2 border-black p-3">
          <div className="min-w-0 flex-1">
            {group.description && <p className="text-xs text-black/70">{group.description}</p>}
            <p className="mt-1 text-[10px] text-black/40">
              {group.group_members?.[0]?.count ?? 1} member{(group.group_members?.[0]?.count ?? 1) === 1 ? '' : 's'} &middot;
              started by @{group.owner?.handle}
            </p>
          </div>
          {group.owner_id !== profile.id && (
            <button
              onClick={() => toggleMembership.mutate(Boolean(isMember))}
              disabled={toggleMembership.isPending}
              className={`flex shrink-0 items-center gap-1 border-2 border-black px-3 py-1.5 text-xs font-bold transition-colors ${
                isMember ? 'bg-black text-cream' : 'bg-spark hover:bg-black hover:text-cream'
              }`}
            >
              {isMember ? <UserCheck size={12} /> : <UserPlus size={12} />}
              {isMember ? 'Joined' : 'Join'}
            </button>
          )}
        </div>

        <div className="flex gap-1.5 border-b-2 border-black p-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isMember ? 'Post something...' : 'Join the group to post'}
            disabled={!isMember}
            maxLength={500}
            className="flex-1 border-2 border-black px-2 py-1 text-xs font-mono disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={!isMember || !draft.trim()}
            className="border-2 border-black bg-spark px-2 text-[10px] font-bold uppercase hover:bg-black hover:text-cream disabled:opacity-40"
          >
            Post
          </button>
        </div>

        {postsLoading ? (
          <FeedSkeleton />
        ) : (posts ?? []).length === 0 ? (
          <p className="p-6 text-center text-xs text-black/40">No posts yet.</p>
        ) : (
          <div>
            {posts.map((p) => (
              <div key={p.id} className="flex gap-3 border-b-2 border-black/10 px-3 py-3 last:border-b-0">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black text-[10px] font-bold"
                  style={{
                    backgroundColor: p.author?.color ?? '#111111',
                    color: p.author?.color === '#111111' || !p.author?.color ? '#FDFBF7' : '#111111',
                  }}
                >
                  {initialsOf(p.author?.display_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs font-bold">{p.author?.display_name}</span>
                    <span className="ml-auto text-[10px] text-black/40">{timeAgo(p.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-xs">{p.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
