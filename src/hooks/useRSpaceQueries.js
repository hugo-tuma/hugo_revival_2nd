import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

function assertSupabase() {
  if (!supabase) throw new Error('Supabase is not configured — see README.md.');
}

/* ------------------------------------------------------------------ */
/* Artists                                                              */
/* ------------------------------------------------------------------ */

export function useArtists() {
  return useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, handle, display_name, avatar_url, color, bio_mood, is_verified')
        .eq('role', 'artist')
        .order('display_name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/* ------------------------------------------------------------------ */
/* Gigs                                                                 */
/* ------------------------------------------------------------------ */

export function useGigs() {
  return useQuery({
    queryKey: ['gigs'],
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('gigs')
        .select('*, artist:profiles!gigs_artist_id_fkey(handle, display_name, color)')
        .order('gig_date', { ascending: true })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
}

/* ------------------------------------------------------------------ */
/* Groups                                                               */
/* ------------------------------------------------------------------ */

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('groups')
        .select('*, owner:profiles!groups_owner_id_fkey(handle, display_name), group_members(count)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data.map((g) => ({ ...g, member_count: g.group_members?.[0]?.count ?? 0 }));
    },
  });
}

/* ------------------------------------------------------------------ */
/* Library: public playlists + community top-liked tracks               */
/* ------------------------------------------------------------------ */

export function usePublicPlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('playlists')
        .select('*, owner:profiles!playlists_user_id_fkey(handle, display_name), playlist_tracks(count)')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data.map((p) => ({ ...p, track_count: p.playlist_tracks?.[0]?.count ?? 0 }));
    },
  });
}

// Single source of the track catalog (with artist + like count attached),
// shared by Library's "Liked Songs" and the Music Player view so both
// derive from one query instead of duplicating it.
export function useTrackCatalog() {
  return useQuery({
    queryKey: ['trackCatalog'],
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('tracks')
        .select('*, artist:profiles!tracks_user_id_fkey(handle, display_name, color), track_likes(count)')
        .eq('is_wip', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((t) => ({ ...t, like_count: t.track_likes?.[0]?.count ?? 0 }));
    },
  });
}

export function useTopLikedTracks(limit = 8) {
  const { data, ...rest } = useTrackCatalog();
  const topLiked = useMemo(
    () => (data ? [...data].sort((a, b) => b.like_count - a.like_count).slice(0, limit) : undefined),
    [data, limit]
  );
  return { ...rest, data: topLiked };
}

export function useGroupPosts(groupId) {
  return useQuery({
    queryKey: ['groupPosts', groupId],
    enabled: Boolean(groupId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('group_posts')
        .select('*, author:profiles!group_posts_author_id_fkey(handle, display_name, color)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/* ------------------------------------------------------------------ */
/* Shop                                                                 */
/* ------------------------------------------------------------------ */

export function useMerchItems() {
  return useQuery({
    queryKey: ['merchItems'],
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('merch_items')
        .select('*, artist:profiles!merch_items_artist_id_fkey(handle, display_name, color)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/* ------------------------------------------------------------------ */
/* Sparks / Payouts — public, privacy-preserving aggregates             */
/* (see supabase/migrations/0006_public_showcase_views.sql)             */
/* ------------------------------------------------------------------ */

export function useArtistEarningsList() {
  return useQuery({
    queryKey: ['artistEarnings'],
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('artist_earnings_public')
        .select('*')
        .order('lifetime_total', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRecentActivity({ artistId, limit = 12 } = {}) {
  return useQuery({
    queryKey: ['recentActivity', artistId ?? 'global', limit],
    queryFn: async () => {
      assertSupabase();
      let query = supabase
        .from('recent_activity_public')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (artistId) query = query.eq('artist_id', artistId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
