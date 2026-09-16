import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Heart, MessageSquare, ShoppingBag, UserPlus, Zap } from 'lucide-react';
import { useAuth } from '../components/auth/AuthGate';
import { useMarkNotificationsRead, useNotifications } from '../hooks/useSpacesQueries';
import { initialsOf, timeAgo } from '../utils/format';
import SectionHeading from '../components/ui/SectionHeading';
import { FeedSkeleton } from '../components/ui/Skeleton';

const TYPE_ICON = {
  follow: UserPlus,
  tip: Zap,
  support: Heart,
  comment: MessageSquare,
  merch_purchase: ShoppingBag,
};

function notificationText(n) {
  switch (n.type) {
    case 'follow':
      return 'started following you';
    case 'tip':
      return `sent you ${n.metadata?.amount ?? ''} sparks`;
    case 'support':
      return `is now supporting you monthly (${n.metadata?.monthly_amount ?? ''} sparks)`;
    case 'comment':
      return 'left a comment on your wall';
    case 'merch_purchase':
      return `bought "${n.metadata?.name ?? 'your merch'}"`;
    default:
      return 'did something';
  }
}

export default function NotificationsBoard() {
  const { profile } = useAuth();
  const { data: notifications, isLoading } = useNotifications(profile.id);
  const markRead = useMarkNotificationsRead(profile.id);

  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-3 sm:p-4">
      <div className="mx-auto max-w-xl space-card border-2 border-black bg-white">
        <SectionHeading icon={Bell}>Sparks &amp; notifications</SectionHeading>
        {isLoading ? (
          <FeedSkeleton />
        ) : (notifications ?? []).length === 0 ? (
          <p className="p-6 text-center text-xs text-black/40">Nothing yet — activity on your Space shows up here.</p>
        ) : (
          <div>
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              return (
                <div
                  key={n.id}
                  className={`flex items-center gap-3 border-b-2 border-black/10 px-3 py-3 last:border-b-0 ${
                    n.read ? '' : 'bg-spark/10'
                  }`}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black text-[10px] font-bold"
                    style={{
                      backgroundColor: n.actor?.color ?? '#111111',
                      color: n.actor?.color === '#111111' || !n.actor?.color ? '#FDFBF7' : '#111111',
                    }}
                  >
                    {n.actor ? initialsOf(n.actor.display_name) : <Icon size={13} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      {n.actor ? (
                        <Link to={`/space/${n.actor.handle}`} className="font-bold hover:text-spark">
                          {n.actor.display_name}
                        </Link>
                      ) : (
                        <span className="font-bold">Someone</span>
                      )}{' '}
                      {notificationText(n)}
                    </p>
                    <p className="text-[10px] text-black/40">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-spark" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
