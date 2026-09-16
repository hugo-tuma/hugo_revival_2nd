import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink, Music2, Users } from 'lucide-react';
import { useReorderTopFriends, useTopFriends } from '../../hooks/useSpacesQueries';
import { usePresenceStore } from '../../stores/presenceStore';
import { initialsOf } from '../../utils/format';
import SectionHeading from '../ui/SectionHeading';
import { CardSkeleton } from '../ui/Skeleton';

function Top8Cell({ friend, online, listeningTo, dragHandle }) {
  return (
    <div className="group relative aspect-square overflow-hidden border-2 border-black" style={{ backgroundColor: friend.color }} {...dragHandle}>
      <Link
        to={`/space/${friend.handle}`}
        className="absolute inset-0 flex items-center justify-center text-sm font-black"
        style={{ color: friend.color === '#111111' ? '#FDFBF7' : '#111111' }}
      >
        {initialsOf(friend.display_name)}
      </Link>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/85 p-1 text-center text-cream opacity-0 transition-opacity group-hover:opacity-100">
        <p className="text-[10px] font-bold leading-tight">{friend.display_name}</p>
        <p className="text-[9px] leading-tight text-cream/60">@{friend.handle}</p>
        <ExternalLink size={12} />
      </div>
      {online && <span className="absolute right-1 top-1 h-2 w-2 rounded-full border border-black bg-green-400 animate-blink-dot" />}
      {listeningTo && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 truncate bg-spark px-1 py-0.5 text-[8px] font-bold text-black">
          <Music2 size={9} className="shrink-0" />
          <span className="truncate">{listeningTo}</span>
        </div>
      )}
    </div>
  );
}

function SortableTop8Cell({ friend, online, listeningTo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: friend.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={style}>
      <Top8Cell friend={friend} online={online} listeningTo={listeningTo} dragHandle={{ ...attributes, ...listeners }} />
    </div>
  );
}

export default function Top8Grid({ profile, isOwner }) {
  const { data: friends, isLoading } = useTopFriends(profile.id);
  const reorder = useReorderTopFriends(profile.id);
  const online = usePresenceStore((s) => s.online);
  const [localOrder, setLocalOrder] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const items = localOrder ?? friends ?? [];

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((f) => f.id === active.id);
    const newIndex = items.findIndex((f) => f.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setLocalOrder(next);
    reorder.mutate(
      next.map((f) => f.id),
      { onSettled: () => setLocalOrder(null) }
    );
  };

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading icon={Users}>Top 8</SectionHeading>
      {isLoading ? (
        <div className="p-1.5">
          <CardSkeleton height={160} />
        </div>
      ) : items.length === 0 ? (
        <p className="p-4 text-center text-xs text-black/40">No Top 8 yet.</p>
      ) : isOwner ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((f) => f.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 gap-1.5 p-1.5">
              {items.map((f) => (
                <SortableTop8Cell
                  key={f.id}
                  friend={f}
                  online={Boolean(online[f.id])}
                  listeningTo={online[f.id]?.listening_to}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 p-1.5">
          {items.map((f) => (
            <Top8Cell key={f.id} friend={f} online={Boolean(online[f.id])} listeningTo={online[f.id]?.listening_to} />
          ))}
        </div>
      )}
    </div>
  );
}
