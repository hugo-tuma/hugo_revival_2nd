import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useOwnedBadges, useUpdateProfile } from '../../hooks/useSpacesQueries';

const BADGE_ICONS = { Sparkles };

export default function ProfileCard({ profile, isOwner }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.bio_mood);
  const updateProfile = useUpdateProfile(profile.id);
  const { data: badges = [] } = useOwnedBadges(profile.id);

  const save = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== profile.bio_mood) updateProfile.mutate({ bio_mood: trimmed });
  };

  return (
    <div className="space-card border-2 border-black bg-white p-3">
      {badges.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {badges.map((b) => {
            const Icon = BADGE_ICONS[b.icon] ?? Sparkles;
            return <Icon key={b.id} size={14} className="text-spark" title={b.name} />;
          })}
        </div>
      )}

      <div>
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
    </div>
  );
}
