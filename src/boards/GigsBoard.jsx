import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { useAllGigs } from '../hooks/useSpacesQueries';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton } from '../components/ui/Skeleton';

function formatCents(cents) {
  return `£${(cents / 100).toFixed(2)}`;
}

function formatGigDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export default function GigsBoard() {
  const { data: gigs, isLoading } = useAllGigs();

  return (
    <div className="p-3 sm:p-4">
      <div className="space-card border-2 border-black bg-white">
        <SectionHeading icon={Calendar}>Upcoming gigs</SectionHeading>
        <div className="flex flex-col gap-2 p-3">
          {isLoading ? (
            <CardSkeleton height={200} />
          ) : (gigs ?? []).length === 0 ? (
            <p className="p-4 text-center text-xs text-black/40">No upcoming gigs.</p>
          ) : (
            gigs.map((gig) => (
              <div key={gig.id} className="flex items-center gap-3 border-2 border-black p-3">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center border-2 border-black bg-black text-cream">
                  <span className="text-[9px] font-bold uppercase leading-none">
                    {new Date(`${gig.gig_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                  <span className="text-sm font-black leading-none">
                    {new Date(`${gig.gig_date}T00:00:00`).getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/space/${gig.artist?.handle}`} className="truncate text-xs font-bold hover:text-spark">
                    {gig.artist?.display_name}
                  </Link>
                  <p className="truncate text-xs">{gig.venue}</p>
                  <p className="flex items-center gap-1 text-[10px] text-black/50">
                    <MapPin size={10} /> {gig.city} &middot; {formatGigDate(gig.gig_date)}
                  </p>
                </div>
                {gig.ticket_url ? (
                  <a
                    href={gig.ticket_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 border-2 border-black bg-spark px-2 py-1.5 text-[10px] font-bold uppercase hover:bg-black hover:text-cream"
                  >
                    <Ticket size={11} /> {formatCents(gig.price_cents)}
                  </a>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold text-black/50">{formatCents(gig.price_cents)}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
