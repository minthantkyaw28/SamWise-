import { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, spacing } from '../theme/tokens';
import { useStore, type LogEntry } from '../state/store';
import { AppText } from './AppText';
import { Glass } from './Glass';
import { Icon } from './Icon';

const KIND_COLOR: Record<LogEntry['kind'], string> = {
  status: colors.accent,
  narration: '#A78BEA',
  progress: colors.success,
};

function PulseDot() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.6,
    transform: [{ scale: 0.85 + pulse.value * 0.35 }],
  }));

  return <Animated.View style={[styles.pulseDot, style]} />;
}

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <Animated.View entering={FadeIn} style={styles.row}>
      <View style={[styles.kindDot, { backgroundColor: KIND_COLOR[entry.kind] }]} />
      <AppText variant="mono" color={colors.inkSoft} style={styles.rowText}>
        {entry.text}
      </AppText>
    </Animated.View>
  );
}

export function AgentLogFeed({ style }: { style?: StyleProp<ViewStyle> }) {
  const log = useStore((s) => s.log);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [log.length]);

  return (
    <Glass strong style={[styles.fill, style]} contentStyle={styles.content}>
      <View style={styles.header}>
        <Icon name="sparkles" size={16} color={colors.accent} />
        <AppText variant="label" color={colors.inkSoft} style={styles.headerLabel}>
          ACTIVITY
        </AppText>
        <PulseDot />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.fill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {log.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="mono" color={colors.islandMuted}>
              Waiting to start…
            </AppText>
          </View>
        ) : (
          log.map((entry) => <LogRow key={entry.id} entry={entry} />)
        )}
      </ScrollView>
    </Glass>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  headerLabel: { letterSpacing: 1.5 },
  pulseDot: {
    marginLeft: 'auto',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  scrollContent: { paddingBottom: spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  kindDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 7 },
  rowText: { flex: 1 },
});
