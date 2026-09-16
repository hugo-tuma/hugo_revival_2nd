import { BadgeCheck, Check, Heart, Sparkles, Zap } from 'lucide-react';
import { useBadgesCatalog, useOwnedBadges, usePurchaseBadge } from '../../hooks/useSpacesQueries';
import SectionHeading from '../ui/SectionHeading';
import { CardSkeleton } from '../ui/Skeleton';

const BADGE_ICONS = { Sparkles, Heart, BadgeCheck };

export default function BadgeShop({ profile }) {
  const { data: catalog, isLoading } = useBadgesCatalog();
  const { data: owned = [] } = useOwnedBadges(profile.id);
  const purchase = usePurchaseBadge(profile.id);
  const ownedIds = new Set(owned.map((b) => b.id));

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading icon={Sparkles}>Badges</SectionHeading>
      <div className="flex flex-col gap-2 p-3">
        {isLoading ? (
          <CardSkeleton height={100} />
        ) : (
          (catalog ?? []).map((badge) => {
            const Icon = BADGE_ICONS[badge.icon] ?? Sparkles;
            const isOwned = ownedIds.has(badge.id);
            const affordable = profile.sparks_balance >= badge.price_sparks;
            return (
              <div key={badge.id} className="flex items-center gap-2 border-2 border-black p-2">
                <Icon size={14} className="shrink-0 text-spark" />
                <span className="flex-1 text-xs font-bold">{badge.name}</span>
                <button
                  onClick={() => purchase.mutate({ badgeId: badge.id, priceSparks: badge.price_sparks, badgeName: badge.name })}
                  disabled={isOwned || !affordable || purchase.isPending}
                  className={`flex items-center gap-1 border-2 border-black px-2 py-1 text-[10px] font-bold uppercase ${
                    isOwned
                      ? 'bg-green-400'
                      : !affordable
                      ? 'cursor-not-allowed bg-black/10 text-black/30'
                      : 'bg-spark hover:bg-black hover:text-cream'
                  }`}
                >
                  {isOwned ? (
                    <>
                      <Check size={10} /> Owned
                    </>
                  ) : (
                    <>
                      <Zap size={10} /> {badge.price_sparks}
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
