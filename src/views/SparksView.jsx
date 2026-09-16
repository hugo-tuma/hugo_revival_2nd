import { Heart, Repeat, ShoppingBag, Zap } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import SparkBadge from '../components/SparkBadge';
import { useRecentActivity } from '../hooks/useRSpaceQueries';
import { timeAgo } from '../lib/format';

const CATEGORY_META = {
  tip: { icon: Heart, label: 'received a tip' },
  support: { icon: Repeat, label: 'gained a monthly supporter' },
  merch: { icon: ShoppingBag, label: 'sold a piece of merch' },
};

export default function SparksView({ sparksBalance = 0 }) {
  const { data: activity, isLoading, isError, error } = useRecentActivity({ limit: 20 });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <RSpacePanel title="Sparks balance" icon={Zap} right={<SparkBadge value={sparksBalance} />}>
        <p className="text-center font-sans text-xs text-neutral-400">
          Sparks are R&rsquo;SPACE&rsquo;s in-app currency for tips, merch, and monthly support. This is a
          public preview with no signed-in account, so your own balance reads zero &mdash; the feed below is
          real platform-wide activity.
        </p>
      </RSpacePanel>

      <RSpacePanel title="Recent Activity" icon={Zap}>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState>Couldn&rsquo;t load activity: {error.message}</EmptyState>
        ) : activity.length === 0 ? (
          <EmptyState>No notifications yet.</EmptyState>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-200">
            {activity.map((a) => {
              const meta = CATEGORY_META[a.category] ?? { icon: Zap, label: a.category };
              const Icon = meta.icon;
              return (
                <div key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <Icon size={15} strokeWidth={1.5} className="shrink-0" />
                  <p className="min-w-0 flex-1 truncate font-sans text-sm">
                    <span className="font-medium">{a.artist_display_name}</span> {meta.label}
                  </p>
                  <SparkBadge value={a.amount} />
                  <span className="shrink-0 font-mono text-[11px] text-neutral-400">{timeAgo(a.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </RSpacePanel>
    </div>
  );
}
