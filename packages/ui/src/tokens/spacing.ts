// ─────────────────────────────────────────────────────────────
// Spacing & Target Dimensions — JavaMifi Compass
// 8px base rhythm, container bounds, and minimum touch targets
// Strictly aligned with docs/DESIGN.md and GEMINI.md
// ─────────────────────────────────────────────────────────────

export const spacingTokens = {
  // Base 8px rhythm scale
  spaceXs: '0.25rem', // 4px
  spaceSm: '0.5rem', // 8px
  spaceMd: '1rem', // 16px
  spaceLg: '1.5rem', // 24px
  spaceXl: '2.5rem', // 40px
  space2xl: '4rem', // 64px
  space3xl: '6rem', // 96px

  // Section 3: Spacing (4px base, 8px rhythm): 1:4, 2:8, 3:12, 4:16, 6:24, 8:32, 12:48, 16:64, 24:96
  scale: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
    24: '96px',
  },

  // Ergonomic Target Standards (GEMINI.md Hard Rule)
  minTouchTarget: '48px', // 48px × 48px minimum interactive area (min-h-12 min-w-12)
  transitInputHeight: '52px', // 52px height for transit inputs & primary CTAs
  navBarHeight: '64px', // 64px standard navigation height

  // Container Maximum Width
  maxContentWidth: '1200px',
} as const;

export const calculateNestedRadius = (outerRadiusPx: number, paddingPx: number): string => {
  return `${Math.max(0, outerRadiusPx - paddingPx)}px`;
};

export const radiiTokens = {
  none: '0px',
  sm: '6px', // chips/badges (Section 3: sm 6px)
  DEFAULT: '10px', // inputs/buttons
  md: '10px', // inputs/buttons (Section 3: md 10px)
  lg: '16px', // cards (Section 3: lg 16px)
  xl: '20px',
  full: '9999px', // pills (Section 3: full pills)
  nested: calculateNestedRadius,
} as const;

export const motionTokens = {
  // Section 3: fast 120ms, base 200ms, slow 400ms
  fast: '120ms',
  base: '200ms',
  slow: '400ms',

  // Section 3: standard cubic-bezier(0.2,0,0,1), emphasized cubic-bezier(0.16,1,0.3,1), exit cubic-bezier(0.4,0,1,1)
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  modalEntryDuration: '400ms',
  modalExitDuration: '150ms',

  // Animate only transform and opacity (Section 3)
  animatableProperties: ['transform', 'opacity'] as const,

  // Motion Duration Tiers (P17-WS01, WS02)
  durationInstant: '0ms',
  durationMicro: '100ms', // Quick microinteractions, state toggles
  durationMechanical: '150ms', // Button clicks, tab switches, chips
  durationTransit: '200ms', // Card lifts, modal reveals, route entries
  durationDeliberate: '300ms', // Large accordion expansions, drawer reveals

  // Easing Roles (P17-WS03)
  easeTransit: 'cubic-bezier(0, 0, 0.2, 1)', // Decelerate / entrance curve
  easeMechanical: 'cubic-bezier(0.4, 0, 0.2, 1)', // Standard symmetrical response
  easeExit: 'cubic-bezier(0.4, 0, 1, 1)', // Accelerate / exit curve

  // Kinematic Displacements (P17-WS05, WS06)
  hoverLift: '-4px', // 4px-8px tactile micro-mechanical lift
  hoverLiftLarge: '-6px', // 6px ticket card lift
  pressCompression: '1px', // Tactile button compression
} as const;

export const zIndexTokens = {
  // Layering hierarchy per P02-WS14
  surface: 0,
  elevated: 10,
  sticky: 20,
  drawer: 30,
  modal: 40,
  toast: 50,
} as const;

export const elevationTokens = {
  // Tactile elevation without drop shadows (GEMINI.md Hard Rule)
  flat: 'border border-paper-edge',
  card: 'border border-paper-edge border-b-2',
  raised: 'border border-paper-edge border-b-4',
  sunken: 'border border-paper-edge bg-sunken',

  // Section 3 Elevation Tokens: e1 (cards), e2 (popovers), e3 (modals)
  e1: '0 1px 2px rgb(11 16 51 / 0.06)',
  e2: '0 4px 16px rgb(11 16 51 / 0.10)',
  e3: '0 12px 32px rgb(11 16 51 / 0.16)',

  // In dark mode, use surface lightening instead of shadows (Section 3)
  darkSurfaces: {
    e1: '#171F54',
    e2: '#1E286B',
    e3: '#263384',
  },
} as const;

export const iconographyTokens = {
  lucideStandardSize: '20px',
  lucideStrokeWidth: 1.75,
  lucideNavSize: '24px',
  flags: 'svg-sprite',
} as const;

export const imageryTokens = {
  destinationCardAspectRatio: '4/3',
  treatment: 'duotone-tinted navy',
  source: 'real-photography',
} as const;

export const progressive3dTokens = {
  // Gated 3D & Kinematics Bounds (P18-WS01, WS04, WS12)
  maxPointerTiltDeg: 5, // Strictly bounded <= 5 deg pointer tilt
  maxParallaxOffsetPx: 8, // Max 8px tactile layer displacement
  devicePixelRatioCap: 2, // Max DPR 2.0 to protect GPU budget on mobile
  targetFrameRate: 60, // 60fps target budget (16.6ms frame time)
} as const;

export const responsiveTokens = {
  // Viewport Breakpoints & Baselines (P19-WS01 to WS06)
  viewport320: '320px', // Compact mobile baseline (e.g., iPhone SE)
  viewport360: '360px', // Android baseline
  viewport390: '390px', // Modern mobile baseline (iPhone 12/13/14)
  viewport768: '768px', // Tablet portrait
  viewport1024: '1024px', // Tablet landscape
  viewport1440: '1440px', // Desktop wide container bound

  // Mobile Ergonomics & Safe Areas (P19-WS07, WS10, WS11, WS12)
  minTouchTargetPx: 48,
  minTargetSpacingPx: 8,
  maxModalHeightVh: 90,
  safeAreaInsetTop: 'env(safe-area-inset-top, 0px)',
  safeAreaInsetBottom: 'env(safe-area-inset-bottom, 0px)',
  safeAreaInsetLeft: 'env(safe-area-inset-left, 0px)',
  safeAreaInsetRight: 'env(safe-area-inset-right, 0px)',
} as const;

export const a11yTokens = {
  // WCAG 2.2 AA Compliance Standards (P20-WS01 to WS12)
  minContrastNormal: 4.5, // 4.5:1 minimum contrast for normal text (WCAG 1.4.3)
  minContrastLarge: 3.0, // 3.0:1 minimum contrast for large text (>= 18pt or bold >= 14pt)
  minTargetSizePx: 24, // WCAG 2.5.8 minimum target size (24px)
  houseTargetSizePx: 48, // JavaMifi Compass House standard (48px)
  targetSpacingClearancePx: 8, // 8px minimum clearance between adjacent small targets
  focusRingWidthPx: 2, // 2px solid focus ring indicator (WCAG 2.4.13)
  focusRingOffsetPx: 2, // 2px offset between focus ring and component boundary
  focusContrastRatio: 3.0, // 3.0:1 minimum contrast between focused and unfocused state
  navHeightPx: 64, // Navigation height used for scroll-padding-top (WCAG 2.4.11)
} as const;
