import { useState } from 'react';
import { Check, Plus, ShoppingBag, Zap } from 'lucide-react';
import { useCreateMerchItem, useMerch, usePurchaseMerch } from '../../hooks/useSpacesQueries';
import SectionHeading from '../ui/SectionHeading';
import { CardSkeleton } from '../ui/Skeleton';

export default function MerchShop({ profile, isOwner, viewerId, viewerBalance }) {
  const { data: items, isLoading } = useMerch(profile.id);
  const createItem = useCreateMerchItem(profile.id);
  const purchase = usePurchaseMerch(viewerId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', stock: '', variants: 'S, M, L', color: '#111111', album: '' });
  const [selected, setSelected] = useState({});
  const [justBought, setJustBought] = useState({});

  const submitNew = (e) => {
    e.preventDefault();
    createItem.mutate(
      {
        name: form.name,
        priceSparks: Number(form.price),
        stock: Number(form.stock),
        variants: form.variants.split(',').map((v) => v.trim()).filter(Boolean),
        imageColor: form.color,
        album: form.album.trim(),
      },
      {
        onSuccess: () => {
          setForm({ name: '', price: '', stock: '', variants: 'S, M, L', color: '#111111', album: '' });
          setShowForm(false);
        },
      }
    );
  };

  const buy = (item) => {
    const variant = selected[item.id] ?? item.variants[0];
    purchase.mutate(
      { merchId: item.id, variant, priceSparks: item.price_sparks, artistId: profile.id },
      {
        onSuccess: () => {
          setJustBought((j) => ({ ...j, [item.id]: true }));
          setTimeout(() => setJustBought((j) => ({ ...j, [item.id]: false })), 2400);
        },
      }
    );
  };

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading
        icon={ShoppingBag}
        right={
          isOwner && (
            <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1 text-[10px] font-bold uppercase">
              <Plus size={12} /> Add
            </button>
          )
        }
      >
        Merch
      </SectionHeading>

      <div className="p-3">
        {showForm && (
          <form onSubmit={submitNew} className="mb-3 grid grid-cols-2 gap-1.5 border-2 border-black p-2">
            <input
              required
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="col-span-2 border-2 border-black px-2 py-1 text-xs"
            />
            <input
              required
              type="number"
              min="1"
              placeholder="Price (Sparks)"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="border-2 border-black px-2 py-1 text-xs"
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="border-2 border-black px-2 py-1 text-xs"
            />
            <input
              placeholder="Variants, comma separated"
              value={form.variants}
              onChange={(e) => setForm((f) => ({ ...f, variants: e.target.value }))}
              className="col-span-2 border-2 border-black px-2 py-1 text-xs"
            />
            <input
              placeholder="Album (optional, for Store filtering)"
              value={form.album}
              onChange={(e) => setForm((f) => ({ ...f, album: e.target.value }))}
              className="col-span-2 border-2 border-black px-2 py-1 text-xs"
            />
            <label className="col-span-2 flex items-center justify-between text-xs font-bold">
              Swatch color
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-7 w-10 border-2 border-black bg-transparent"
              />
            </label>
            <button
              type="submit"
              disabled={createItem.isPending}
              className="col-span-2 border-2 border-black bg-spark py-1.5 text-[10px] font-bold uppercase hover:bg-black hover:text-cream disabled:opacity-50"
            >
              List item
            </button>
          </form>
        )}

        {isLoading ? (
          <CardSkeleton height={140} />
        ) : (items ?? []).length === 0 ? (
          <p className="text-xs text-black/40">No merch listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const activeVariant = selected[item.id] ?? item.variants[0];
              const outOfStock = item.stock <= 0;
              const cantAfford = viewerBalance < item.price_sparks;
              return (
                <div key={item.id} className="border-2 border-black">
                  <div className="h-28 border-b-2 border-black" style={{ backgroundColor: item.image_color }} />
                  <div className="flex flex-col gap-1.5 p-2">
                    <p className="text-xs font-bold">{item.name}</p>
                    <p className="flex items-center gap-1 text-[11px] font-bold">
                      <Zap size={11} className="text-spark" /> {item.price_sparks}
                    </p>
                    <p className="text-[10px] text-black/40">{item.stock} in stock</p>
                    <div className="flex flex-wrap gap-1">
                      {item.variants.map((v) => (
                        <button
                          key={v}
                          onClick={() => setSelected((s) => ({ ...s, [item.id]: v }))}
                          className={`border-2 border-black px-1.5 py-0.5 text-[10px] font-bold ${
                            activeVariant === v ? 'bg-black text-cream' : 'bg-cream'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {!isOwner && (
                      <button
                        onClick={() => buy(item)}
                        disabled={outOfStock || cantAfford || purchase.isPending}
                        className={`mt-1 flex items-center justify-center gap-1 border-2 border-black py-1.5 text-[10px] font-bold uppercase transition-colors ${
                          justBought[item.id]
                            ? 'bg-green-400'
                            : outOfStock || cantAfford
                            ? 'cursor-not-allowed bg-black/10 text-black/30'
                            : 'bg-spark hover:bg-black hover:text-cream'
                        }`}
                      >
                        {justBought[item.id] ? (
                          <>
                            <Check size={11} /> Purchased
                          </>
                        ) : outOfStock ? (
                          'Out of stock'
                        ) : cantAfford ? (
                          'Not enough Sparks'
                        ) : (
                          <>
                            <Zap size={11} /> Buy with Sparks
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
