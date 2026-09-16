import { useMemo, useState } from 'react';
import { Music2, Radio, Sparkles } from 'lucide-react';
import { useFeed, usePostFeedEvent, useTopFriends } from '../../hooks/useSpacesQueries';
import { timeAgo, initialsOf } from '../../utils/format';
import SectionHeading from '../ui/SectionHeading';
import { FeedSkeleton } from '../ui/Skeleton';

const FILTERS = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'top8', label: 'Top 8' },
  { id: 'music', label: 'Music only' },
];

function EventBody({ event }) {
  switch (event.type) {
    case 'music_drop':
      return (
        <>
          <p className="mt-0.5 text-xs">dropped a new one —</p>
          <div className="mt-1.5 inline-flex items-center gap-1.5 border-2 border-black bg-cream px-2 py-1 text-[10px] font-bold">
            <Music2 size={11} className="text-spark" /> {event.metadata?.title}
          </div>
        </>
      );
    case 'badge_mint':
      return (
        <p className="mt-0.5 flex items-center gap-1 text-xs">
          <Sparkles size={11} className="text-spark" /> minted the {event.metadata?.name} badge
        </p>
      );
    default:
      return <p className="mt-0.5 text-xs">{event.metadata?.text}</p>;
  }
}

export default function ActivityFeed({ viewerId }) {
  const [filter, setFilter] = useState('everyone');
  const [draft, setDraft] = useState('');
  const { data: events, isLoading } = useFeed(viewerId);
  const { data: top8 = [] } = useTopFriends(viewerId);
  const postEvent = usePostFeedEvent(viewerId);

  const top8Ids = useMemo(() => new Set(top8.map((f) => f.id)), [top8]);

  const filtered = (events ?? []).filter((e) => {
    if (filter === 'top8') return top8Ids.has(e.actor_id);
    if (filter === 'music') return e.type === 'music_drop';
    return true;
  });

  const submit = () => {
    if (!draft.trim()) return;
    postEvent.mutate(draft.trim());
    setDraft('');
  };

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading icon={Radio}>Activity</SectionHeading>

      <div className="flex gap-1 border-b-2 border-black p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Post something..."
          maxLength={280}
          className="flex-1 border-2 border-black px-2 py-1 text-xs font-mono"
        />
        <button
          onClick={submit}
          className="space-btn border-2 border-black bg-spark px-2 text-[10px] font-bold uppercase hover:bg-black hover:text-cream transition-colors"
        >
          Post
        </button>
      </div>

      <div className="flex border-b-2 border-black">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 border-r-2 border-black py-2 text-[10px] font-bold uppercase tracking-wide last:border-r-0 transition-colors ${
              filter === f.id ? 'bg-spark text-black' : 'bg-cream hover:bg-black/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <FeedSkeleton />
      ) : (
        <div>
          {filtered.length === 0 && <p className="p-4 text-center text-xs text-black/40">Nothing here yet.</p>}
          {filtered.map((event) => (
            <div key={event.id} className="flex gap-3 border-b-2 border-black/10 px-3 py-3 last:border-b-0">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black text-[10px] font-bold"
                style={{
                  backgroundColor: event.actor?.color ?? '#111111',
                  color: event.actor?.color === '#111111' || !event.actor?.color ? '#FDFBF7' : '#111111',
                }}
              >
                {initialsOf(event.actor?.display_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xs font-bold">{event.actor?.display_name}</span>
                  {top8Ids.has(event.actor_id) && <span className="text-[9px] font-bold uppercase text-spark">Top 8</span>}
                  <span className="ml-auto text-[10px] text-black/40">{timeAgo(event.created_at)}</span>
                </div>
                <EventBody event={event} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t-2 border-dashed border-black/20 py-5 text-center text-[10px] uppercase tracking-widest text-black/40">
        — That&rsquo;s everything from today. —
      </div>
    </div>
  );
}
