import { Check, Image as ImageIcon } from 'lucide-react';
import { useUpdateProfile } from '../../hooks/useSpacesQueries';
import { BANNER_COLORS, BANNER_PATTERNS, bannerStyle } from '../../utils/bannerStyle';
import SectionHeading from '../ui/SectionHeading';

export default function BannerPicker({ profile }) {
  const updateProfile = useUpdateProfile(profile.id);
  const layout = profile.layout_config || {};
  const banner = layout.banner || {};

  const setBanner = (patch) =>
    updateProfile.mutate({ layout_config: { ...layout, banner: { ...banner, ...patch } } });

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading icon={ImageIcon}>Background</SectionHeading>
      <div className="flex flex-col gap-3 p-3">
        <div className="h-20 border-2 border-black" style={bannerStyle(banner)} />

        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-black/50">Color</p>
          <div className="flex flex-wrap gap-2">
            {BANNER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setBanner({ color: c })}
                aria-label={c}
                className="flex h-8 w-8 items-center justify-center border-2 border-black"
                style={{ backgroundColor: c }}
              >
                {(banner.color || '#111111') === c && (
                  <Check size={14} color={c === '#FDFBF7' ? '#111111' : '#FDFBF7'} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-black/50">Pattern</p>
          <div className="flex border-2 border-black">
            {BANNER_PATTERNS.map((p, i) => (
              <button
                key={p}
                onClick={() => setBanner({ pattern: p })}
                className={`flex-1 px-2 py-1.5 text-[10px] font-bold uppercase ${i !== 0 ? 'border-l-2 border-black' : ''} ${
                  (banner.pattern || 'solid') === p ? 'bg-black text-cream' : 'hover:bg-black/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
