import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, font, spacing } from '../theme/tokens';
import { useStore } from '../state/store';

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
        <Animated.Text
          key={statusLine}
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(160)}
          style={styles.status}
          numberOfLines={2}
        >
          {thinking ? 'Thinking…' : statusLine}
        </Animated.Text>
      </View>
      {!!formProgress && (
        <Animated.Text
          key={formProgress}
          entering={FadeIn.duration(260)}
          style={styles.progress}
          numberOfLines={1}
        >
          {formProgress}
        </Animated.Text>
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.active,
  },
  status: {
    flex: 1,
    color: colors.islandInk,
    fontSize: font.body,
    fontWeight: font.weightMedium,
  },
  progress: {
    marginTop: spacing.xs,
    marginLeft: 24,
    color: colors.islandMuted,
    fontSize: font.bodySmall,
  },
});
