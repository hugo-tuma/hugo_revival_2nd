import { useEffect, useState } from 'react';
import { CreditCard, Heart, Receipt, Repeat, ShoppingBag } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import SparkBadge from '../components/SparkBadge';
import { useArtistEarningsList, useRecentActivity } from '../hooks/useRSpaceQueries';
import { timeAgo } from '../lib/format';

const BREAKDOWN = [
  { key: 'lifetime_tips', label: 'Tips', icon: Heart },
  { key: 'lifetime_support', label: 'Monthly support', icon: Repeat },
  { key: 'lifetime_merch', label: 'Merch sales', icon: ShoppingBag },
];

export default function PayoutsView() {
  const { data: artists, isLoading: artistsLoading, isError: artistsError, error } = useArtistEarningsList();
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (artists && artists.length > 0 && !selectedId) setSelectedId(artists[0].artist_id);
  }, [artists, selectedId]);

  const selected = artists?.find((a) => a.artist_id === selectedId) ?? null;
  const { data: transactions, isLoading: txLoading } = useRecentActivity({ artistId: selectedId, limit: 10 });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {artistsLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : artistsError ? (
        <EmptyState>Couldn&rsquo;t load earnings: {error.message}</EmptyState>
      ) : (
        <RSpacePanel
          title="Lifetime earnings"
          icon={CreditCard}
          right={
            <select
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="border border-white bg-black px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-white outline-none"
            >
              {artists.map((a) => (
                <option key={a.artist_id} value={a.artist_id} className="bg-white text-black">
                  {a.display_name}
                </option>
              ))}
            </select>
          }
        >
          <p className="text-center font-mono text-4xl font-bold">&#9889;{selected?.lifetime_total ?? 0}</p>
          <p className="mt-1 text-center font-sans text-xs text-neutral-400">
            Total Sparks earned by {selected?.display_name ?? 'this artist'} across {selected?.transaction_count ?? 0}{' '}
            transaction{selected?.transaction_count === 1 ? '' : 's'}
          </p>
        </RSpacePanel>
      )}

      <RSpacePanel title="Breakdown" icon={Receipt}>
        <div className="flex flex-col divide-y divide-neutral-200">
          {BREAKDOWN.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Icon size={16} strokeWidth={1.5} className="shrink-0 text-black" />
                <span className="flex-1 font-sans text-sm">{row.label}</span>
                <SparkBadge value={selected?.[row.key] ?? 0} />
              </div>
            );
          })}
        </div>
      </RSpacePanel>

      <RSpacePanel title="Recent transactions" icon={Receipt}>
        {txLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <EmptyState>No transactions yet.</EmptyState>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-200">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="font-sans text-xs capitalize text-neutral-500">
                  {t.category === 'tip' ? 'Tip received' : t.category === 'support' ? 'Monthly support' : 'Merch sale'}
                </span>
                <span className="flex-1" />
                <SparkBadge value={t.amount} />
                <span className="shrink-0 font-mono text-[11px] text-neutral-400">{timeAgo(t.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </RSpacePanel>

      <p className="text-center font-sans text-xs text-neutral-400">
        No real payout processor is connected &mdash; Sparks are a prototype currency only.
      </p>
    </div>
  );
}
