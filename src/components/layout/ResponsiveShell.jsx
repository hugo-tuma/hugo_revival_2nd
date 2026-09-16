import { useState } from 'react';
import Drawer from '../ui/Drawer';

/**
 * Desktop (>=1024px): renders every column side by side in the brutalist
 * 3-column grid. Mobile (<1024px): only the first column stays inline; the
 * rest collapse into a tab bar of bottom-sheet drawers so nothing about the
 * dense 3-column layout gets cramped or clipped on a phone.
 */
export default function ResponsiveShell({ columns, gridClassName }) {
  const [openKey, setOpenKey] = useState(null);
  const [primary, ...rest] = columns;

  return (
    <>
      <div
        className={
          gridClassName ??
          'grid grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,280px)_1fr_minmax(0,260px)]'
        }
      >
        <div>{primary.content}</div>
        {rest.map((col) => (
          <div key={col.key} className="hidden lg:block">
            {col.content}
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="fixed inset-x-0 bottom-14 z-20 flex border-t-2 border-black bg-cream lg:hidden">
          {rest.map((col) => (
            <button
              key={col.key}
              onClick={() => setOpenKey(col.key)}
              className="flex flex-1 items-center justify-center gap-1.5 border-r-2 border-black py-2.5 text-[10px] font-bold uppercase last:border-r-0"
            >
              <col.icon size={13} />
              {col.label}
            </button>
          ))}
        </div>
      )}

      {rest.map((col) => (
        <Drawer key={col.key} open={openKey === col.key} onClose={() => setOpenKey(null)} title={col.label}>
          {col.content}
        </Drawer>
      ))}
    </>
  );
}
