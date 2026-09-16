import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Supabase Auth (via its own localStorage-persisted GoTrue session) remains
// the source of truth; this store only caches the resolved profile so the
// header/nav can paint instantly on reload instead of flashing logged-out
// while the auth listener re-hydrates.
export const useSessionStore = create(
  persist(
    (set) => ({
      userId: null,
      profile: null,
      setSession: (userId) => set({ userId }),
      setProfile: (profile) => set({ profile, userId: profile?.id ?? null }),
      clear: () => set({ userId: null, profile: null }),
    }),
    {
      name: 'spaces-session-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
