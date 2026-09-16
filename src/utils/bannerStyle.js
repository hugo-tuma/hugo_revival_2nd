export const BANNER_COLORS = ['#111111', '#FF4F00', '#2563EB', '#16A34A', '#DC2626', '#7C3AED', '#FDFBF7'];

export const BANNER_PATTERNS = ['solid', 'dots', 'stripes', 'grid'];

export function bannerStyle(banner = {}) {
  const color = banner.color || '#111111';
  const pattern = banner.pattern || 'solid';
  const line = 'rgba(255,255,255,0.35)';

  switch (pattern) {
    case 'dots':
      return {
        backgroundColor: color,
        backgroundImage: `radial-gradient(${line} 2px, transparent 2px)`,
        backgroundSize: '16px 16px',
      };
    case 'stripes':
      return {
        backgroundColor: color,
        backgroundImage: `repeating-linear-gradient(45deg, ${line} 0 8px, transparent 8px 16px)`,
      };
    case 'grid':
      return {
        backgroundColor: color,
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      };
    default:
      return { backgroundColor: color };
  }
}
