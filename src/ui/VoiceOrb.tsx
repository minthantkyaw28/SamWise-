import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { gradients } from '../theme/tokens';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'success';

type Props = { size?: number; state?: OrbState };

const ORB_PULSE = 2200;

const ORB_SHADOW = {
  shadowColor: '#7A6BE0',
  shadowOpacity: 0.4,
  shadowRadius: 36,
  shadowOffset: { width: 0, height: 14 },
  elevation: 12,
};

const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

function Ring({ size, delay, active }: { size: number; delay: number; active: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false),
      );
    } else {
      progress.value = withTiming(0, { duration: 300 });
    }
  }, [active, delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 0.45, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.72, 1.85]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ width: size, height: size, borderRadius: size / 2 }, styles.ring, style]}
    />
  );
}

export function VoiceOrb({ size = 168, state = 'idle' }: Props) {
  const breathe = useSharedValue(1);
  const glow = useSharedValue(0);
  const listening = state === 'listening';

  useEffect(() => {
    const amp = listening ? 1.1 : 1.055;
    const dur = listening ? 1100 : ORB_PULSE;
    breathe.value = withRepeat(
      withTiming(amp, { duration: dur, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    glow.value = withRepeat(
      withTiming(1, { duration: dur, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [listening, breathe, glow]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.35, 0.7]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1.1, 1.36]) }],
  }));

  const orbColors =
    state === 'success'
      ? gradients.orbSuccess
      : listening
        ? gradients.orbListening
        : gradients.orb;
  const circle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.wrap, { width: size * 1.75, height: size * 1.75 }]}>
      {[0, 800, 1600].map((d) => (
        <View key={d} pointerEvents="none" style={styles.layer}>
          <Ring size={size} delay={d} active={listening} />
        </View>
      ))}

      <View pointerEvents="none" style={styles.layer}>
        <Animated.View style={[circle, styles.glowBox, glowStyle]}>
          <LinearGradient colors={orbColors} style={FILL} />
        </Animated.View>
      </View>

      <Animated.View style={[circle, ORB_SHADOW, orbStyle]}>
        <LinearGradient
          colors={orbColors}
          start={{ x: 0.12, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[FILL, { borderRadius: size / 2 }]}
        />
        <View
          style={[
            styles.sheen,
            {
              width: size * 0.42,
              height: size * 0.42,
              borderRadius: size * 0.21,
              top: size * 0.13,
              left: size * 0.17,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderWidth: 2.5, borderColor: 'rgba(124,140,235,0.55)' },
  glowBox: { overflow: 'hidden' },
  sheen: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.5)' },
});
