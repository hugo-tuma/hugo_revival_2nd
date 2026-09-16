import { cn } from '../lib/cn';

/**
 * The one panel shape every screen reuses: a white card with a solid black
 * header strip and a plain body. Every view composes this instead of
 * hand-rolling its own card chrome.
 */
export default function RSpacePanel({ title, icon: Icon, right, children, className, bodyClassName }) {
  return (
    <div className={cn('border border-black bg-white', className)}>
      <div className="flex items-center gap-2 bg-black px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-white">
        {Icon && <Icon size={14} strokeWidth={1.75} />}
        <span className="flex-1 truncate">{title}</span>
        {right}
      </div>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </div>
  );
}
