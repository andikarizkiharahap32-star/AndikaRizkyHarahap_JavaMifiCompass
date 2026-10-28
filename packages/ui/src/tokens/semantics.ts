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

export const borderTokens = {
  // Border roles per P02-WS04
  default: '#CDD4D0',
  paperEdge: '#CDD4D0',
  outline: '#6B7570',
  outlineVariant: '#C6C5D1',
  divider: '#E1E6E3',
  focus: '#18215A',
} as const;

// ─────────────────────────────────────────────────────────────
// Section 3: Semantic Colors & WCAG 2.2 AA Contrast Standards
// ─────────────────────────────────────────────────────────────
export const semanticColors = {
  light: {
    bg: '#F6F7F5',
    surface: '#FFFFFF',
    text: '#0B1033',
    textMuted: '#4A5470', // WCAG AAA 7.1:1 contrast on #F6F7F5
    brand: '#0B1033',
    accentHalal: '#14733A',
    warning: '#8A5A00',
    warningBg: '#FFF4D6',
    danger: '#B42318',
    border: '#DDE1EA',
  },
  dark: {
    bg: '#0B0F1A',
    surface: '#131A2A',
    text: '#E8ECF5',
    textMuted: '#A3ADC4',
    brand: '#8FA8FF',
    accentHalal: '#4ADE80',
    warning: '#FBBF24',
    warningBg: '#2B2008',
    danger: '#F97066',
    border: '#26304A',
  },
} as const;

export const calculateLuminance = (hex: string): number => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

export const calculateContrastRatio = (hex1: string, hex2: string): number => {
  const l1 = calculateLuminance(hex1);
  const l2 = calculateLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};
