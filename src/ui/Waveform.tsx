import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../theme/tokens';

function Bar({ index, active, color }: { index: number; active: boolean; color: string }) {
  const value = useSharedValue(0.25);

  useEffect(() => {
    if (active) {
      const duration = 420 + (index % 5) * 95;
      value.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      value.value = withTiming(0.25, { duration: 250 });
    }
  }, [active, index, value]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: value.value }] }));

  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

export function Waveform({
  active = true,
  color = colors.accent,
  bars = 5,
}: {
  active?: boolean;
  color?: string;
  bars?: number;
}) {
  return (
    <View style={styles.row}>
      {Array.from({ length: bars }).map((_, i) => (
        <Bar key={i} index={i} active={active} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 40 },
  bar: { width: 6, height: 40, borderRadius: 3, marginHorizontal: 3.5 },
});
