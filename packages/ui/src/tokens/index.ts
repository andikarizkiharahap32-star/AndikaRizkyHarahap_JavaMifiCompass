// ─────────────────────────────────────────────────────────────
// Design Tokens — JavaMifi Compass
// Restrained palette, typography scale, signal bars & route lines
// ─────────────────────────────────────────────────────────────

export * from './semantics';
export * from './typography';
export * from './halal-tiers';
export * from './spacing';

import { transitLineTokens, surfaceTokens, inkTokens, statusTokens, borderTokens } from './semantics';
import { fontFamilies } from './typography';
import { halalTierTokens } from './halal-tiers';
import { spacingTokens, radiiTokens, motionTokens, zIndexTokens, elevationTokens } from './spacing';

export const tokens = {
  colors: {
    // JavaMifi brand cyan / blue / orange / nila
    brand: {
      primary: '#18215A', // Stitch Wayfinding Deep Nila Indigo per docs/DESIGN.md (WCAG AAA 14.9:1)
      connectivitySky: '#0284C7', // Connectivity Blue accent
      primaryHover: '#2B3A8C',
      primaryPressed: '#0E1440',
      secondary: '#0F172A', // Slate 900 - Dark travel neutral
      accent: '#F97316', // Orange 500 - #AntiSusahSinyal energy
      accentHover: '#EA580C',
      light: '#F0F9FF', // Sky 50
      nila: '#000846', // Stitch Deep Nila Indigo
      nilaLight: '#18215A', // Stitch Wayfinding Ink
    },
    // Google Stitch Transit Wayfinding material ground
    ground: {
      base: surfaceTokens.baseGround, // Architectural tactile paper ground
      paper: surfaceTokens.paper, // Card stock
      line: surfaceTokens.paperEdge, // Subtle ticket border
    },
    // Transit Line product colorways
    transitLine: transitLineTokens,
    // Halal status tier colorways (Fail-closed)
    halalTier: halalTierTokens,
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
    fontSans: fontFamilies.sans,
    fontDisplay: fontFamilies.display,
    fontMono: fontFamilies.mono,
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  borders: borderTokens,
  elevation: elevationTokens,
  motion: motionTokens,
  zIndex: zIndexTokens,
  spacing: spacingTokens,
  radii: radiiTokens,
} as const;

export type ThemeTokens = typeof tokens;
