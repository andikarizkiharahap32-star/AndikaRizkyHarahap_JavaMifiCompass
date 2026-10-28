// ─────────────────────────────────────────────────────────────
// Typography Tokens — JavaMifi Compass
// Wayfinding signage, interface body, and machine strings
// Strictly aligned with docs/DESIGN.md
// ─────────────────────────────────────────────────────────────

export const fontFamilies = {
  // Transit signage & flight-board metrics
  display: 'Barlow Condensed, sans-serif',

  // Wayfinding interface & running copy (legacy alias preserved for backwards compatibility)
  sans: 'Plus Jakarta Sans, sans-serif',

  // Section 3: Primary UI & body typography (Inter, variable, font-display: swap)
  inter: 'Inter, sans-serif',
  body: 'Inter, sans-serif',

  // Section 3: Machine strings, labels, and prices only (JetBrains Mono)
  mono: 'JetBrains Mono, monospace',
} as const;

// Section 3: Typography Scale (1.2 ratio): 12 / 14 / 16 / 19 / 23 / 28 / 34 / 41px
export const typographyScale12 = {
  12: '12px',
  14: '14px',
  16: '16px',
  19: '19px',
  23: '23px',
  28: '28px',
  34: '34px',
  41: '41px',
} as const;

export const scale12Ratio = [12, 14, 16, 19, 23, 28, 34, 41] as const;

// Section 3: Mono label rules (12px, letter-spacing: .08em, uppercase, 3 words max)
export const monoLabelTokens = {
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  maxWords: 3,
  fontFamily: fontFamilies.mono,
} as const;

// Section 3: Self-host, preload only Inter 400/600 Latin
export const fontPreloadTokens = {
  primary: 'Inter',
  variable: true,
  display: 'swap' as const,
  selfHost: true,
  preload: ['Inter 400 Latin', 'Inter 600 Latin'] as const,
  weights: [400, 600] as const,
  subsets: ['latin'] as const,
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

export const typographyRules = {
  // Editorial & Ergonomic Constraints per GEMINI.md & P03-WS05/06/12
  minBodySize: '0.875rem', // 14px minimum body text (body-sm)
  minLabelSize: '0.75rem',  // 12px minimum label (label-sm)
  maxReadingWidth: '65ch',  // Line length constraint (P03-WS12)
  tabularFeature: '"tnum" 1',
  overflowWrap: 'break-word',
} as const;

export const editorialHierarchy = {
  // Page H1: Display Headings (Barlow Condensed, Bold/Black, Uppercase Signage)
  pageH1: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.black,
    letterSpacing: '-0.02em',
    lineHeight: '1.05',
    textTransform: 'uppercase' as const,
  },
  // Section H2: Section Wayfinding (Barlow Condensed, Semibold/Bold, Uppercase)
  sectionH2: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.bold,
    letterSpacing: '-0.01em',
    lineHeight: '1.1',
    textTransform: 'uppercase' as const,
  },
  // Card Titles: Plus Jakarta Sans Bold
  cardTitle: {
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    lineHeight: '1.35',
  },
  // Body Copy: Plus Jakarta Sans Regular, >=14px
  bodyCopy: {
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.regular,
    minSize: '14px',
    lineHeight: '1.6',
  },
  // Metadata Labels: Plus Jakarta Sans Semibold, >=12px, Uppercase Tracking
  metadataLabel: {
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    minSize: '12px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  // Tabular Numerals: Mono/Barlow with forced tnum
  tabularNumeral: {
    fontFeatureSettings: '"tnum" 1',
    fontVariantNumeric: 'tabular-nums',
  },
} as const;
