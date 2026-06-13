import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useStore } from '../state/store';
import { AgentLogFeed } from '../ui';
import { spacing } from '../theme/tokens';

/**
 * The bottom ~30% live "agent logs" panel — the running feed of what the agent
 * is doing while it works. Slides up once a task starts (agentState leaves IDLE)
 * and sits below the 70% browser stage.
 */
export function AgentLogPanel() {
  const agentState = useStore((s) => s.agentState);
  const visible = agentState !== 'IDLE';

  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withTiming(visible ? 1 : 0, { duration: 380 });
  }, [visible, v]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * 40 }],
  }));

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.panel, animStyle]}>
      <AgentLogFeed style={styles.feed} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    height: '30%',
    zIndex: 60,
  },
  feed: { flex: 1 },
});
