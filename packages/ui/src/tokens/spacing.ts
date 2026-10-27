// ─────────────────────────────────────────────────────────────
// Spacing & Target Dimensions — JavaMifi Compass
// 8px base rhythm, container bounds, and minimum touch targets
// Strictly aligned with docs/DESIGN.md and GEMINI.md
// ─────────────────────────────────────────────────────────────

export const spacingTokens = {
  // Base 8px rhythm scale
  spaceXs: '0.25rem', // 4px
  spaceSm: '0.5rem',  // 8px
  spaceMd: '1rem',    // 16px
  spaceLg: '1.5rem',  // 24px
  spaceXl: '2.5rem',  // 40px
  space2xl: '4rem',   // 64px
  space3xl: '6rem',   // 96px

  // Ergonomic Target Standards (GEMINI.md Hard Rule)
  minTouchTarget: '48px',     // 48px × 48px minimum interactive area (min-h-12 min-w-12)
  transitInputHeight: '52px', // 52px height for transit inputs & primary CTAs
  navBarHeight: '64px',       // 64px standard navigation height

  // Container Maximum Width
  maxContentWidth: '1200px',
} as const;

export const radiiTokens = {
  none: '0px',
  sm: '0.125rem', // 2px
  DEFAULT: '0.25rem', // 4px (Trip cards, boarding passes, receipt plates)
  md: '0.375rem', // 6px (Text inputs, selects)
  lg: '0.5rem',   // 8px (Modal sheets)
  xl: '0.75rem',  // 12px
  full: '9999px', // Status badges, chips
} as const;
