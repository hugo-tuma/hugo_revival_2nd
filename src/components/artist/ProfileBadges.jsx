import { useOwnedBadges } from '../../hooks/useSpacesQueries';

const MAX_BADGES = 4;
const BADGE_GAP_PX = 50;

export default function ProfileBadges({ profile }) {
  const { data: badges = [] } = useOwnedBadges(profile.id);
  const shown = badges.filter((b) => b.image_url).slice(0, MAX_BADGES);

  if (shown.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute right-3 top-0 z-10 flex -translate-y-1/2 sm:right-4"
      style={{ gap: `${BADGE_GAP_PX}px` }}
    >
      {shown.map((b) => (
        <img
          key={b.id}
          src={b.image_url}
          alt={b.name}
          title={b.name}
          className="pointer-events-auto h-20 w-20 shrink-0 border-2 border-black bg-white object-cover shadow-[3px_3px_0_0_#111111] sm:h-32 sm:w-32 lg:h-[200px] lg:w-[200px]"
        />
      ))}
    </div>
  );
}
