import * as Tooltip from '@radix-ui/react-tooltip';
import { NAV_ITEMS } from '../../lib/navItems';
import { cn } from '../../lib/cn';

function NavRow({ item, active, collapsed, onSelect }) {
  const Icon = item.icon;

  const button = (
    <button
      onClick={() => onSelect(item.id)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-3 border border-transparent px-3 py-2 text-left font-sans text-sm transition-colors',
        collapsed && 'justify-center px-0',
        active ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'
      )}
    >
      <Icon size={17} strokeWidth={1.5} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="z-50 border border-black bg-white px-2 py-1 font-sans text-xs text-black shadow-none"
        >
          {item.label}
          <Tooltip.Arrow className="fill-black" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function Sidebar({ activeView, onSelect, collapsed }) {
  return (
    <aside
      className={cn(
        'shrink-0 border-r border-black bg-white transition-[width] duration-150',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      <nav className="flex flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.id} item={item} active={activeView === item.id} collapsed={collapsed} onSelect={onSelect} />
        ))}
      </nav>
    </aside>
  );
}
