import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// The app is fully wired against a real Supabase backend, but this repo
// ships without live credentials — those are infrastructure you provision
// (see README.md), not something that can be hardcoded here. When they're
// absent we surface a setup screen instead of throwing a blank crash.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null;

export const AUDIO_BUCKET = 'audio';

export function getPublicAudioUrl(storagePath) {
  if (!supabase) return '';
  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function audioStoragePath(userId, file) {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'audio';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return `${userId}/${safeName}`;
}
