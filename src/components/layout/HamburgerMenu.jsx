import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Library,
  ListMusic,
  Menu,
  Mic2,
  Users2,
  Wallet,
  X,
} from 'lucide-react';
import { useUnreadNotificationCount } from '../../hooks/useSpacesQueries';

function itemsFor(profile) {
  const items = [
    { id: 'library', label: 'Library', icon: Library, to: '/library' },
    { id: 'artists', label: 'Artists', icon: Mic2, to: '/artists' },
    { id: 'gigs', label: 'Gigs', icon: Calendar, to: '/gigs' },
    { id: 'notifications', label: 'Sparks', icon: Bell, to: '/notifications' },
    { id: 'player', label: 'Music Player', icon: ListMusic, to: '/player' },
    { id: 'groups', label: 'Groups', icon: Users2, to: '/groups' },
  ];
  if (profile.role === 'artist') {
    items.push({ id: 'payouts', label: 'Payouts', icon: Wallet, to: '/payouts' });
  }
  return items;
}

export default function HamburgerMenu({ profile }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { data: unread = 0 } = useUnreadNotificationCount(profile.id);
  const items = itemsFor(profile);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black hover:bg-black/5"
        aria-label="Open menu"
      >
        <Menu size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center border-2 border-black bg-spark px-0.5 text-[9px] font-black leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="animate-drawer-left absolute bottom-0 left-0 top-0 flex w-64 max-w-[80vw] flex-col border-r-2 border-black bg-cream">
            <div className="flex items-center justify-between border-b-2 border-black bg-black px-3 py-3 text-cream">
              <span className="flex items-center gap-1.5 text-sm font-black tracking-tight">
                R'SPACE
                <span className="inline-block h-2 w-2 bg-spark" />
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col divide-y-2 divide-black/10 overflow-y-auto">
              {items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
                      active ? 'bg-black text-cream' : 'hover:bg-black/5'
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                    {item.id === 'notifications' && unread > 0 && (
                      <span className="ml-auto flex h-4 min-w-4 items-center justify-center border-2 border-black bg-spark px-1 text-[9px] font-black">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
