import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../components/auth/AuthGate';
import { useUpdateProfile } from '../hooks/useSpacesQueries';
import LayoutToggles from '../components/customize/LayoutToggles';
import ThemeVarsPicker from '../components/customize/ThemeVarsPicker';
import BadgeShop from '../components/customize/BadgeShop';
import CssEditor from '../components/customize/CssEditor';
import SanitizedStyle from '../components/SanitizedStyle';
import SectionHeading from '../components/ui/SectionHeading';

export default function CustomizeBoard() {
  const { profile } = useAuth();
  const updateProfile = useUpdateProfile(profile.id);
  const [previewCss, setPreviewCss] = useState(profile.custom_css || '');

  const previewProfile = { ...profile, custom_css: previewCss };

  return (
    <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <LayoutToggles profile={profile} />
        <ThemeVarsPicker profile={profile} />
        <BadgeShop profile={profile} />
      </div>

      <div className="flex flex-col gap-4">
        <CssEditor
          profile={profile}
          onDraftChange={setPreviewCss}
          onPersist={(css) => updateProfile.mutate({ custom_css: css })}
        />

        <div className="space-card border-2 border-black bg-white">
          <SectionHeading icon={Sparkles}>Live preview</SectionHeading>
          <div className="p-4">
            <SanitizedStyle profile={previewProfile} className="p-3">
              <div className="space-card border-2 border-black p-3">
                <p className="text-sm font-black">{profile.display_name}</p>
                <p className="mt-1 text-xs italic">&ldquo;{profile.bio_mood || 'no mood set'}&rdquo;</p>
                <button className="space-btn mt-3 border-2 border-black px-3 py-1.5 text-[10px] font-bold uppercase">
                  Message
                </button>
              </div>
            </SanitizedStyle>
          </div>
        </div>
      </div>
    </div>
  );
}
