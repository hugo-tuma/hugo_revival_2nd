import { Calendar, CreditCard, Disc, Layers, Library, Users, Zap } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'library', label: 'Library', icon: Library },
  { id: 'artists', label: 'Artists', icon: Users },
  { id: 'gigs', label: 'Gigs', icon: Calendar },
  { id: 'sparks', label: 'Sparks', icon: Zap },
  { id: 'player', label: 'Music Player', icon: Disc },
  { id: 'groups', label: 'Groups', icon: Layers },
  { id: 'payouts', label: 'Payouts', icon: CreditCard },
];
