import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppText } from '../ui';
import { colors, spacing } from '../theme/tokens';
import { useStore } from '../state/store';

const AnimatedAppText = Animated.createAnimatedComponent(AppText);

/** The "what I'm doing right now" line, plus form-fill sub-progress. */
export function StatusFeed() {
  const statusLine = useStore((s) => s.statusLine);
  const formProgress = useStore((s) => s.formProgressLabel);
  const thinking = useStore((s) => s.thinking);

  if (!statusLine && !thinking) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.dot} />
        <AnimatedAppText
          key={statusLine}
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(160)}
          variant="body"
          color={colors.islandInk}
          style={styles.status}
          numberOfLines={2}
        >
          {thinking ? 'Thinking…' : statusLine}
        </AnimatedAppText>
      </View>
      {!!formProgress && (
        <AnimatedAppText
          key={formProgress}
          entering={FadeIn.duration(260)}
          variant="caption"
          color={colors.inkSoft}
          style={styles.progress}
          numberOfLines={1}
        >
          {formProgress}
        </AnimatedAppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  status: {
    flex: 1,
  },
  progress: {
    marginTop: spacing.xs,
    marginLeft: 22,
  },
});
