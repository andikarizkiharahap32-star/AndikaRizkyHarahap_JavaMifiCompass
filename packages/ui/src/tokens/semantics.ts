// ─────────────────────────────────────────────────────────────
// Semantic Tokens — JavaMifi Compass
// Transit line colorways, physical paper surfaces, and ink tones
// Strictly aligned with docs/DESIGN.md and GEMINI.md
// ─────────────────────────────────────────────────────────────

export const transitLineTokens = {
  // Pocket WiFi rental hardware (strictly reserved, never used for food)
  wifi: '#F27B2A',
  wifiStroke: '#C95A0A',

  // Digital travel eSIM
  esim: '#4C97FF',
  esimStroke: '#2468E0',

  // Physical travel SIM card
  sim: '#E96BB0',
  simStroke: '#C23A86',

  // JavaMifi PRO corporate priority line (indigo, zero purple)
  pro: '#18215A',

  // Compass Rasa Halal Dining (strictly isolated Jade, never orange)
  dining: '#059669',
  diningStroke: '#047857',
  diningSurface: '#D1FAE5',
} as const;

export const surfaceTokens = {
  // Base architectural tactile paper ground
  baseGround: '#EDF0EE',

  // Card stock material ground
  paper: '#FFFFFF',

  // Tactile paper edge lip (border-b-2)
  paperEdge: '#CDD4D0',

  // Recessed utility beds, meter tracks, code blocks
  sunken: '#E1E6E3',

  // Active selection highlight
  selection: '#D3D9F0',
} as const;

export const inkTokens = {
  // Deep Nila Indigo: authoritative structural ink for body copy, titles, route rails
  primary: '#18215A',
  primaryHover: '#2B3A8C',
  primaryPressed: '#0E1440',
  onPrimary: '#EDF0EE',

  // Slate Indigo: de-emphasized metadata, timestamps, captions
  secondary: '#454E7A',
  onSecondary: '#FFFFFF',

  // Structural outline & subtle borders
  outline: '#6B7570',
  outlineVariant: '#C6C5D1',
} as const;

export const statusTokens = {
  success: '#176B40',
  successSurface: '#D7EBDF',
  warning: '#7A4F00',
  warningSurface: '#F7E8C2',
  danger: '#A8231B',
  dangerSurface: '#F6D9D6',
} as const;
