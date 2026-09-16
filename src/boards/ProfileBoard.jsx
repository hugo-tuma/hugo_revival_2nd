import { useParams } from 'react-router-dom';
import { Home, Radio, Users } from 'lucide-react';
import { useProfileByHandle, useTracks } from '../hooks/useSpacesQueries';
import { useAuth } from '../components/auth/AuthGate';
import ResponsiveShell from '../components/layout/ResponsiveShell';
import SanitizedStyle from '../components/SanitizedStyle';
import ArtistHeader from '../components/artist/ArtistHeader';
import ProfileCard from '../components/home/ProfileCard';
import TrackPlayerCard from '../components/home/TrackPlayerCard';
import Top8Grid from '../components/home/Top8Grid';
import ActivityFeed from '../components/home/ActivityFeed';
import RightRail from '../components/home/RightRail';
import GigList from '../components/artist/GigList';
import MerchShop from '../components/artist/MerchShop';
import WipStemPlayer from '../components/audio/WipStemPlayer';
import TrackUploadForm from '../components/audio/TrackUploadForm';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function ProfileBoard() {
  const { handle } = useParams();
  const { profile: viewerProfile } = useAuth();
  const { data: profile, isLoading, isError, error } = useProfileByHandle(handle);
  const isArtist = profile?.role === 'artist';
  const { data: wipTracks, isLoading: wipLoading } = useTracks(isArtist ? profile?.id : undefined, { wip: true });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <CardSkeleton height={140} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_260px]">
          <CardSkeleton height={320} />
          <CardSkeleton height={480} />
          <CardSkeleton height={320} />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="p-6 text-center text-xs text-black/50">
        Couldn&rsquo;t find @{handle}. {error?.message}
      </div>
    );
  }

  const isOwner = profile.id === viewerProfile.id;
  const layout = profile.layout_config || {};
  const showTop8 = layout.showTop8 !== false;
  const wallVisible = layout.wallVisible !== false;

  return (
    <SanitizedStyle profile={profile}>
      <div className="flex flex-col gap-4 px-3 pt-3 sm:px-4 sm:pt-4">
        <ArtistHeader profile={profile} isOwner={isOwner} viewerId={viewerProfile.id} />
        <ProfileCard profile={profile} isOwner={isOwner} />
      </div>

      <ResponsiveShell
        columns={[
          {
            key: 'space',
            label: 'Space',
            icon: Home,
            content: (
              <div className="flex flex-col gap-4">
                <TrackPlayerCard profile={profile} isOwner={isOwner} viewerId={viewerProfile.id} />
                {showTop8 && <Top8Grid profile={profile} isOwner={isOwner} />}

                {isArtist && (
                  <>
                    <GigList profile={profile} isOwner={isOwner} />

                    <div className="space-card border-2 border-black bg-white">
                      <SectionHeading icon={Radio}>Work in progress</SectionHeading>
                      <div className="flex flex-col gap-3 p-3">
                        {wipLoading ? (
                          <CardSkeleton height={140} />
                        ) : (wipTracks ?? []).length === 0 ? (
                          <p className="text-xs text-black/40">
                            {isOwner ? 'Upload a WIP stem below.' : 'No WIP stems shared yet.'}
                          </p>
                        ) : (
                          wipTracks.map((track) => (
                            <WipStemPlayer key={track.id} track={track} currentUserId={viewerProfile.id} />
                          ))
                        )}
                        {isOwner && <TrackUploadForm userId={profile.id} isWip onUploaded={() => {}} />}
                      </div>
                    </div>

                    <MerchShop
                      profile={profile}
                      isOwner={isOwner}
                      viewerId={viewerProfile.id}
                      viewerBalance={viewerProfile.sparks_balance}
                    />
                  </>
                )}
              </div>
            ),
          },
          {
            key: 'feed',
            label: 'Feed',
            icon: Radio,
            content: <ActivityFeed viewerId={viewerProfile.id} />,
          },
          {
            key: 'community',
            label: 'Community',
            icon: Users,
            content: <RightRail targetProfile={profile} viewerId={viewerProfile.id} wallVisible={wallVisible} />,
          },
        ]}
      />
    </SanitizedStyle>
  );
}
