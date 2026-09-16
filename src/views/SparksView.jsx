import { Zap } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';
import SparkBadge from '../components/SparkBadge';

export default function SparksView({ sparksBalance = 0 }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <RSpacePanel title="Sparks balance" icon={Zap} right={<SparkBadge value={sparksBalance} />}>
        <p className="text-center font-sans text-xs text-neutral-400">
          Sparks are this prototype&rsquo;s in-app currency for tips, merch, and monthly support.
        </p>
      </RSpacePanel>

      <RSpacePanel title="Notifications" icon={Zap}>
        <EmptyState>No notifications yet.</EmptyState>
      </RSpacePanel>
    </div>
  );
}
