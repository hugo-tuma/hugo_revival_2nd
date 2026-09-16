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
};
