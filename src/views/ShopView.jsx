import { Package, ShoppingBag } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import SparkBadge from '../components/SparkBadge';
import AccountGateDialog from '../components/AccountGateDialog';
import { useMerchItems } from '../hooks/useRSpaceQueries';

export default function ShopView() {
  const { data: items, isLoading, isError, error } = useMerchItems();

  return (
    <RSpacePanel title="Shop" icon={ShoppingBag}>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState>Couldn&rsquo;t load the shop: {error.message}</EmptyState>
      ) : items.length === 0 ? (
        <EmptyState>Nothing in the shop yet.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 border border-black p-3">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center border border-black"
                style={{ backgroundColor: item.image_color }}
              >
                <Package size={22} strokeWidth={1.5} className="text-white/70" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-sans text-sm font-medium">{item.name}</p>
                <p className="truncate font-sans text-xs text-neutral-500">{item.artist?.display_name}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <SparkBadge value={item.price_sparks} />
                  <AccountGateDialog
                    trigger={
                      <button
                        disabled={item.stock <= 0}
                        className="border border-black px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-black"
                      >
                        {item.stock <= 0 ? 'Sold out' : 'Buy'}
                      </button>
                    }
                    title="Coming soon"
                  >
                    This feature will be added soon.
                  </AccountGateDialog>
                </div>
                <p className="mt-1 font-mono text-[10px] text-neutral-400">
                  {item.stock > 0 ? `${item.stock} left` : 'Sold out'}
                  {item.variants?.length > 0 && <> &middot; {item.variants.join(' / ')}</>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </RSpacePanel>
  );
}
