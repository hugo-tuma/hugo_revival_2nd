import { Link } from 'react-router-dom';
import { LogOut, MessageCircle, ShoppingBag, Zap } from 'lucide-react';
import { useAuth } from '../auth/AuthGate';
import { initialsOf } from '../../utils/format';
import GlobalSearch from './GlobalSearch';
import HamburgerMenu from './HamburgerMenu';

export default function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b-2 border-black bg-cream">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
        <HamburgerMenu profile={profile} />

        <Link to={`/space/${profile.handle}`} className="flex shrink-0 items-center gap-1.5 text-lg font-black tracking-tight">
          R'SPACE
          <span className="inline-block h-2 w-2 bg-spark" />
        </Link>

        <GlobalSearch />

        <Link
          to="/store"
          className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black hover:bg-black/5"
          aria-label="Store"
          title="Store"
        >
          <ShoppingBag size={15} />
        </Link>
        <Link
          to="/messages"
          className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black hover:bg-black/5"
          aria-label="Messages"
          title="Messages"
        >
          <MessageCircle size={15} />
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-1.5 text-xs font-bold text-cream sm:px-3">
            <Zap size={13} className="text-spark" fill="#FF4F00" />
            {profile.sparks_balance}
          </div>
          <Link
            to="/customize"
            className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black text-[10px] font-black"
            style={{ backgroundColor: profile.color, color: profile.color === '#111111' ? '#FDFBF7' : '#111111' }}
            title="Customize profile"
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
    </header>
  );
}
