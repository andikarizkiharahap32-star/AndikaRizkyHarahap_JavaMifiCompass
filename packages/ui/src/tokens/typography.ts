// ─────────────────────────────────────────────────────────────
// Typography Tokens — JavaMifi Compass
// Wayfinding signage, interface body, and machine strings
// Strictly aligned with docs/DESIGN.md
// ─────────────────────────────────────────────────────────────

export const fontFamilies = {
  // Transit signage & flight-board metrics
  display: 'Barlow Condensed, sans-serif',

  // Wayfinding interface & running copy
  sans: 'Plus Jakarta Sans, sans-serif',

  // Machine strings (ICCID, IMEI, order tokens, hashes)
  mono: 'JetBrains Mono, monospace',
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

export const typeScale = {
  // Signage Headers (Barlow Condensed)
  displayXl: {
    fontFamily: fontFamilies.display,
    fontSize: '5rem',
    lineHeight: '0.92',
    letterSpacing: '-0.01em',
    fontWeight: fontWeights.bold,
  },
  displayLg: {
    fontFamily: fontFamilies.display,
    fontSize: '3.5rem',
    lineHeight: '0.95',
    letterSpacing: '-0.01em',
    fontWeight: fontWeights.bold,
  },
  displayMd: {
    fontFamily: fontFamilies.display,
    fontSize: '2.5rem',
    lineHeight: '1',
    fontWeight: fontWeights.bold,
  },
  headline: {
    fontFamily: fontFamilies.display,
    fontSize: '2rem',
    lineHeight: '1.1',
    fontWeight: fontWeights.semibold,
  },
  numericXl: {
    fontFamily: fontFamilies.display,
    fontSize: '4rem',
    lineHeight: '1',
    fontWeight: fontWeights.semibold,
  },

  // Interface Body & Labels (Plus Jakarta Sans)
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: '1.25rem',
    lineHeight: '1.35',
    fontWeight: fontWeights.bold,
  },
  bodyLg: {
    fontFamily: fontFamilies.sans,
    fontSize: '1.125rem',
    lineHeight: '1.7',
    fontWeight: fontWeights.regular,
  },
  bodyMd: {
    fontFamily: fontFamilies.sans,
    fontSize: '1rem',
    lineHeight: '1.625',
    fontWeight: fontWeights.regular,
  },
  bodySm: {
    fontFamily: fontFamilies.sans,
    fontSize: '0.875rem', // Minimum 14px body text per GEMINI.md
    lineHeight: '1.5',
    fontWeight: fontWeights.regular,
  },
  labelLg: {
    fontFamily: fontFamilies.sans,
    fontSize: '1rem',
    lineHeight: '1.25',
    fontWeight: fontWeights.bold,
  },
  labelMd: {
    fontFamily: fontFamilies.sans,
    fontSize: '0.875rem',
    lineHeight: '1.25',
    fontWeight: fontWeights.semibold,
  },
  labelSm: {
    fontFamily: fontFamilies.sans,
    fontSize: '0.75rem', // Minimum 12px label per GEMINI.md (text-xs)
    lineHeight: '1.2',
    fontWeight: fontWeights.semibold,
  },

  // Machine Strings (JetBrains Mono)
  codeMd: {
    fontFamily: fontFamilies.mono,
    fontSize: '0.875rem',
    lineHeight: '1.5',
    fontWeight: fontWeights.medium,
  },
} as const;
