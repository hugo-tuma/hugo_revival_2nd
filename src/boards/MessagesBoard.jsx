import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../components/auth/AuthGate';
import { useConversations } from '../hooks/useSpacesQueries';
import { initialsOf, timeAgo } from '../utils/format';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function MessagesBoard() {
  const { profile } = useAuth();
  const { data: conversations, isLoading } = useConversations(profile.id);

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-4">
      <div className="space-card border-2 border-black bg-white">
        <SectionHeading icon={MessageCircle}>Messages</SectionHeading>
        {isLoading ? (
          <div className="p-3">
            <CardSkeleton height={200} />
          </div>
        ) : (conversations ?? []).length === 0 ? (
          <p className="p-6 text-center text-xs text-black/40">
            No conversations yet — message someone from their profile.
          </p>
        ) : (
          <div className="divide-y-2 divide-black/10">
            {conversations.map((c) => (
              <Link key={c.id} to={`/messages/${c.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-black/5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black text-xs font-black"
                  style={{
                    backgroundColor: c.other?.color ?? '#111111',
                    color: c.other?.color === '#111111' || !c.other?.color ? '#FDFBF7' : '#111111',
                  }}
                >
                  {initialsOf(c.other?.display_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{c.other?.display_name ?? 'Unknown'}</p>
                  <p className="truncate text-xs text-black/50">@{c.other?.handle}</p>
                </div>
                <span className="shrink-0 text-[10px] text-black/40">{timeAgo(c.created_at)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
