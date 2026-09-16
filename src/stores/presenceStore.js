import { create } from 'zustand';

// Populated by usePresence() from a Supabase Realtime Presence channel.
// Keyed by profile id -> { id, handle, display_name, color, listening_to }.
export const usePresenceStore = create((set) => ({
  online: {},
  setOnline: (online) => set({ online }),
  setListeningTo: (id, trackTitle) =>
    set((s) => ({
      online: {
        ...s.online,
        [id]: s.online[id] ? { ...s.online[id], listening_to: trackTitle } : s.online[id],
      },
    })),
}));
