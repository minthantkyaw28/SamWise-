import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { glass, radius, shadowCard, spacing } from '../theme/tokens';

type GlassProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  padding?: number;
  strong?: boolean;
  tint?: string;
  noShadow?: boolean;
};

export function Glass({
  children,
  style,
  contentStyle,
  radius: radiusProp = radius.lg,
  padding,
  strong = false,
  tint,
  noShadow = false,
}: GlassProps) {
  return (
    <View style={[{ borderRadius: radiusProp }, noShadow ? null : shadowCard, style]}>
      <BlurView
        intensity={strong ? 64 : 42}
        tint="light"
        style={[
          {
            borderRadius: radiusProp,
            overflow: 'hidden',
            padding: padding ?? spacing.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: glass.border,
            backgroundColor: strong ? glass.strong : glass.fill,
          },
          tint ? { backgroundColor: tint } : null,
          contentStyle,
        ]}
      >
        {children}
      </BlurView>
    </View>
  );
}
