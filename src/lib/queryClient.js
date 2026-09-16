import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const qk = {
  profile: (handle) => ['profile', handle],
  profileById: (id) => ['profileById', id],
  topFriends: (userId) => ['topFriends', userId],
  feed: (viewerId) => ['feed', viewerId],
  wallComments: (targetUserId) => ['wallComments', targetUserId],
  tracks: (userId) => ['tracks', userId],
  trackNotes: (trackId) => ['trackNotes', trackId],
  merch: (artistId) => ['merch', artistId],
  gigs: (artistId) => ['gigs', artistId],
  badges: () => ['badges'],
  ownedBadges: (profileId) => ['ownedBadges', profileId],
  follows: (profileId) => ['follows', profileId],
  support: (supporterId, artistId) => ['support', supporterId, artistId],
  search: (query) => ['search', query],
  playlists: (userId) => ['playlists', userId],
  playlistTracks: (playlistId) => ['playlistTracks', playlistId],
  likedTracks: (userId) => ['likedTracks', userId],
  isTrackLiked: (userId, trackId) => ['isTrackLiked', userId, trackId],
  notifications: (userId) => ['notifications', userId],
  unreadNotifications: (userId) => ['unreadNotifications', userId],
  conversations: (userId) => ['conversations', userId],
  messages: (conversationId) => ['messages', conversationId],
  allArtists: () => ['allArtists'],
  allGigs: () => ['allGigs'],
  groups: () => ['groups'],
  groupMembers: (groupId) => ['groupMembers', groupId],
  groupPosts: (groupId) => ['groupPosts', groupId],
  myGroups: (userId) => ['myGroups', userId],
  payoutSummary: (artistId) => ['payoutSummary', artistId],
  marketplace: (filters) => ['marketplace', filters],
};
