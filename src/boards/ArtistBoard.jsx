import { useParams } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useProfileByHandle, useTracks } from '../hooks/useSpacesQueries';
import { useAuth } from '../components/auth/AuthGate';
import SanitizedStyle from '../components/SanitizedStyle';
import ArtistHeader from '../components/artist/ArtistHeader';
import GigList from '../components/artist/GigList';
import MerchShop from '../components/artist/MerchShop';
import WipStemPlayer from '../components/audio/WipStemPlayer';
import TrackUploadForm from '../components/audio/TrackUploadForm';
import SectionHeading from '../components/ui/SectionHeading';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function ArtistBoard() {
  const { handle } = useParams();
  const { profile: viewerProfile } = useAuth();
  const { data: profile, isLoading, isError, error } = useProfileByHandle(handle);
  const { data: wipTracks, isLoading: wipLoading } = useTracks(profile?.id, { wip: true });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <CardSkeleton height={140} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardSkeleton height={240} />
          <CardSkeleton height={240} />
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

  return (
    <SanitizedStyle profile={profile} className="flex flex-col gap-4 p-3 sm:p-4">
      <ArtistHeader profile={profile} isOwner={isOwner} viewerId={viewerProfile.id} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GigList profile={profile} isOwner={isOwner} />

        <div className="space-card border-2 border-black bg-white">
          <SectionHeading icon={Radio}>Work in progress</SectionHeading>
          <div className="flex flex-col gap-3 p-3">
            {wipLoading ? (
              <CardSkeleton height={140} />
            ) : (wipTracks ?? []).length === 0 ? (
              <p className="text-xs text-black/40">{isOwner ? 'Upload a WIP stem below.' : 'No WIP stems shared yet.'}</p>
            ) : (
              wipTracks.map((track) => (
                <WipStemPlayer key={track.id} track={track} currentUserId={viewerProfile.id} />
              ))
            )}
            {isOwner && <TrackUploadForm userId={profile.id} isWip onUploaded={() => {}} />}
          </div>
        </div>
      </div>

      <MerchShop profile={profile} isOwner={isOwner} viewerId={viewerProfile.id} viewerBalance={viewerProfile.sparks_balance} />
    </SanitizedStyle>
  );
}
