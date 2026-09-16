import { LogOut, Menu, MessageSquare, Search, ShoppingBag } from 'lucide-react';
import SparkBadge from '../SparkBadge';

const ICON_BUTTON =
  'flex h-8 w-8 items-center justify-center border border-transparent text-black hover:border-black hover:bg-neutral-100';

export default function TopBar({ sidebarCollapsed, onToggleSidebar, searchValue, onSearchChange, sparksBalance = 0 }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-black bg-white px-3 sm:px-4">
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className={ICON_BUTTON}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={!sidebarCollapsed}
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
        <span className="flex items-center gap-1 font-mono text-sm font-semibold tracking-wide">
          R&rsquo;SPACE
          <span className="inline-block h-2 w-2 bg-black" aria-hidden="true" />
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-md items-center gap-2 border border-black bg-white px-2.5 py-1.5">
        <Search size={15} strokeWidth={1.5} className="shrink-0 text-neutral-500" />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tracks, artists, users"
          className="w-full bg-transparent font-sans text-sm outline-none placeholder:text-neutral-400"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button className={ICON_BUTTON} aria-label="Store">
          <ShoppingBag size={17} strokeWidth={1.5} />
        </button>
        <button className={ICON_BUTTON} aria-label="Messages">
          <MessageSquare size={17} strokeWidth={1.5} />
        </button>
        <SparkBadge value={sparksBalance} />
        <div
          className="flex h-8 w-8 items-center justify-center border border-black font-mono text-[11px] font-semibold"
          title="Account"
        >
          AU
        </div>
        <button className={ICON_BUTTON} aria-label="Log out">
          <LogOut size={17} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
