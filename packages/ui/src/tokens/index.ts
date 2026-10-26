// ─────────────────────────────────────────────────────────────
// Design Tokens — JavaMifi Compass
// Restrained palette, typography scale, signal bars & route lines
// ─────────────────────────────────────────────────────────────

export const tokens = {
  colors: {
    // JavaMifi brand cyan / blue / orange
    brand: {
      primary: '#0284C7', // Sky 600 - Connectivity Blue
      primaryHover: '#0369A1',
      secondary: '#0F172A', // Slate 900 - Dark travel neutral
      accent: '#F97316', // Orange 500 - #AntiSusahSinyal energy
      accentHover: '#EA580C',
      light: '#F0F9FF', // Sky 50
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
