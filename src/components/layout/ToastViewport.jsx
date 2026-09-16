import { CheckCircle2, X, XCircle, Zap } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

const TONE_STYLES = {
  default: 'bg-black text-cream',
  success: 'bg-black text-cream',
  error: 'bg-red-600 text-cream',
  spark: 'bg-spark text-black',
};

const TONE_ICON = {
  default: CheckCircle2,
  success: CheckCircle2,
  error: XCircle,
  spark: Zap,
};

// Brutalist replacement for native browser alerts — every Sparks
// transaction (tips, merch, badges, support) surfaces here instead.
export default function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-3 top-16 z-50 flex w-64 flex-col gap-2 sm:right-4 sm:top-20">
      {toasts.map((t) => {
        const Icon = TONE_ICON[t.tone] ?? CheckCircle2;
        return (
          <div
            key={t.id}
            className={`animate-toast-in flex items-start gap-2 border-2 border-black px-3 py-2 text-xs font-bold shadow-[3px_3px_0_0_#111111] ${
              TONE_STYLES[t.tone] ?? TONE_STYLES.default
            }`}
          >
            <Icon size={14} className="mt-0.5 shrink-0" fill={t.tone === 'spark' ? 'currentColor' : 'none'} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
