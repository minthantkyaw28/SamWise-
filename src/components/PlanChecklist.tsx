import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Icon } from '../ui';
import { colors, radius, spacing } from '../theme/tokens';
import { useStore } from '../state/store';
import type { ChecklistStatus } from '../agent/types';

/** The ticking step-plan — the visible "agent brain". */
export function PlanChecklist() {
  const checklist = useStore((s) => s.checklist);
  if (checklist.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.inkSoft} style={styles.heading}>
        My plan
      </AppText>
      {checklist.map((item, i) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.delay(i * 90).duration(320)}
          style={styles.row}
        >
          <Marker status={item.status} />
          <AppText
            variant="body"
            color={item.status === 'done' ? colors.islandMuted : colors.islandInk}
            style={[
              styles.label,
              item.status === 'done' && styles.labelDone,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </AppText>
        </Animated.View>
      ))}
    </View>
  );
}

function Marker({ status }: { status: ChecklistStatus }) {
  if (status === 'done') {
    return (
      <View style={[styles.marker, styles.markerDone]}>
        <Icon name="check" color="#fff" size={16} />
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
    borderColor: colors.pending,
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
  label: {
    flex: 1,
  },
  labelDone: {
    textDecorationLine: 'line-through',
  },
});
