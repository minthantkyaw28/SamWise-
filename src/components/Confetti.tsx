import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/tokens';

const { width: W, height: H } = Dimensions.get('window');
const PIECE_COLORS = [colors.accent, colors.success, '#E8B53A', colors.accentDark, '#3A7BD5'];
const PIECES = 28;

/** Lightweight celebration burst shown when the claim is submitted. */
export function Confetti({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: PIECES }).map((_, i) => (
        <Piece key={i} index={i} />
      ))}
    </View>
  );
}

function Piece({ index }: { index: number }) {
  // Deterministic per-piece variation (no Math.random needed).
  const startX = (index / PIECES) * W + ((index * 37) % 40) - 20;
  const drift = ((index * 53) % 80) - 40;
  const delay = (index * 60) % 700;
  const duration = 1700 + ((index * 90) % 900);
  const size = 9 + (index % 4) * 3;
  const color = PIECE_COLORS[index % PIECE_COLORS.length];

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.in(Easing.quad) })
    );
  }, [delay, duration, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + drift * progress.value },
      { translateY: -40 + (H + 80) * progress.value },
      { rotate: `${progress.value * 540}deg` },
    ],
    opacity: 1 - Math.max(0, progress.value - 0.85) / 0.15,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size * 1.6,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}
// chore: note 2026-06-30T21:18:10
