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
    mutationFn: async ({ name, priceSparks, variants, stock, imageColor }) => {
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
/* Forking                                                              */
/* ------------------------------------------------------------------ */

export function useForkSpace(callerId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetProfileId) => {
      assertSupabase();
      const { data, error } = await supabase.rpc('fork_space', { p_target_profile_id: targetProfileId });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, targetProfileId) => {
      queryClient.setQueryData(qk.profileById(callerId), data);
      queryClient.setQueryData(qk.profile(data.handle), data);
      queryClient.invalidateQueries({ queryKey: qk.profileById(targetProfileId) });
      toastSuccess('Forked into your Customize draft.');
    },
    onError: (err) => toastError(err.message.replace(/_/g, ' ')),
  });
}
