import { CreditCard, Heart, Receipt, Repeat, ShoppingBag } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import SparkBadge from '../components/SparkBadge';

const BREAKDOWN = [
  { id: 'tips', label: 'Tips', icon: Heart },
  { id: 'support', label: 'Monthly support', icon: Repeat },
  { id: 'merch', label: 'Merch sales', icon: ShoppingBag },
];

export default function PayoutsView() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <RSpacePanel title="Lifetime earnings" icon={CreditCard}>
        <p className="text-center font-mono text-4xl font-bold">&#9889;0</p>
        <p className="mt-1 text-center font-sans text-xs text-neutral-400">Total Sparks earned across this Space</p>
      </RSpacePanel>

      <RSpacePanel title="Breakdown" icon={Receipt}>
        <div className="flex flex-col divide-y divide-neutral-200">
          {BREAKDOWN.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Icon size={16} strokeWidth={1.5} className="shrink-0 text-black" />
                <span className="flex-1 font-sans text-sm">{row.label}</span>
                <SparkBadge value={0} />
              </div>
            );
          })}
        </div>
      </RSpacePanel>

      <RSpacePanel title="Recent transactions" icon={Receipt}>
        <EmptyState>No transactions yet.</EmptyState>
      </RSpacePanel>

      <p className="text-center font-sans text-xs text-neutral-400">
        No real payout processor is connected &mdash; Sparks are a prototype currency only.
      </p>
    </div>
  );
}
