import { useParams } from 'react-router-dom';
import { Home, Radio, Users } from 'lucide-react';
import { useProfileByHandle } from '../hooks/useSpacesQueries';
import { useAuth } from '../components/auth/AuthGate';
import ResponsiveShell from '../components/layout/ResponsiveShell';
import SanitizedStyle from '../components/SanitizedStyle';
import ProfileCard from '../components/home/ProfileCard';
import TrackPlayerCard from '../components/home/TrackPlayerCard';
import Top8Grid from '../components/home/Top8Grid';
import ActivityFeed from '../components/home/ActivityFeed';
import RightRail from '../components/home/RightRail';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function HomeBoard() {
  const { handle } = useParams();
  const { profile: viewerProfile } = useAuth();
  const { data: profile, isLoading, isError, error } = useProfileByHandle(handle);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_1fr_260px]">
        <CardSkeleton height={320} />
        <CardSkeleton height={480} />
        <CardSkeleton height={320} />
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
      <ResponsiveShell
        columns={[
          {
            key: 'space',
            label: 'Space',
            icon: Home,
            content: (
              <div className="flex flex-col gap-4">
                <ProfileCard profile={profile} isOwner={isOwner} viewerProfile={viewerProfile} />
                <TrackPlayerCard profile={profile} isOwner={isOwner} />
                {showTop8 && <Top8Grid profile={profile} isOwner={isOwner} />}
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
