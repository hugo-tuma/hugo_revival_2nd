import { X } from 'lucide-react';

export default function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="animate-drawer-up absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto border-t-2 border-black bg-cream">
        <div className="sticky top-0 flex items-center justify-between border-b-2 border-black bg-black px-3 py-2 text-cream">
          <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
          <button onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="p-3 pb-28">{children}</div>
      </div>
    </div>
  );
}
