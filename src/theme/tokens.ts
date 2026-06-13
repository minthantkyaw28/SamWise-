/**
 * Samwise design system tokens.
 *
 * Re-skinned to the Samwise "liquid glass on a warm aurora" look. Every export
 * name + sub-key below matches what the existing components already import
 * (colors.*, font.*, spacing.*, radius.*, touch.*, shadowCard), so swapping the
 * VALUES re-skins the whole app with zero logic change. New exports
 * (`gradients`, `glass`, `font.family*`) power the ported `src/ui` components.
 *
 * Accessibility kept: body >= 18, large touch targets (>= 64), high contrast.
 */

import { Platform } from 'react-native';

export const colors = {
  bg: '#F2E9FB',
  surface: '#FFFFFF',
  ink: '#181A22',
  inkSoft: '#525868',

  // Brand accent is now our trust-blue (was terracotta).
  accent: '#2C6BE0',
  accentDark: '#1E51B6',
  accentSoft: '#E7EEFC',

  // The floating agent now reads as light glass.
  island: '#FFFFFF',
  islandInk: '#181A22',
  islandMuted: '#8A8F9E',

  success: '#13A06A',
  successSoft: '#E2F4EC',
  pending: '#C7CCD6',
  active: '#2C6BE0',

  line: '#E6E1F0',
  shadow: '#2A2750',
} as const;

export const gradients = {
  /** The calming aurora canvas. */
  background: ['#EFE7FB', '#FCF4EF', '#E7F0FC'],
  blobSky: ['#9CC4FF', '#67A8FF'],
  blobLilac: ['#C9B8F5', '#A78BEA'],
  blobPeach: ['#FFC2A8', '#FF9E80'],
  /** The living voice orb. */
  orb: ['#67A8FF', '#A78BEA', '#FF9E80'],
  orbListening: ['#5AC8FF', '#67A8FF', '#A78BEA'],
  orbSuccess: ['#5BE0A8', '#13A06A'],
  primaryButton: ['#3B79E8', '#2C6BE0'],
} as const;

export const glass = {
  fill: 'rgba(255,255,255,0.62)',
  strong: 'rgba(255,255,255,0.80)',
  dim: 'rgba(255,255,255,0.40)',
  border: 'rgba(255,255,255,0.85)',
  hairline: 'rgba(24,26,34,0.08)',
  tintWash: 'rgba(44,107,224,0.10)',
} as const;

export const font = {
  // Sizes — accessible, our ramp.
  bodySmall: 16,
  body: 18,
  bodyLarge: 20,
  title: 27,
  display: 34,
  hero: 40,

  lineHeight: 1.4,

  weightRegular: '400' as const,
  weightMedium: '600' as const,
  weightBold: '800' as const,

  // Families — loaded in App.tsx via @expo-google-fonts.
  familyDisplay: 'Lexend_700Bold',
  familyHeading: 'Lexend_600SemiBold',
  familyBody: 'Inter_400Regular',
  familyBodyMedium: 'Inter_500Medium',
  familyBodyBold: 'Inter_600SemiBold',
  familyMono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
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

export const motion = {
  fast: 220,
  base: 340,
  slow: 480,
  typeCharMs: 52,
};

export const shadowCard = {
  shadowColor: colors.shadow,
  shadowOpacity: 0.16,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 12,
};
