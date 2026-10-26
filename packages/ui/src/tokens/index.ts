// ─────────────────────────────────────────────────────────────
// Design Tokens — JavaMifi Compass
// Restrained palette, typography scale, signal bars & route lines
// ─────────────────────────────────────────────────────────────

export const tokens = {
  colors: {
    // JavaMifi brand cyan / blue / orange / nila
    brand: {
      primary: '#0284C7', // Sky 600 - Connectivity Blue
      primaryHover: '#0369A1',
      secondary: '#0F172A', // Slate 900 - Dark travel neutral
      accent: '#F97316', // Orange 500 - #AntiSusahSinyal energy
      accentHover: '#EA580C',
      light: '#F0F9FF', // Sky 50
      nila: '#000846', // Stitch Deep Nila Indigo
      nilaLight: '#18215A', // Stitch Wayfinding Ink
    },
    // Google Stitch Transit Wayfinding material ground
    ground: {
      base: '#EDF0EE', // Architectural tactile paper ground
      paper: '#FFFFFF', // Card stock
      line: '#D8DDD9', // Subtle ticket border
    },
    // Transit Line product colorways
    transitLine: {
      wifi: '#F27B2A',
      esim: '#4C97FF',
      sim: '#E96BB0',
      pro: '#18215A',
      dining: '#059669', // Emerald Jade
      diningStroke: '#047857',
      diningSurface: '#D1FAE5',
    },
    // Halal status tier colorways (Fail-closed)
    halalTier: {
      certified: { bg: '#D1FAE5', text: '#047857', border: '#10B981', label: 'CERTIFIED HALAL' },
      claimed: { bg: '#E0F2FE', text: '#0284C7', border: '#38BDF8', label: 'HALAL CLAIMED' },
      options: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B', label: 'HALAL OPTIONS' },
      notHalal: { bg: '#FEE2E2', text: '#B91C1C', border: '#EF4444', label: 'NON-HALAL' },
      unknown: { bg: '#E1E6E3', text: '#6B7570', border: '#CBD5E1', label: 'UNVERIFIED' },
    },
    // Semantic feedback
    status: {
      success: '#10B981', // Emerald 500
      successBg: '#ECFDF5',
      warning: '#F59E0B', // Amber 500
      warningBg: '#FFFBEB',
      error: '#EF4444', // Red 500
      errorBg: '#FEF2F2',
      info: '#3B82F6', // Blue 500
      infoBg: '#EFF6FF',
    },
    // Signal bar strength indicator
    signal: {
      excellent: '#10B981',
      good: '#3B82F6',
      fair: '#F59E0B',
      poor: '#EF4444',
      inactive: '#E2E8F0',
    },
    // Neutrals
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  typography: {
    fontSans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontDisplay: '"Outfit", "Plus Jakarta Sans", system-ui, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type ThemeTokens = typeof tokens;
