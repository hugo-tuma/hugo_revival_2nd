import { Calendar, MapPin } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import AccountGateDialog from '../components/AccountGateDialog';
import { useGigs } from '../hooks/useRSpaceQueries';
import { formatGigDate } from '../lib/format';

function formatCents(cents) {
  return `£${(cents / 100).toFixed(2)}`;
}

export default function GigsView() {
  const { data: gigs, isLoading, isError, error } = useGigs();

  return (
    <RSpacePanel title="Gigs" icon={Calendar}>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState>Couldn&rsquo;t load gigs: {error.message}</EmptyState>
      ) : gigs.length === 0 ? (
        <EmptyState>No upcoming gigs.</EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {gigs.map((g) => (
            <div key={g.id} className="flex items-center gap-3 border border-neutral-200 p-2.5">
              <div className="w-12 shrink-0 text-center">
                <p className="font-mono text-[11px] font-bold leading-none">{formatGigDate(g.gig_date)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-medium">
                  {g.artist?.display_name} &mdash; {g.venue}
                </p>
                <p className="flex items-center gap-1 font-sans text-xs text-neutral-400">
                  <MapPin size={10} strokeWidth={1.5} /> {g.city} &middot; {formatCents(g.price_cents)}
                </p>
              </div>
              {g.status === 'on_sale' ? (
                <AccountGateDialog
                  trigger={
                    <button className="shrink-0 border border-black bg-black px-2 py-1 font-mono text-[9px] font-bold uppercase text-white hover:bg-neutral-800">
                      Get tickets
                    </button>
                  }
                  title="Coming soon"
                >
                  This feature will be added soon.
                </AccountGateDialog>
              ) : (
                <span className="shrink-0 border border-neutral-300 px-2 py-1 font-mono text-[9px] font-bold uppercase text-neutral-400">
                  Sold Out
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </RSpacePanel>
  );
}
