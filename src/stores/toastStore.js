import { create } from 'zustand';

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = toast.id ?? `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.duration ?? 3200;
    set((s) => ({ toasts: [...s.toasts, { id, tone: 'default', ...toast, id, duration }] }));
    setTimeout(() => get().dismiss(id), duration);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toastSuccess(message) {
  return useToastStore.getState().push({ message, tone: 'success' });
}

export function toastError(message) {
  return useToastStore.getState().push({ message, tone: 'error', duration: 4200 });
}

export function toastSparks(amount, label) {
  const sign = amount > 0 ? '+' : '';
  return useToastStore.getState().push({
    message: `${sign}${amount} Sparks — ${label}`,
    tone: amount > 0 ? 'success' : 'spark',
  });
}
