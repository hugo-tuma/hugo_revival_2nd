import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { qk } from '../lib/queryClient';
import { startOfTodayIso } from '../utils/format';
import { toastError, toastSparks, toastSuccess } from '../stores/toastStore';

function assertSupabase() {
  if (!supabase) throw new Error('Supabase is not configured — see README.md.');
}

/* ------------------------------------------------------------------ */
/* Profiles                                                             */
/* ------------------------------------------------------------------ */

export function useProfileByHandle(handle) {
  return useQuery({
    queryKey: qk.profile(handle),
    enabled: Boolean(handle),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase.from('profiles').select('*').eq('handle', handle).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useProfileById(id) {
  return useQuery({
    queryKey: qk.profileById(id),
    enabled: Boolean(id),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile(profileId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch) => {
      assertSupabase();
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', profileId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(qk.profileById(profileId), data);
      queryClient.setQueryData(qk.profile(data.handle), data);
    },
    onError: (err) => toastError(err.message),
  });
}

export function useGlobalSearch(query) {
  const q = query.trim();
  return useQuery({
    queryKey: qk.search(q),
    enabled: q.length > 1,
    queryFn: async () => {
      assertSupabase();
      const like = `%${q}%`;
      const [tracksRes, profilesRes] = await Promise.all([
        supabase
          .from('tracks')
          .select('id, title, artist:profiles!tracks_user_id_fkey(handle, display_name)')
          .ilike('title', like)
          .limit(6),
        supabase
          .from('profiles')
          .select('*')
          .or(`handle.ilike.${like},display_name.ilike.${like}`)
          .limit(6),
      ]);
      if (tracksRes.error) throw tracksRes.error;
      if (profilesRes.error) throw profilesRes.error;
      return { tracks: tracksRes.data, profiles: profilesRes.data };
    },
  });
}

/* ------------------------------------------------------------------ */
/* Top 8                                                                */
/* ------------------------------------------------------------------ */

export function useTopFriends(userId) {
  return useQuery({
    queryKey: qk.topFriends(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('top_friends')
        .select('position, friend:profiles!top_friends_friend_id_fkey(*)')
        .eq('user_id', userId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data.map((row) => ({ ...row.friend, position: row.position }));
    },
  });
}

export function useReorderTopFriends(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedFriendIds) => {
      assertSupabase();
      const { error } = await supabase.rpc('reorder_top_friends', { p_friend_ids: orderedFriendIds });
      if (error) throw error;
    },
    onError: (err) => {
      toastError(err.message);
      queryClient.invalidateQueries({ queryKey: qk.topFriends(userId) });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Activity feed (query + realtime insert stream)                      */
/* ------------------------------------------------------------------ */

export function useFeed(viewerId) {
  const queryClient = useQueryClient();
  const queryKey = qk.feed(viewerId);

  const query = useQuery({
    queryKey,
    enabled: Boolean(viewerId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('feed_events')
        .select('*, actor:profiles!feed_events_actor_id_fkey(*)')
        .gte('created_at', startOfTodayIso())
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!supabase || !viewerId) return undefined;
    const channel = supabase
      .channel(`feed_events_stream`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_events' }, async (payload) => {
        const { data: actor } = await supabase.from('profiles').select('*').eq('id', payload.new.actor_id).single();
        queryClient.setQueryData(queryKey, (old) => {
          const next = { ...payload.new, actor };
          if (!old) return [next];
          if (old.some((e) => e.id === next.id)) return old;
          return [next, ...old];
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [viewerId, queryClient, queryKey]);

  return query;
}

export function usePostFeedEvent(viewerId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text) => {
      assertSupabase();
      const { data, error } = await supabase
        .from('feed_events')
        .insert({ actor_id: viewerId, type: 'post', metadata: { text } })
        .select('*, actor:profiles!feed_events_actor_id_fkey(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(qk.feed(viewerId), (old) => (old ? [data, ...old] : [data]));
    },
    onError: (err) => toastError(err.message),
  });
}

/* ------------------------------------------------------------------ */
/* Wall comments (query + realtime)                                    */
/* ------------------------------------------------------------------ */

export function useWallComments(targetUserId) {
  const queryClient = useQueryClient();
  const queryKey = qk.wallComments(targetUserId);

  const query = useQuery({
    queryKey,
    enabled: Boolean(targetUserId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('wall_comments')
        .select('*, author:profiles!wall_comments_author_id_fkey(*)')
        .eq('target_user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!supabase || !targetUserId) return undefined;
    const channel = supabase
      .channel(`wall_comments:${targetUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wall_comments', filter: `target_user_id=eq.${targetUserId}` },
        async (payload) => {
          const { data: author } = await supabase.from('profiles').select('*').eq('id', payload.new.author_id).single();
          queryClient.setQueryData(queryKey, (old) => {
            const next = { ...payload.new, author };
            if (!old) return [next];
            if (old.some((c) => c.id === next.id)) return old;
            return [next, ...old];
          });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [targetUserId, queryClient, queryKey]);

  return query;
}

export function usePostWallComment(targetUserId, authorId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text) => {
      assertSupabase();
      const { data, error } = await supabase
        .from('wall_comments')
        .insert({ target_user_id: targetUserId, author_id: authorId, text })
        .select('*, author:profiles!wall_comments_author_id_fkey(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(qk.wallComments(targetUserId), (old) =>
        old && old.some((c) => c.id === data.id) ? old : [data, ...(old ?? [])]
      );
    },
    onError: (err) => toastError(err.message),
  });
}

/* ------------------------------------------------------------------ */
/* Tracks + WIP notes                                                   */
/* ------------------------------------------------------------------ */

export function useTracks(userId, { wip = false } = {}) {
  return useQuery({
    queryKey: [...qk.tracks(userId), { wip }],
    enabled: Boolean(userId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_wip', wip)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTrack(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, duration, audio_url, waveform_data, is_wip }) => {
      assertSupabase();
      const { data, error } = await supabase
        .from('tracks')
        .insert({ user_id: userId, title, duration, audio_url, waveform_data, is_wip })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: qk.tracks(userId) });
      toastSuccess(`"${data.title}" uploaded.`);
    },
    onError: (err) => toastError(err.message),
  });
}

export function useTrackNotes(trackId) {
  const queryClient = useQueryClient();
  const queryKey = qk.trackNotes(trackId);

  const query = useQuery({
    queryKey,
    enabled: Boolean(trackId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('track_notes')
        .select('*, author:profiles!track_notes_user_id_fkey(*)')
        .eq('track_id', trackId)
        .order('timestamp_sec', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!supabase || !trackId) return undefined;
    const channel = supabase
      .channel(`track_notes:${trackId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'track_notes', filter: `track_id=eq.${trackId}` },
        async (payload) => {
          const { data: author } = await supabase.from('profiles').select('*').eq('id', payload.new.user_id).single();
          queryClient.setQueryData(queryKey, (old) => {
            const next = { ...payload.new, author };
            if (!old) return [next];
            if (old.some((n) => n.id === next.id)) return old;
            return [...old, next];
          });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [trackId, queryClient, queryKey]);

  return query;
}

export function useAddTrackNote(trackId, userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ timestamp_sec, content, parent_id = null }) => {
      assertSupabase();
      const { data, error } = await supabase
        .from('track_notes')
        .insert({ track_id: trackId, user_id: userId, timestamp_sec, content, parent_id })
        .select('*, author:profiles!track_notes_user_id_fkey(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(qk.trackNotes(trackId), (old) =>
        old && old.some((n) => n.id === data.id) ? old : [...(old ?? []), data]
      );
    },
    onError: (err) => toastError(err.message),
  });
}

/* ------------------------------------------------------------------ */
/* Merch + gigs                                                         */
/* ------------------------------------------------------------------ */

export function useMerch(artistId) {
  return useQuery({
    queryKey: qk.merch(artistId),
    enabled: Boolean(artistId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('merch_items')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function usePurchaseMerch(buyerId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ merchId, variant, priceSparks }) => {
      assertSupabase();
      const { data, error } = await supabase.rpc('purchase_merch', { p_merch_id: merchId, p_variant: variant });
      if (error) throw error;
      return { order: data, priceSparks };
    },
    onSuccess: ({ priceSparks }, { artistId }) => {
      queryClient.setQueryData(qk.profileById(buyerId), (old) =>
        old ? { ...old, sparks_balance: old.sparks_balance - priceSparks } : old
      );
      queryClient.invalidateQueries({ queryKey: qk.merch(artistId) });
      toastSparks(-priceSparks, 'Merch bought');
    },
    onError: (err) => toastError(err.message.replace(/_/g, ' ')),
  });
}

export function useCreateMerchItem(artistId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, priceSparks, variants, stock, imageColor, album }) => {
      assertSupabase();
      const { data, error } = await supabase
        .from('merch_items')
        .insert({
          artist_id: artistId,
          name,
          price_sparks: priceSparks,
          variants,
          stock,
          image_color: imageColor,
          album: album || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merch(artistId) });
      toastSuccess('Merch listed.');
    },
    onError: (err) => toastError(err.message),
  });
}

export function useGigs(artistId) {
  return useQuery({
    queryKey: qk.gigs(artistId),
    enabled: Boolean(artistId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('artist_id', artistId)
        .order('gig_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateGig(artistId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ gigDate, venue, city, priceCents, ticketUrl }) => {
      assertSupabase();
      const { data, error } = await supabase
        .from('gigs')
        .insert({ artist_id: artistId, gig_date: gigDate, venue, city, price_cents: priceCents, ticket_url: ticketUrl || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.gigs(artistId) });
      toastSuccess('Gig listed.');
    },
    onError: (err) => toastError(err.message),
  });
}

export function useToggleGigStatus(artistId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ gigId, status }) => {
      assertSupabase();
      const { data, error } = await supabase.from('gigs').update({ status }).eq('id', gigId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.gigs(artistId) }),
    onError: (err) => toastError(err.message),
  });
}

/* ------------------------------------------------------------------ */
/* Badges                                                               */
/* ------------------------------------------------------------------ */

export function useBadgesCatalog() {
  return useQuery({
    queryKey: qk.badges(),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase.from('badges').select('*').order('price_sparks', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useOwnedBadges(profileId) {
  return useQuery({
    queryKey: qk.ownedBadges(profileId),
    enabled: Boolean(profileId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('profile_badges')
        .select('badge:badges(*)')
        .eq('profile_id', profileId);
      if (error) throw error;
      return data.map((row) => row.badge);
    },
  });
}

export function usePurchaseBadge(profileId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ badgeId, priceSparks }) => {
      assertSupabase();
      const { data, error } = await supabase.rpc('purchase_badge', { p_badge_id: badgeId });
      if (error) throw error;
      return { data, priceSparks };
    },
    onSuccess: ({ priceSparks }, { badgeName }) => {
      queryClient.setQueryData(qk.profileById(profileId), (old) =>
        old ? { ...old, sparks_balance: old.sparks_balance - priceSparks } : old
      );
      queryClient.invalidateQueries({ queryKey: qk.ownedBadges(profileId) });
      toastSparks(-priceSparks, `${badgeName} minted`);
    },
    onError: (err) => toastError(err.message.replace(/_/g, ' ')),
  });
}

/* ------------------------------------------------------------------ */
/* Sparks: tips + monthly support                                       */
/* ------------------------------------------------------------------ */

export function useTipArtist(senderId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipientId, amount }) => {
      assertSupabase();
      const { data, error } = await supabase.rpc('tip_artist', { recipient_id: recipientId, amount });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { amount, recipientId }) => {
      queryClient.setQueryData(qk.profileById(senderId), (old) =>
        old ? { ...old, sparks_balance: old.sparks_balance - amount } : old
      );
      queryClient.invalidateQueries({ queryKey: qk.profileById(recipientId) });
      toastSparks(-amount, 'Tip sent');
    },
    onError: (err) => toastError(err.message.replace(/_/g, ' ')),
  });
}

