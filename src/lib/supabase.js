import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

// R'SPACE is a public showcase: every view is readable with no session at
// all (the seeded demo profiles can't log in — see supabase/seed.sql), so
// this client never signs in and every query below runs as the anon role.
// Without credentials configured we show a setup screen instead of a blank
// crash — that's the honest state of a backend-dependent app with no
// backend attached yet, not a placeholder feature.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
