import { useState } from 'react';
import { AlignLeft } from 'lucide-react';
import { useUpdateProfile } from '../../hooks/useSpacesQueries';
import SectionHeading from '../ui/SectionHeading';

export default function DescriptionEditor({ profile }) {
  const [draft, setDraft] = useState(profile.bio_mood);
  const updateProfile = useUpdateProfile(profile.id);
  const dirty = draft.trim() !== profile.bio_mood;

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed !== profile.bio_mood) updateProfile.mutate({ bio_mood: trimmed });
  };

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading icon={AlignLeft}>Description</SectionHeading>
      <div className="flex flex-col gap-2 p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={140}
          rows={3}
          placeholder="What's your mood?"
          className="w-full resize-none border-2 border-black px-2 py-1.5 text-sm font-mono"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-black/40">{draft.length}/140</span>
          <button
            onClick={save}
            disabled={!dirty || updateProfile.isPending}
            className="border-2 border-black bg-spark px-3 py-1.5 text-[10px] font-bold uppercase transition-colors hover:bg-black hover:text-cream disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
