import { Settings2 } from 'lucide-react';
import { useUpdateProfile } from '../../hooks/useSpacesQueries';
import SectionHeading from '../ui/SectionHeading';
import Toggle from '../ui/Toggle';

export default function LayoutToggles({ profile }) {
  const updateProfile = useUpdateProfile(profile.id);
  const layout = profile.layout_config || {};

  const setLayout = (patch) => updateProfile.mutate({ layout_config: { ...layout, ...patch } });

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading icon={Settings2}>Layout toggles</SectionHeading>
      <div className="divide-y-2 divide-black/10 p-3">
        <Toggle label="Autoplay song on load" checked={Boolean(layout.autoplay)} onChange={(v) => setLayout({ autoplay: v })} />
        <Toggle label="Show Top 8 on load" checked={layout.showTop8 !== false} onChange={(v) => setLayout({ showTop8: v })} />
        <Toggle label="Wall visibility" checked={layout.wallVisible !== false} onChange={(v) => setLayout({ wallVisible: v })} />
      </div>
    </div>
  );
}
