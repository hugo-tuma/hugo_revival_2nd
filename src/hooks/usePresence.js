import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { usePresenceStore } from '../stores/presenceStore';

// A single Supabase Realtime Presence channel represents "who's online right
// now" across the whole app. This hook is mounted exactly once (at the App
// root) and keeps module-scoped refs so other parts of the app — like the
// global audio player announcing what track you're listening to — can push
// presence updates via updateMyListening() without opening a second socket.
let channelRef = null;
let selfPayloadRef = null;

export function usePresence(profile) {
  const setOnline = usePresenceStore((s) => s.setOnline);

  useEffect(() => {
    if (!supabase || !profile?.id) return undefined;

    const channel = supabase.channel('space:online', {
      config: { presence: { key: profile.id } },
    });
    channelRef = channel;
    selfPayloadRef = {
      id: profile.id,
      handle: profile.handle,
      display_name: profile.display_name,
      color: profile.color,
      listening_to: null,
    };

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const map = {};
      for (const key of Object.keys(state)) {
        const presences = state[key];
        if (presences && presences[0]) map[key] = presences[0];
      }
      setOnline(map);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(selfPayloadRef);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      channelRef = null;
      selfPayloadRef = null;
      setOnline({});
    };
  }, [profile?.id, profile?.handle, profile?.display_name, profile?.color, setOnline]);
}

export function updateMyListening(trackTitle) {
  if (!channelRef || !selfPayloadRef) return;
  selfPayloadRef = { ...selfPayloadRef, listening_to: trackTitle };
  channelRef.track(selfPayloadRef);
}
