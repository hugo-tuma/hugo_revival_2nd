import { useState } from 'react';
import { GitFork, Sparkles } from 'lucide-react';
import { useForkSpace, useOwnedBadges, useProfileById, useUpdateProfile } from '../../hooks/useSpacesQueries';
import { initialsOf } from '../../utils/format';
import ForkDiffViewer from '../customize/ForkDiffViewer';

const BADGE_ICONS = { Sparkles, GitFork };

export default function ProfileCard({ profile, isOwner, viewerProfile }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.bio_mood);
  const [showForkPreview, setShowForkPreview] = useState(false);
  const updateProfile = useUpdateProfile(profile.id);
  const forkSpace = useForkSpace(viewerProfile?.id);
  const { data: parent } = useProfileById(profile.forked_from_id);
  const { data: badges = [] } = useOwnedBadges(profile.id);

  const save = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== profile.bio_mood) updateProfile.mutate({ bio_mood: trimmed });
  };

  const canFork = !isOwner && viewerProfile && viewerProfile.id !== profile.id;

  return (
    <div className="space-card border-2 border-black bg-white p-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-black text-lg font-black"
          style={{ backgroundColor: profile.color, color: profile.color === '#111111' ? '#FDFBF7' : '#111111' }}
        >
          {initialsOf(profile.display_name)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1">
            <p className="font-black leading-none">{profile.display_name}</p>
            {badges.map((b) => {
              const Icon = BADGE_ICONS[b.icon] ?? Sparkles;
              return <Icon key={b.id} size={13} className="text-spark" title={b.name} />;
            })}
          </div>
          <p className="text-xs text-black/50">@{profile.handle}</p>
        </div>
      </div>

      <div className="mt-3">
        {isOwner && editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            maxLength={140}
            className="w-full border-2 border-black px-2 py-1 text-xs font-mono"
          />
        ) : (
          <button
            onClick={() => {
              if (!isOwner) return;
              setDraft(profile.bio_mood);
              setEditing(true);
            }}
            disabled={!isOwner}
            className={`w-full text-left text-xs italic ${isOwner ? 'hover:text-spark' : 'cursor-default'}`}
            title={isOwner ? 'Click to edit mood status' : undefined}
          >
            &ldquo;{profile.bio_mood || 'no mood set'}&rdquo;
          </button>
        )}
      </div>

      {parent && (
        <div className="mt-3 inline-flex items-center gap-1 border-2 border-black bg-cream px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
          <GitFork size={11} />
          Forked from @{parent.handle} ({parent.fork_count} forks)
        </div>
      )}

      {canFork && (
        <button
          onClick={() => setShowForkPreview(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 border-2 border-black bg-spark px-2 py-1.5 text-[10px] font-bold uppercase transition-colors hover:bg-black hover:text-cream"
        >
          <GitFork size={12} /> Fork this Space ({profile.fork_count})
        </button>
      )}

      {showForkPreview && canFork && (
        <ForkDiffViewer
          source={profile}
          mine={viewerProfile}
          busy={forkSpace.isPending}
          onCancel={() => setShowForkPreview(false)}
          onConfirm={() => forkSpace.mutate(profile.id, { onSuccess: () => setShowForkPreview(false) })}
        />
      )}
    </div>
  );
}
