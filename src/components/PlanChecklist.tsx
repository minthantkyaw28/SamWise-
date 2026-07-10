import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, font, radius, spacing } from '../theme/tokens';
import { useStore } from '../state/store';
import type { ChecklistStatus } from '../agent/types';

/** The ticking step-plan — the visible "agent brain". */
export function PlanChecklist() {
  const checklist = useStore((s) => s.checklist);
  if (checklist.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>My plan</Text>
      {checklist.map((item, i) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.delay(i * 90).duration(320)}
          style={styles.row}
        >
          <Marker status={item.status} />
          <Text
            style={[
              styles.label,
              item.status === 'done' && styles.labelDone,
              item.status === 'active' && styles.labelActive,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

function Marker({ status }: { status: ChecklistStatus }) {
  if (status === 'done') {
    return (
      <View style={[styles.marker, styles.markerDone]}>
        <Text style={styles.check}>✓</Text>
      </View>
    );
  }
  if (status === 'active') {
    return (
      <View style={[styles.marker, styles.markerActive]}>
        <View style={styles.activeDot} />
      </View>
    );
  }
  return <View style={[styles.marker, styles.markerPending]} />;
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  heading: {
    color: colors.islandMuted,
    fontSize: font.bodySmall,
    fontWeight: font.weightBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPending: {
    borderWidth: 2,
    borderColor: colors.islandMuted,
    opacity: 0.6,
  },
  markerActive: {
    backgroundColor: colors.accentSoft,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  markerDone: {
    backgroundColor: colors.success,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  check: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: font.weightBold,
  },
  label: {
    flex: 1,
    color: colors.islandInk,
    fontSize: font.body,
  },
  labelActive: {
    fontWeight: font.weightBold,
  },
  labelDone: {
    color: colors.islandMuted,
    textDecorationLine: 'line-through',
  },
});
// chore: note 2026-07-10T15:42:39
