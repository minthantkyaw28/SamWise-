/**
 * Accessibility-first design tokens.
 *
 * Principles (see project brief §6):
 *  - Large type: body >= 20, headings >= 32.
 *  - Very high contrast: near-black ink on a warm off-white.
 *  - One bold accent: deep terracotta/red.
 *  - Generous spacing, large touch targets (>= 64px), slow deliberate motion.
 */

export const colors = {
  // Warm off-white background, near-black ink — high contrast, easy on the eye.
  bg: '#FBF7F0',
  surface: '#FFFFFF',
  ink: '#1A1614',
  inkSoft: '#4A4440',

  // Bold accent — deep terracotta.
  accent: '#B5341B',
  accentDark: '#8A2614',
  accentSoft: '#F6E2DC',

  // The floating island is near-black like a Dynamic Island.
  island: '#141210',
  islandInk: '#FBF7F0',
  islandMuted: '#A8A29B',

  // Status colours.
  success: '#1F7A3D',
  successSoft: '#E2F1E7',
  pending: '#C9C2B8',
  active: '#B5341B',

  // Lines / shadows.
  line: '#E4DCCF',
  shadow: '#000000',
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
