import { useState } from 'react';
import { ArrowLeft, Sparkles, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthGate';
import { useUpdateProfile } from '../hooks/useSpacesQueries';
import DescriptionEditor from '../components/customize/DescriptionEditor';
import BannerPicker from '../components/customize/BannerPicker';
import LayoutToggles from '../components/customize/LayoutToggles';
import ThemeVarsPicker from '../components/customize/ThemeVarsPicker';
import BadgeShop from '../components/customize/BadgeShop';
import CssEditor from '../components/customize/CssEditor';
import SanitizedStyle from '../components/SanitizedStyle';
import SectionHeading from '../components/ui/SectionHeading';

export default function CustomizeBoard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('basic');
  const updateProfile = useUpdateProfile(profile.id);
  const [previewCss, setPreviewCss] = useState(profile.custom_css || '');

  const previewProfile = { ...profile, custom_css: previewCss };

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/space/${profile.handle}`}
          className="flex w-fit items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide hover:bg-black/5"
        >
          <ArrowLeft size={12} /> Back to your Space
        </Link>

        <div className="flex border-2 border-black">
          <button
            onClick={() => setTab('basic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              tab === 'basic' ? 'bg-black text-cream' : 'hover:bg-black/5'
            }`}
          >
            <Wrench size={12} /> Basic
          </button>
          <button
            onClick={() => setTab('advanced')}
            className={`flex items-center gap-1.5 border-l-2 border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              tab === 'advanced' ? 'bg-black text-cream' : 'hover:bg-black/5'
            }`}
          >
            <Sparkles size={12} /> Advanced
          </button>
        </div>
      </div>

      {tab === 'basic' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <DescriptionEditor profile={profile} />
            <BannerPicker profile={profile} />
            <LayoutToggles profile={profile} />
          </div>
          <BadgeShop profile={profile} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <ThemeVarsPicker profile={profile} />
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
      )}
    </div>
  );
}
