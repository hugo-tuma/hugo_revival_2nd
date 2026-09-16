import { diffLines } from 'diff';
import { GitFork, X } from 'lucide-react';

function CssDiff({ oldCss, newCss }) {
  const parts = diffLines(oldCss || '', newCss || '');
  if (oldCss === newCss) {
    return <p className="text-[10px] text-black/40">No CSS changes.</p>;
  }
  return (
    <pre className="max-h-48 overflow-y-auto border-2 border-black bg-cream p-2 text-[10px] leading-relaxed">
      {parts.map((part, i) => {
        const lines = part.value.split('\n').filter((l, idx, arr) => !(idx === arr.length - 1 && l === ''));
        return (
          <div key={i} className={part.added ? 'bg-green-200' : part.removed ? 'bg-red-200' : ''}>
            {lines.map((line, j) => (
              <div key={j} className={part.removed ? 'line-through' : ''}>
                {part.added ? '+ ' : part.removed ? '- ' : '  '}
                {line}
              </div>
            ))}
          </div>
        );
      })}
    </pre>
  );
}

function VarsDiff({ oldVars = {}, newVars = {} }) {
  const keys = Array.from(new Set([...Object.keys(oldVars || {}), ...Object.keys(newVars || {})]));
  const changed = keys.filter((k) => oldVars?.[k] !== newVars?.[k]);
  if (changed.length === 0) return <p className="text-[10px] text-black/40">No theme variable changes.</p>;
  return (
    <table className="w-full text-[10px]">
      <tbody>
        {changed.map((k) => (
          <tr key={k} className="border-b border-black/10">
            <td className="py-1 pr-2 font-bold">{k}</td>
            <td className="py-1 pr-2 text-black/40 line-through">{String(oldVars?.[k] ?? '—')}</td>
            <td className="py-1 font-bold text-green-700">{String(newVars?.[k] ?? '—')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Preview a fork before committing to it: diffs the target Space's raw
 * custom_css and theme_vars against the caller's current draft so a fork
 * never silently clobbers unsaved customization.
 */
export default function ForkDiffViewer({ source, mine, onConfirm, onCancel, busy }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg border-2 border-black bg-white">
        <div className="flex items-center justify-between border-b-2 border-black bg-black px-3 py-2 text-cream">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
            <GitFork size={13} /> Fork preview: @{source.handle} &rarr; you
          </span>
          <button onClick={onCancel} aria-label="Cancel">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 p-3">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase text-black/50">Theme variables</p>
            <VarsDiff oldVars={mine.theme_vars} newVars={source.theme_vars} />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase text-black/50">Custom CSS</p>
            <CssDiff oldCss={mine.custom_css} newCss={source.custom_css} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="border-2 border-black px-3 py-1.5 text-xs font-bold uppercase hover:bg-black/5">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="border-2 border-black bg-spark px-3 py-1.5 text-xs font-bold uppercase hover:bg-black hover:text-cream disabled:opacity-50"
            >
              Confirm fork
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
