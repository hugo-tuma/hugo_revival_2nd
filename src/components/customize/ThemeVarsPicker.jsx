import { Palette } from 'lucide-react';
import { useUpdateProfile } from '../../hooks/useSpacesQueries';
import SectionHeading from '../ui/SectionHeading';

const FONT_CHOICES = [
  { label: 'IBM Plex Mono', value: '"IBM Plex Mono", monospace' },
  { label: 'Space Mono', value: '"Space Mono", monospace' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'System Monospace', value: 'ui-monospace, monospace' },
];

const COLOR_FIELDS = [
  ['accent', 'Accent'],
  ['bg', 'Background'],
  ['text', 'Text'],
];

export default function ThemeVarsPicker({ profile }) {
  const updateProfile = useUpdateProfile(profile.id);
  const vars = profile.theme_vars || {};

  const setVar = (key, value) => updateProfile.mutate({ theme_vars: { ...vars, [key]: value } });

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading icon={Palette}>Theme variables</SectionHeading>
      <div className="flex flex-col gap-2 p-3">
        {COLOR_FIELDS.map(([key, label]) => (
          <label key={key} className="flex items-center justify-between text-sm font-semibold">
            {label}
            <input
              type="color"
              value={vars[key] || '#111111'}
              onChange={(e) => setVar(key, e.target.value)}
              className="h-8 w-10 cursor-pointer border-2 border-black bg-transparent"
            />
          </label>
        ))}
        <label className="flex items-center justify-between text-sm font-semibold">
          Font (mono)
          <select
            value={vars.font_mono || FONT_CHOICES[0].value}
            onChange={(e) => setVar('font_mono', e.target.value)}
            className="border-2 border-black bg-white px-1 py-1 text-xs"
          >
            {FONT_CHOICES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
