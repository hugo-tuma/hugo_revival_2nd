import { Navigate } from 'react-router-dom';
import { Gift, Heart, ShoppingBag, Wallet, Zap } from 'lucide-react';
import { useAuth } from '../components/auth/AuthGate';
import { usePayoutSummary } from '../hooks/useSpacesQueries';
import { timeAgo } from '../utils/format';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton } from '../components/ui/Skeleton';

const CATEGORY_META = {
  tip: { label: 'Tips', icon: Zap },
  support: { label: 'Monthly support', icon: Heart },
  merch: { label: 'Merch sales', icon: ShoppingBag },
};

export default function PayoutsBoard() {
  const { profile } = useAuth();
  const { data, isLoading } = usePayoutSummary(profile.id);

  if (profile.role !== 'artist') {
    return <Navigate to={`/space/${profile.handle}`} replace />;
  }

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-4">
      <div className="flex flex-col gap-4">
        <div className="space-card border-2 border-black bg-black text-cream">
          <div className="flex items-center gap-3 p-4">
            <Wallet size={22} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-cream/60">Lifetime earnings</p>
              <p className="text-2xl font-black">{isLoading ? '—' : data?.total ?? 0} sparks</p>
            </div>
          </div>
        </div>

        <div className="space-card border-2 border-black bg-white">
          <SectionHeading icon={Gift}>Breakdown</SectionHeading>
          {isLoading ? (
            <div className="p-3">
              <CardSkeleton height={120} />
            </div>
          ) : (
            <div className="divide-y-2 divide-black/10">
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const amount = data?.byCategory?.[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-2.5 px-3 py-2.5">
                    <Icon size={14} className="shrink-0 text-spark" />
                    <span className="flex-1 text-xs font-bold">{meta.label}</span>
                    <span className="text-xs font-bold">{amount} sparks</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-card border-2 border-black bg-white">
          <SectionHeading icon={Wallet}>Recent transactions</SectionHeading>
          {isLoading ? (
            <div className="p-3">
              <CardSkeleton height={160} />
            </div>
          ) : (data?.rows ?? []).length === 0 ? (
            <p className="p-6 text-center text-xs text-black/40">No earnings yet.</p>
          ) : (
            <div className="divide-y-2 divide-black/10">
              {data.rows.slice(0, 30).map((row) => (
                <div key={row.id} className="flex items-center gap-2.5 px-3 py-2">
                  <span className="flex-1 text-xs capitalize">{row.category}</span>
                  <span className="text-[10px] text-black/40">{timeAgo(row.created_at)}</span>
                  <span className="w-14 shrink-0 text-right text-xs font-bold text-green-700">+{row.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-black/40">
          This is an earnings summary only — there is no real-money payout processor connected yet.
        </p>
      </div>
    </div>
  );
}
