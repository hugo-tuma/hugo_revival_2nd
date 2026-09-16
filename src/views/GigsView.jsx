import { Calendar } from 'lucide-react';
import RSpacePanel from '../components/RSpacePanel';
import EmptyState from '../components/EmptyState';

export default function GigsView() {
  return (
    <RSpacePanel title="Gigs" icon={Calendar}>
      <EmptyState>No upcoming gigs.</EmptyState>
    </RSpacePanel>
  );
}
