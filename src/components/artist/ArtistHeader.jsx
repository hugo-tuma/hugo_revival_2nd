import { BadgeCheck, Heart, UserCheck, UserPlus, Users, Zap } from 'lucide-react';
import { initialsOf } from '../../utils/format';
import {
  useFollowerCount,
  useIsFollowing,
  useIsSupporting,
  useTipArtist,
  useToggleFollow,
  useToggleSupport,
} from '../../hooks/useSpacesQueries';

const TIP_AMOUNTS = [20, 50, 100];

export default function ArtistHeader({ profile, isOwner, viewerId }) {
  const { data: followerCount = 0 } = useFollowerCount(profile.id);
  const { data: isFollowing } = useIsFollowing(viewerId, profile.id);
  const { data: support } = useIsSupporting(viewerId, profile.id);
  const toggleFollow = useToggleFollow(viewerId, profile.id);
  const toggleSupport = useToggleSupport(viewerId, profile.id);
  const tip = useTipArtist(viewerId);

  return (
    <div className="space-banner border-2 border-black bg-white">
      <div className="h-24 bg-black" />
      <div className="px-4 pb-4">
        <div className="-mt-8 flex flex-wrap items-end gap-3">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center border-2 border-black text-2xl font-black"
            style={{ backgroundColor: profile.color, color: profile.color === '#111111' ? '#FDFBF7' : '#111111' }}
          >
            {initialsOf(profile.display_name)}
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-1">
              <h1 className="text-lg font-black">{profile.display_name}</h1>
              {profile.is_verified && <BadgeCheck size={16} className="text-spark" fill="#111111" />}
            </div>
            <p className="flex items-center gap-1 text-xs text-black/50">
              <Users size={11} /> {followerCount} friend{followerCount === 1 ? '' : 's'} follow
            </p>
          </div>

          {!isOwner && viewerId && (
            <div className="ml-auto flex flex-wrap items-center gap-2 pb-1">
              <button
                onClick={() => toggleFollow.mutate(Boolean(isFollowing))}
                className={`flex items-center gap-1 border-2 border-black px-3 py-1.5 text-xs font-bold transition-colors ${
                  isFollowing ? 'bg-black text-cream' : 'bg-cream hover:bg-black/5'
                }`}
              >
                {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              <div className="flex border-2 border-black">
                {TIP_AMOUNTS.map((amt, i) => (
                  <button
                    key={amt}
                    onClick={() => tip.mutate({ recipientId: profile.id, amount: amt })}
                    disabled={tip.isPending}
                    className={`flex items-center gap-0.5 px-2 py-1.5 text-xs font-bold hover:bg-spark disabled:opacity-50 ${
                      i > 0 ? 'border-l-2 border-black' : ''
                    }`}
                  >
                    <Zap size={11} /> {amt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => toggleSupport.mutate(50)}
                disabled={toggleSupport.isPending}
                className={`flex items-center gap-1 border-2 border-black px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                  support?.active ? 'bg-black text-cream' : 'bg-spark hover:bg-black hover:text-cream'
                }`}
              >
                <Heart size={12} fill={support?.active ? 'currentColor' : 'none'} />
                {support?.active ? 'Supporting monthly' : 'Support monthly'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
