import { useMemo, useState } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { usePostWallComment, useWallComments } from '../../hooks/useSpacesQueries';
import { usePresenceStore } from '../../stores/presenceStore';
import { initialsOf, timeAgo } from '../../utils/format';
import SectionHeading from '../ui/SectionHeading';
import { FeedSkeleton } from '../ui/Skeleton';

export default function RightRail({ targetProfile, viewerId, wallVisible }) {
  const [draft, setDraft] = useState('');
  const online = usePresenceStore((s) => s.online);
  const onlineList = useMemo(() => Object.values(online), [online]);
  const { data: comments, isLoading } = useWallComments(targetProfile.id);
  const postComment = usePostWallComment(targetProfile.id, viewerId);

  const submit = () => {
    if (!draft.trim()) return;
    postComment.mutate(draft.trim());
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-card border-2 border-black bg-white">
        <SectionHeading icon={Users}>Online now ({onlineList.length})</SectionHeading>
        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto p-2">
          {onlineList.length === 0 && <p className="p-2 text-xs text-black/40">Nobody&rsquo;s around right now.</p>}
          {onlineList.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-blink-dot rounded-full bg-green-400" />
              </span>
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black text-[9px] font-bold"
                style={{ backgroundColor: p.color, color: p.color === '#111111' ? '#FDFBF7' : '#111111' }}
              >
                {initialsOf(p.display_name)}
              </div>
              <span className="truncate text-xs font-semibold">{p.display_name}</span>
              {p.listening_to && (
                <span className="ml-auto truncate text-[9px] text-black/40">♪ {p.listening_to}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {wallVisible && (
        <div className="space-card border-2 border-black bg-white">
          <SectionHeading icon={MessageCircle}>Wall</SectionHeading>
          <div className="flex gap-1 p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Leave a comment..."
              maxLength={1000}
              className="min-w-0 flex-1 border-2 border-black px-2 py-1 text-xs font-mono"
            />
            <button
              onClick={submit}
              className="space-btn shrink-0 border-2 border-black bg-black px-2 text-cream transition-colors hover:bg-spark hover:text-black"
              aria-label="Post comment"
            >
              <Send size={13} />
            </button>
          </div>
          {isLoading ? (
            <FeedSkeleton rows={2} />
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {(comments ?? []).length === 0 && <p className="p-3 text-xs text-black/40">No comments yet.</p>}
              {(comments ?? []).map((c) => (
                <div key={c.id} className="border-t-2 border-black/10 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{c.author?.display_name}</span>
                    <span className="text-[10px] text-black/40">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-xs">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
