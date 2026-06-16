import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadowCard, spacing } from '../theme/tokens';

const SERVICES = [
  { icon: '💷', label: 'Pensions & benefits', tint: colors.accentSoft },
  { icon: '🏥', label: 'Health & care', tint: '#E2F1E7' },
  { icon: '🏦', label: 'Banking', tint: '#E6EEF8' },
  { icon: '🏠', label: 'Housing & council', tint: '#F3ECE0' },
  { icon: '🚗', label: 'Driving & travel', tint: '#F6E2DC' },
  { icon: '📄', label: 'Taxes', tint: '#EDE7F6' },
];

/** The mock phone home / "everything is behind an app" backdrop. */
export function HomeScreen() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Good afternoon</Text>
        <Text style={styles.title}>Your services</Text>
        <Text style={styles.sub}>Everything you need — in one place. Just ask Samwise.</Text>

        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <View key={s.label} style={styles.tile}>
              <View style={[styles.iconWrap, { backgroundColor: s.tint }]}>
                <Text style={styles.icon}>{s.icon}</Text>
              </View>
              <Text style={styles.tileLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Need a hand?</Text>
          <Text style={styles.hintText}>
            Tap the Samwise island at the top and say what you’d like to do — in your own words.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: 150, paddingBottom: spacing.xxl },
  greeting: { fontSize: font.body, color: colors.inkSoft, fontWeight: font.weightMedium },
  title: { fontSize: font.display, color: colors.ink, fontWeight: font.weightBold, marginTop: 4 },
  sub: {
    fontSize: font.body,
    color: colors.inkSoft,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: font.body * 1.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  tile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadowCard,
    shadowOpacity: 0.08,
    elevation: 4,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 34 },
  tileLabel: { fontSize: font.body, color: colors.ink, fontWeight: font.weightMedium },
  hintCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.island,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  hintTitle: { color: colors.islandInk, fontSize: font.bodyLarge, fontWeight: font.weightBold },
  hintText: { color: colors.islandMuted, fontSize: font.body, lineHeight: font.body * 1.4 },
});
// chore: note 2026-06-16T22:01:47
