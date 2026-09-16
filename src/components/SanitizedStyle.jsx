import { useMemo } from 'react';
import { sanitizeAndScopeCss } from '../lib/cssSandbox';

/**
 * The single render-time gate between a profile's raw, owner-authored
 * `custom_css` and the DOM. Nothing renders a Space's custom styling except
 * through here — re-sanitizing on every render (rather than trusting
 * whatever was last persisted) means a parser fix or tightened rule applies
 * retroactively to CSS written before it existed.
 */
export default function SanitizedStyle({ profile, children, className = '', as: Tag = 'div' }) {
  const scopeSuffix = profile.id.slice(0, 8);
  const themeVars = profile.theme_vars || {};

  const { css } = useMemo(
    () => sanitizeAndScopeCss(profile.custom_css || '', { scopeSuffix }),
    [profile.custom_css, scopeSuffix]
  );

  return (
    <Tag
      className={`user-space-scope ${className}`}
      style={{
        '--accent': themeVars.accent || '#FF4F00',
        '--bg': themeVars.bg || '#FDFBF7',
        '--text': themeVars.text || '#111111',
        '--font-mono': themeVars.font_mono || 'inherit',
      }}
    >
      <style>{css}</style>
      {children}
    </Tag>
  );
}