export function useIsSupporting(supporterId, artistId) {
  return useQuery({
    queryKey: qk.support(supporterId, artistId),
    enabled: Boolean(supporterId && artistId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('supports')
        .select('*')
        .eq('supporter_id', supporterId)
        .eq('artist_id', artistId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleSupport(supporterId, artistId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (monthlyAmount = 50) => {
      assertSupabase();
      const { data, error } = await supabase.rpc('toggle_support', {
        p_artist_id: artistId,
        p_monthly_amount: monthlyAmount,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(qk.support(supporterId, artistId), data);
      if (data.active) {
        queryClient.setQueryData(qk.profileById(supporterId), (old) =>
          old ? { ...old, sparks_balance: old.sparks_balance - data.monthly_amount } : old
        );
        toastSparks(-data.monthly_amount, 'Supporting monthly');
      } else {
        toastSuccess('Monthly support paused.');
      }
    },
    onError: (err) => toastError(err.message.replace(/_/g, ' ')),
  });
}

/* ------------------------------------------------------------------ */
/* Follows                                                              */
/* ------------------------------------------------------------------ */

export function useFollowerCount(profileId) {
  return useQuery({
    queryKey: qk.follows(profileId),
    enabled: Boolean(profileId),
    queryFn: async () => {
      assertSupabase();
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('followee_id', profileId);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useIsFollowing(followerId, followeeId) {
  return useQuery({
    queryKey: ['isFollowing', followerId, followeeId],
    enabled: Boolean(followerId && followeeId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('followee_id', followeeId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useToggleFollow(followerId, followeeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (currentlyFollowing) => {
      assertSupabase();
      if (currentlyFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('followee_id', followeeId);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
      if (error) throw error;
      return true;
    },
    onSuccess: (nowFollowing) => {
      queryClient.setQueryData(['isFollowing', followerId, followeeId], nowFollowing);
      queryClient.invalidateQueries({ queryKey: qk.follows(followeeId) });
    },
    onError: (err) => toastError(err.message),
  });
}

/* ------------------------------------------------------------------ */
/* Library: playlists + liked songs                                     */
/* ------------------------------------------------------------------ */

export function usePlaylists(userId) {
  return useQuery({
    queryKey: qk.playlists(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('playlists')
        .select('*, playlist_tracks(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePlaylist(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name) => {
      assertSupabase();
      const { data, error } = await supabase.from('playlists').insert({ user_id: userId, name }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.playlists(userId) });
      toastSuccess('Playlist created.');
    },
    onError: (err) => toastError(err.message),
  });
}

export function useDeletePlaylist(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playlistId) => {
      assertSupabase();
      const { error } = await supabase.from('playlists').delete().eq('id', playlistId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.playlists(userId) }),
    onError: (err) => toastError(err.message),
  });
}

export function usePlaylistTracks(playlistId) {
  return useQuery({
    queryKey: qk.playlistTracks(playlistId),
    enabled: Boolean(playlistId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select('position, added_at, track:tracks(*, profiles(handle, display_name))')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddToPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playlistId, trackId }) => {
      assertSupabase();
      const { error } = await supabase.from('playlist_tracks').insert({ playlist_id: playlistId, track_id: trackId });
      if (error) throw error;
    },
    onSuccess: (_data, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: qk.playlistTracks(playlistId) });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toastSuccess('Added to playlist.');
    },
    onError: (err) => toastError(err.message),
  });
}

export function useRemoveFromPlaylist(playlistId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trackId) => {
      assertSupabase();
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.playlistTracks(playlistId) }),
    onError: (err) => toastError(err.message),
  });
}

export function useLikedTracks(userId) {
  return useQuery({
    queryKey: qk.likedTracks(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('track_likes')
        .select('created_at, track:tracks(*, profiles(handle, display_name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useIsTrackLiked(userId, trackId) {
  return useQuery({
    queryKey: qk.isTrackLiked(userId, trackId),
    enabled: Boolean(userId && trackId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('track_likes')
        .select('*')
        .eq('user_id', userId)
        .eq('track_id', trackId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useToggleTrackLike(userId, trackId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (currentlyLiked) => {
      assertSupabase();
      if (currentlyLiked) {
        const { error } = await supabase.from('track_likes').delete().eq('user_id', userId).eq('track_id', trackId);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from('track_likes').insert({ user_id: userId, track_id: trackId });
      if (error) throw error;
      return true;
    },
    onSuccess: (nowLiked) => {
      queryClient.setQueryData(qk.isTrackLiked(userId, trackId), nowLiked);
      queryClient.invalidateQueries({ queryKey: qk.likedTracks(userId) });
    },
    onError: (err) => toastError(err.message),
  });
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function useNotifications(userId) {
  const queryClient = useQueryClient();
  const queryKey = qk.notifications(userId);

  const query = useQuery({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(*)')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!supabase || !userId) return undefined;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        async (payload) => {
          const { data: actor } = payload.new.actor_id
            ? await supabase.from('profiles').select('*').eq('id', payload.new.actor_id).single()
            : { data: null };
          queryClient.setQueryData(queryKey, (old) => {
            const next = { ...payload.new, actor };
            if (!old) return [next];
            if (old.some((n) => n.id === next.id)) return old;
            return [next, ...old];
          });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, queryClient, queryKey]);

  return query;
}

export function useUnreadNotificationCount(userId) {
  return useQuery({
    queryKey: qk.unreadNotifications(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      assertSupabase();
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('read', false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkNotificationsRead(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      assertSupabase();
      const { error } = await supabase.from('notifications').update({ read: true }).eq('recipient_id', userId).eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications(userId) });
      queryClient.setQueryData(qk.unreadNotifications(userId), 0);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Direct messages                                                      */
/* ------------------------------------------------------------------ */

export function useConversations(userId) {
  return useQuery({
    queryKey: qk.conversations(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('conversations')
        .select('*, user_a:profiles!conversations_user_a_id_fkey(*), user_b:profiles!conversations_user_b_id_fkey(*)')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((c) => ({ ...c, other: c.user_a_id === userId ? c.user_b : c.user_a }));
    },
  });
}

export function useConversation(conversationId, viewerId) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    enabled: Boolean(conversationId && viewerId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('conversations')
        .select('*, user_a:profiles!conversations_user_a_id_fkey(*), user_b:profiles!conversations_user_b_id_fkey(*)')
        .eq('id', conversationId)
        .single();
      if (error) throw error;
      return { ...data, other: data.user_a_id === viewerId ? data.user_b : data.user_a };
    },
  });
}

export function useGetOrCreateConversation() {
  return useMutation({
    mutationFn: async (otherUserId) => {
      assertSupabase();
      const { data, error } = await supabase.rpc('get_or_create_conversation', { p_other_user_id: otherUserId });
      if (error) throw error;
      return data;
    },
    onError: (err) => toastError(err.message.replace(/_/g, ' ')),
  });
}

export function useMessages(conversationId) {
  const queryClient = useQueryClient();
  const queryKey = qk.messages(conversationId);

  const query = useQuery({
    queryKey,
    enabled: Boolean(conversationId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!supabase || !conversationId) return undefined;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          queryClient.setQueryData(queryKey, (old) => {
            if (!old) return [payload.new];
            if (old.some((m) => m.id === payload.new.id)) return old;
            return [...old, payload.new];
          });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [conversationId, queryClient, queryKey]);

  return query;
}

export function useSendMessage(conversationId, senderId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content) => {
      assertSupabase();
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: senderId, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(qk.messages(conversationId), (old) =>
        old && old.some((m) => m.id === data.id) ? old : [...(old ?? []), data]
      );
    },
    onError: (err) => toastError(err.message),
  });
}

/* ------------------------------------------------------------------ */
/* Directories: artists + gigs                                         */
/* ------------------------------------------------------------------ */

export function useAllArtists() {
  return useQuery({
    queryKey: qk.allArtists(),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'artist')
        .order('display_name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllGigs() {
  return useQuery({
    queryKey: qk.allGigs(),
    queryFn: async () => {
      assertSupabase();
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('gigs')
        .select('*, artist:profiles!gigs_artist_id_fkey(handle, display_name)')
        .gte('gig_date', today)
        .order('gig_date', { ascending: true });
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
    queryKey: qk.groups(),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('groups')
        .select('*, owner:profiles!groups_owner_id_fkey(handle, display_name), group_members(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useGroup(groupId) {
  return useQuery({
    queryKey: ['group', groupId],
    enabled: Boolean(groupId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('groups')
        .select('*, owner:profiles!groups_owner_id_fkey(handle, display_name), group_members(count)')
        .eq('id', groupId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateGroup(ownerId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }) => {
      assertSupabase();
      const { data, error } = await supabase
        .from('groups')
        .insert({ owner_id: ownerId, name, description })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.groups() });
      toastSuccess('Group created.');
    },
    onError: (err) => toastError(err.message),
  });
}

export function useIsGroupMember(groupId, userId) {
  return useQuery({
    queryKey: [...qk.groupMembers(groupId), 'is', userId],
    enabled: Boolean(groupId && userId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useToggleGroupMembership(groupId, userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (currentlyMember) => {
      assertSupabase();
      if (currentlyMember) {
        const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId });
      if (error) throw error;
      return true;
    },
    onSuccess: (nowMember) => {
      queryClient.setQueryData([...qk.groupMembers(groupId), 'is', userId], nowMember);
      queryClient.invalidateQueries({ queryKey: qk.groups() });
    },
    onError: (err) => toastError(err.message),
  });
}

export function useGroupPosts(groupId) {
  const queryClient = useQueryClient();
  const queryKey = qk.groupPosts(groupId);

  const query = useQuery({
    queryKey,
    enabled: Boolean(groupId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('group_posts')
        .select('*, author:profiles!group_posts_author_id_fkey(*)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!supabase || !groupId) return undefined;
    const channel = supabase
      .channel(`group_posts:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_posts', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          const { data: author } = await supabase.from('profiles').select('*').eq('id', payload.new.author_id).single();
          queryClient.setQueryData(queryKey, (old) => {
            const next = { ...payload.new, author };
            if (!old) return [next];
            if (old.some((p) => p.id === next.id)) return old;
            return [next, ...old];
          });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [groupId, queryClient, queryKey]);

  return query;
}

export function usePostToGroup(groupId, authorId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content) => {
      assertSupabase();
      const { data, error } = await supabase
        .from('group_posts')
        .insert({ group_id: groupId, author_id: authorId, content })
        .select('*, author:profiles!group_posts_author_id_fkey(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(qk.groupPosts(groupId), (old) =>
        old && old.some((p) => p.id === data.id) ? old : [data, ...(old ?? [])]
      );
    },
    onError: (err) => toastError(err.message),
  });
}

/* ------------------------------------------------------------------ */
/* Payouts (read-only earnings dashboard, artists only)                 */
/* ------------------------------------------------------------------ */

export function usePayoutSummary(artistId) {
  return useQuery({
    queryKey: qk.payoutSummary(artistId),
    enabled: Boolean(artistId),
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase
        .from('sparks_ledger')
        .select('*')
        .eq('to_id', artistId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const byCategory = data.reduce((acc, row) => {
        acc[row.category] = (acc[row.category] || 0) + row.amount;
        return acc;
      }, {});
      const total = data.reduce((sum, row) => sum + row.amount, 0);

      return { rows: data, byCategory, total };
    },
  });
}

/* ------------------------------------------------------------------ */
/* Marketplace: merch + badges combined                                 */
/* ------------------------------------------------------------------ */

const MARKETPLACE_PAGE_SIZE = 48;

export function useMarketplace({ page = 0, artistId = '', badgeType = '', album = '' } = {}) {
  return useQuery({
    queryKey: qk.marketplace({ page, artistId, badgeType, album }),
    queryFn: async () => {
      assertSupabase();

      let merchQuery = supabase
        .from('merch_items')
        .select('*, artist:profiles!merch_items_artist_id_fkey(handle, display_name)')
        .gt('stock', 0);
      if (artistId) merchQuery = merchQuery.eq('artist_id', artistId);
      if (album) merchQuery = merchQuery.ilike('album', `%${album}%`);

      // Artist/album filters describe merch fields the platform badge catalog
      // doesn't have, so either filter simply excludes every badge.
      const skipBadges = Boolean(artistId || album);
      let badgesQuery = supabase.from('badges').select('*');
      if (badgeType) badgesQuery = badgesQuery.eq('type', badgeType);

      const [merchRes, badgesRes] = await Promise.all([
        merchQuery,
        skipBadges ? Promise.resolve({ data: [], error: null }) : badgesQuery,
      ]);
      if (merchRes.error) throw merchRes.error;
      if (badgesRes.error) throw badgesRes.error;

      const items = [
        ...merchRes.data.map((m) => ({ ...m, kind: 'merch', key: `merch-${m.id}` })),
        ...badgesRes.data.map((b) => ({ ...b, kind: 'badge', key: `badge-${b.id}` })),
      ].sort((a, b) => a.key.localeCompare(b.key));

      const start = page * MARKETPLACE_PAGE_SIZE;
      return {
        items: items.slice(start, start + MARKETPLACE_PAGE_SIZE),
        total: items.length,
        pageSize: MARKETPLACE_PAGE_SIZE,
      };
    },
  });
}

export function useMarketplaceFacets() {
  return useQuery({
    queryKey: ['marketplaceFacets'],
    queryFn: async () => {
      assertSupabase();
      const [artistsRes, badgesRes, albumsRes] = await Promise.all([
        supabase.from('profiles').select('id, handle, display_name').eq('role', 'artist'),
        supabase.from('badges').select('type'),
        supabase.from('merch_items').select('album').not('album', 'is', null),
      ]);
      if (artistsRes.error) throw artistsRes.error;
      if (badgesRes.error) throw badgesRes.error;
      if (albumsRes.error) throw albumsRes.error;

      return {
        artists: artistsRes.data,
        badgeTypes: Array.from(new Set(badgesRes.data.map((b) => b.type))).filter(Boolean),
        albums: Array.from(new Set(albumsRes.data.map((m) => m.album))).filter(Boolean),
      };
    },
  });
}
