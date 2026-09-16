import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, LogOut, Palette, User as UserIcon, Zap } from 'lucide-react';
import { useAuth } from '../auth/AuthGate';
import { initialsOf } from '../../utils/format';

const NAV_ITEMS = (handle) => [
  { id: 'home', label: 'Your Space', icon: HomeIcon, to: `/space/${handle}` },
  { id: 'artist', label: 'Artist Page', icon: UserIcon, to: `/artist/${handle}` },
  { id: 'customize', label: 'Customize', icon: Palette, to: '/customize' },
];

export default function Header() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const items = NAV_ITEMS(profile.handle);

  return (
    <header className="sticky top-0 z-20 border-b-2 border-black bg-cream">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
        <Link to={`/space/${profile.handle}`} className="flex shrink-0 items-center gap-1.5 text-lg font-black tracking-tight">
          SPACES
          <span className="inline-block h-2 w-2 bg-spark" />
        </Link>

        <nav className="hidden border-2 border-black sm:flex">
          {items.map((item, i) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  i !== 0 ? 'border-l-2 border-black' : ''
                } ${active ? 'bg-black text-cream' : 'hover:bg-black/5'}`}
              >
                <Icon size={13} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-1.5 text-xs font-bold text-cream sm:px-3">
            <Zap size={13} className="text-spark" fill="#FF4F00" />
            {profile.sparks_balance}
          </div>
          <Link
            to={`/space/${profile.handle}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black text-[10px] font-black"
            style={{ backgroundColor: profile.color, color: profile.color === '#111111' ? '#FDFBF7' : '#111111' }}
            title={profile.display_name}
          >
            {initialsOf(profile.display_name)}
          </Link>
          <button
            onClick={signOut}
            className="hidden shrink-0 items-center justify-center border-2 border-black p-1.5 hover:bg-black/5 sm:flex"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <nav className="flex border-t-2 border-black sm:hidden">
        {items.map((item, i) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              className={`flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase ${
                i !== 0 ? 'border-l-2 border-black' : ''
              } ${active ? 'bg-black text-cream' : ''}`}
            >
              <Icon size={12} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
