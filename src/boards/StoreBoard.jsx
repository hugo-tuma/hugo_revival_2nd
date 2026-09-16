import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '../components/auth/AuthGate';
import {
  useMarketplace,
  useMarketplaceFacets,
  useOwnedBadges,
  usePurchaseBadge,
  usePurchaseMerch,
} from '../hooks/useSpacesQueries';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton } from '../components/ui/Skeleton';

function MerchCard({ item, viewerBalance, isOwn, onBuy, busy }) {
  const affordable = viewerBalance >= item.price_sparks;
  return (
    <div className="flex flex-col border-2 border-black bg-white">
      <div className="flex h-28 items-center justify-center border-b-2 border-black" style={{ backgroundColor: item.image_color || '#111111' }}>
        <ShoppingBag size={24} className="text-cream/80" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="truncate text-xs font-bold">{item.name}</p>
        <Link to={`/space/${item.artist?.handle}`} className="truncate text-[10px] text-black/50 hover:text-spark">
          @{item.artist?.handle}
        </Link>
        {item.album && <p className="truncate text-[9px] uppercase tracking-wide text-black/40">{item.album}</p>}
        <button
          onClick={onBuy}
          disabled={isOwn || !affordable || busy || item.stock <= 0}
          className={`mt-auto flex items-center justify-center gap-1 border-2 border-black px-2 py-1.5 text-[10px] font-bold uppercase ${
            isOwn || item.stock <= 0
              ? 'cursor-not-allowed bg-black/10 text-black/30'
              : !affordable
              ? 'cursor-not-allowed bg-black/10 text-black/30'
              : 'bg-spark hover:bg-black hover:text-cream'
          }`}
        >
          <Zap size={10} /> {item.stock <= 0 ? 'Sold out' : item.price_sparks}
        </button>
      </div>
    </div>
  );
}

function BadgeCard({ badge, viewerBalance, isOwned, onBuy, busy }) {
  const affordable = viewerBalance >= badge.price_sparks;
  return (
    <div className="flex flex-col border-2 border-black bg-white">
      <div className="flex h-28 items-center justify-center border-b-2 border-black bg-cream">
        {badge.image_url ? (
          <img src={badge.image_url} alt={badge.name} className="h-20 w-20 object-cover" />
        ) : (
          <Sparkles size={24} className="text-spark" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="truncate text-xs font-bold">{badge.name}</p>
        <p className="truncate text-[9px] uppercase tracking-wide text-black/40">{badge.type}</p>
        <button
          onClick={onBuy}
          disabled={isOwned || !affordable || busy}
          className={`mt-auto flex items-center justify-center gap-1 border-2 border-black px-2 py-1.5 text-[10px] font-bold uppercase ${
            isOwned ? 'bg-green-400' : !affordable ? 'cursor-not-allowed bg-black/10 text-black/30' : 'bg-spark hover:bg-black hover:text-cream'
          }`}
        >
          {isOwned ? (
            <>
              <BadgeCheck size={10} /> Owned
            </>
          ) : (
            <>
              <Zap size={10} /> {badge.price_sparks}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function StoreBoard() {
  const { profile } = useAuth();
  const [page, setPage] = useState(0);
  const [artistId, setArtistId] = useState('');
  const [badgeType, setBadgeType] = useState('');
  const [album, setAlbum] = useState('');

  const { data: facets } = useMarketplaceFacets();
  const { data, isLoading } = useMarketplace({ page, artistId, badgeType, album });
  const { data: ownedBadges = [] } = useOwnedBadges(profile.id);
  const purchaseMerch = usePurchaseMerch(profile.id);
  const purchaseBadge = usePurchaseBadge(profile.id);

  const ownedBadgeIds = new Set(ownedBadges.map((b) => b.id));
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const applyFilter = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  return (
    <div className="p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-card h-fit border-2 border-black bg-white">
          <SectionHeading icon={ShoppingBag}>Filters</SectionHeading>
          <div className="flex flex-col gap-3 p-3">
            <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-black/50">
              Artist
              <select
                value={artistId}
                onChange={(e) => applyFilter(setArtistId)(e.target.value)}
                className="border-2 border-black bg-white px-2 py-1.5 text-xs font-mono normal-case"
              >
                <option value="">All artists</option>
                {(facets?.artists ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-black/50">
              Badge type
              <select
                value={badgeType}
                onChange={(e) => applyFilter(setBadgeType)(e.target.value)}
                className="border-2 border-black bg-white px-2 py-1.5 text-xs font-mono normal-case"
              >
                <option value="">All types</option>
                {(facets?.badgeTypes ?? []).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-black/50">
              Album
              <select
                value={album}
                onChange={(e) => applyFilter(setAlbum)(e.target.value)}
                className="border-2 border-black bg-white px-2 py-1.5 text-xs font-mono normal-case"
              >
                <option value="">All albums</option>
                {(facets?.albums ?? []).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            {(artistId || badgeType || album) && (
              <button
                onClick={() => {
                  setArtistId('');
                  setBadgeType('');
                  setAlbum('');
                  setPage(0);
                }}
                className="border-2 border-black px-2 py-1.5 text-[10px] font-bold uppercase hover:bg-black/5"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="space-card border-2 border-black bg-white">
          <SectionHeading
            icon={ShoppingBag}
            right={
              <div className="flex items-center gap-2 text-cream">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous page">
                  <ChevronLeft size={16} className={page === 0 ? 'opacity-30' : ''} />
                </button>
                <span className="text-[10px] font-bold">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} className={page >= totalPages - 1 ? 'opacity-30' : ''} />
                </button>
              </div>
            }
          >
            Marketplace
          </SectionHeading>

          <div className="p-3">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CardSkeleton key={i} height={180} />
                ))}
              </div>
            ) : (data?.items ?? []).length === 0 ? (
              <p className="p-8 text-center text-xs text-black/40">No items match those filters.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {data.items.map((item) =>
                  item.kind === 'merch' ? (
                    <MerchCard
                      key={item.key}
                      item={item}
                      viewerBalance={profile.sparks_balance}
                      isOwn={item.artist_id === profile.id}
                      busy={purchaseMerch.isPending}
                      onBuy={() =>
                        purchaseMerch.mutate({
                          merchId: item.id,
                          variant: item.variants?.[0],
                          priceSparks: item.price_sparks,
                          artistId: item.artist_id,
                        })
                      }
                    />
                  ) : (
                    <BadgeCard
                      key={item.key}
                      badge={item}
                      viewerBalance={profile.sparks_balance}
                      isOwned={ownedBadgeIds.has(item.id)}
                      busy={purchaseBadge.isPending}
                      onBuy={() =>
                        purchaseBadge.mutate({
                          badgeId: item.id,
                          priceSparks: item.price_sparks,
                          badgeName: item.name,
                        })
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
