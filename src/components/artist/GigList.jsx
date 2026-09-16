import { useState } from 'react';
import { MapPin, Plus, Ticket, TrendingUp } from 'lucide-react';
import { useCreateGig, useGigs, useToggleGigStatus } from '../../hooks/useSpacesQueries';
import SectionHeading from '../ui/SectionHeading';
import { CardSkeleton } from '../ui/Skeleton';

function formatCents(cents) {
  return `£${(cents / 100).toFixed(2)}`;
}

function formatGigDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`)
    .toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
    .toUpperCase();
}

export default function GigList({ profile, isOwner }) {
  const { data: gigs, isLoading } = useGigs(profile.id);
  const createGig = useCreateGig(profile.id);
  const toggleStatus = useToggleGigStatus(profile.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gigDate: '', venue: '', city: '', priceGbp: '', ticketUrl: '' });

  const submit = (e) => {
    e.preventDefault();
    createGig.mutate(
      {
        gigDate: form.gigDate,
        venue: form.venue,
        city: form.city,
        priceCents: Math.round(Number(form.priceGbp) * 100),
        ticketUrl: form.ticketUrl,
      },
      {
        onSuccess: () => {
          setForm({ gigDate: '', venue: '', city: '', priceGbp: '', ticketUrl: '' });
          setShowForm(false);
        },
      }
    );
  };

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading
        icon={Ticket}
        right={
          isOwner && (
            <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1 text-[10px] font-bold uppercase">
              <Plus size={12} /> Add
            </button>
          )
        }
      >
        Upcoming gigs
      </SectionHeading>

      <div className="flex flex-col gap-2 p-3">
        <div className="inline-flex w-fit items-center gap-1 border-2 border-spark bg-spark/20 px-2 py-1 text-[10px] font-bold">
          <TrendingUp size={11} /> 92% goes direct to the band
        </div>

        {showForm && (
          <form onSubmit={submit} className="grid grid-cols-2 gap-1.5 border-2 border-black p-2">
            <input
              required
              type="date"
              value={form.gigDate}
              onChange={(e) => setForm((f) => ({ ...f, gigDate: e.target.value }))}
              className="col-span-2 border-2 border-black px-2 py-1 text-xs sm:col-span-1"
            />
            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Price (£)"
              value={form.priceGbp}
              onChange={(e) => setForm((f) => ({ ...f, priceGbp: e.target.value }))}
              className="border-2 border-black px-2 py-1 text-xs"
            />
            <input
              required
              placeholder="Venue"
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              className="col-span-2 border-2 border-black px-2 py-1 text-xs sm:col-span-1"
            />
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="border-2 border-black px-2 py-1 text-xs"
            />
            <input
              placeholder="Ticket URL (optional)"
              value={form.ticketUrl}
              onChange={(e) => setForm((f) => ({ ...f, ticketUrl: e.target.value }))}
              className="col-span-2 border-2 border-black px-2 py-1 text-xs"
            />
            <button
              type="submit"
              disabled={createGig.isPending}
              className="col-span-2 border-2 border-black bg-spark py-1.5 text-[10px] font-bold uppercase hover:bg-black hover:text-cream disabled:opacity-50"
            >
              List gig
            </button>
          </form>
        )}

        {isLoading ? (
          <CardSkeleton height={100} />
        ) : (gigs ?? []).length === 0 ? (
          <p className="text-xs text-black/40">No gigs listed yet.</p>
        ) : (
          gigs.map((g) => (
            <div key={g.id} className="flex items-center gap-3 border-2 border-black p-2">
              <div className="w-14 shrink-0 text-center">
                <p className="text-[10px] font-black leading-none">{formatGigDate(g.gig_date)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{g.venue}</p>
                <p className="flex items-center gap-1 text-[10px] text-black/50">
                  <MapPin size={10} /> {g.city} &middot; {formatCents(g.price_cents)}
                </p>
              </div>
              <button
                onClick={() =>
                  isOwner && toggleStatus.mutate({ gigId: g.id, status: g.status === 'on_sale' ? 'sold_out' : 'on_sale' })
                }
                disabled={!isOwner}
                className={`shrink-0 border-2 border-black px-2 py-1 text-[9px] font-bold uppercase ${
                  g.status === 'on_sale' ? 'bg-spark text-black' : 'bg-black text-cream'
                } ${isOwner ? '' : 'cursor-default'}`}
              >
                {g.status === 'on_sale' ? 'On Sale' : 'Sold Out'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
