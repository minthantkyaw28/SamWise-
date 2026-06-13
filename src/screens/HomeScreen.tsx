import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Glass, Icon, ScreenBackground, VoiceOrb, type IconName } from '../ui';
import { colors, glass, radius, spacing } from '../theme/tokens';

type Service = {
  icon: IconName;
  tint: string;
  label: string;
  subtitle: string;
};

const SERVICES: Service[] = [
  { icon: 'pound', tint: colors.accentSoft, label: 'Pensions & benefits', subtitle: 'Pension Credit, allowances, top-ups' },
  { icon: 'cross-medical', tint: '#E2F4EC', label: 'Health & care', subtitle: 'GP, prescriptions, appointments' },
  { icon: 'home', tint: '#E6EEF8', label: 'Banking', subtitle: 'Balances, payments, statements' },
  { icon: 'pin', tint: '#F3ECE0', label: 'Housing & council', subtitle: 'Council tax, housing support' },
  { icon: 'globe', tint: '#F6E2DC', label: 'Driving & travel', subtitle: 'Licence, bus pass, renewals' },
  { icon: 'doc', tint: '#EDE7F6', label: 'Taxes', subtitle: 'Self-assessment, refunds, forms' },
];

/** The idle "phone home" backdrop — pure presentation, no store reads. */
export function HomeScreen() {
  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <VoiceOrb state="idle" size={130} />
          <AppText variant="hero" center style={styles.heroTitle}>
            Hi, I’m Samwise
          </AppText>
          <AppText variant="bodyLg" color={colors.inkSoft} center style={styles.heroSub}>
            Tell me what you need to do — I’ll handle the fiddly bits with you, one
            step at a time.
          </AppText>
        </View>

        <AppText variant="label" color={colors.inkSoft} style={styles.sectionLabel}>
          THINGS I CAN HELP WITH
        </AppText>

        <View style={styles.list}>
          {SERVICES.map((s) => (
            <Glass key={s.label} contentStyle={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: s.tint }]}>
                <Icon name={s.icon} size={28} color={colors.accent} />
              </View>
              <View style={styles.cardText}>
                <AppText variant="heading">{s.label}</AppText>
                <AppText variant="body" color={colors.inkSoft}>
                  {s.subtitle}
                </AppText>
              </View>
            </Glass>
          ))}
        </View>

        <Glass style={styles.hint} tint={glass.tintWash} contentStyle={styles.hintContent}>
          <View style={styles.hintIcon}>
            <Icon name="sparkles" size={24} color={colors.accent} />
          </View>
          <AppText variant="bodyLg" style={styles.hintText}>
            Tap the Samwise button at the top — or just start talking.
          </AppText>
        </Glass>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 110,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  heroTitle: {
    marginTop: spacing.sm,
  },
  heroSub: {
    maxWidth: 340,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: spacing.xs,
  },
  hint: {
    marginTop: spacing.xl,
  },
  hintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  hintIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.strong,
  },
  hintText: {
    flex: 1,
  },
});
