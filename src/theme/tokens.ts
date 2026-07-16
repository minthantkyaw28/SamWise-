/**
 * Accessibility-first design tokens.
 *
 * Palette: Samwise Design System v1 — a calm liquid-glass aesthetic. Cool blue
 * primary + lilac canvas + cool near-black ink. Token names are unchanged (the
 * components reference them by role); only the values are the v1 colours.
 *  - Large type: body >= 20, headings >= 32.
 *  - Very high contrast on a soft lilac canvas.
 *  - Generous spacing, large touch targets (>= 64px), slow deliberate motion.
 */

export const colors = {
  // Lilac aurora canvas, cool near-black ink — high contrast, easy on the eye.
  bg: '#F4EDFB', // canvas
  surface: '#FFFFFF', // onColor / white glass
  ink: '#181A22',
  inkSoft: '#525868',

  // Brand — primary blue (primary actions, accents, active states).
  accent: '#2C6BE0', // primary
  accentDark: '#1E51B6', // primaryDeep (pressed / gradient end)
  accentSoft: 'rgba(44,107,224,0.10)', // tintWash (soft-primary background)

  // The floating island is the cool near-black, like a Dynamic Island.
  island: '#181A22', // ink
  islandInk: '#FFFFFF', // onColor
  islandMuted: '#8A8F9E', // inkFaint

  // Status colours.
  success: '#13A06A',
  successSoft: 'rgba(19,160,106,0.12)', // successWash
  pending: '#8A8F9E', // inkFaint
  active: '#2C6BE0', // primary

  // Lines / shadows.
  line: 'rgba(24,26,34,0.08)', // hairline
  shadow: '#2A2750', // premium card-shadow tint
} as const;

export const font = {
  // Sizes — deliberately large.
  bodySmall: 18,
  body: 22,
  bodyLarge: 26,
  title: 32,
  display: 40,
  hero: 48,

  lineHeight: 1.4,

  weightRegular: '400' as const,
  weightMedium: '600' as const,
  weightBold: '800' as const,
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 28,
  xl: 40,
  xxl: 56,
};

export const radius = {
  sm: 14,
  md: 22,
  lg: 32,
  pill: 999,
};

// Large touch targets.
export const touch = {
  minHeight: 64,
  bigButton: 84,
};

// Slow, deliberate motion (ms). Spring-y, never snappy.
export const motion = {
  fast: 220,
  base: 340,
  slow: 480,
  // Per-character typing cadence inside the WebView form.
  typeCharMs: 52,
};

export const shadowCard = {
  shadowColor: colors.shadow,
  shadowOpacity: 0.16,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 12,
};
// chore: note 2026-07-16T15:15:40
