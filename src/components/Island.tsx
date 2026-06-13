import React from 'react';
import {
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { colors, font, glass, radius, spacing, touch } from '../theme/tokens';
import { useStore } from '../state/store';
import { orchestrator } from '../agent/AgentOrchestrator';
import { voice } from '../voice/useVoice';
import { BigButton } from './BigButton';
import { AppText, Glass, Icon, VoiceOrb, Waveform, type OrbState } from '../ui';

const { width: W, height: H } = Dimensions.get('window');
const PANEL_WIDTH = W - 24;

function orbStateFor(agentState: string, listening: boolean): OrbState {
  return listening
    ? 'listening'
    : agentState === 'DONE'
      ? 'success'
      : agentState === 'PLANNING'
        ? 'thinking'
        : 'idle';
}

export function Island() {
  const expanded = useStore((s) => s.islandExpanded);
  const setExpanded = useStore((s) => s.setIslandExpanded);
  const agentState = useStore((s) => s.agentState);
  const narration = useStore((s) => s.narration);
  const pendingQuestion = useStore((s) => s.pendingQuestion);
  const listening = useStore((s) => s.listening);
  const userInput = useStore((s) => s.userInput);
  const setUserInput = useStore((s) => s.setUserInput);

  // --- drag position ---
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const posStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = startX.value + e.translationX;
      // keep it from being dragged above the status bar
      ty.value = Math.max(-20, startY.value + e.translationY);
    });

  const expand = () => setExpanded(true);
  const collapse = () => {
    Keyboard.dismiss();
    setExpanded(false);
  };
  const longPressSkip = () => orchestrator.skip();

  const tap = Gesture.Tap().maxDuration(250).onEnd(() => runOnJS(expand)());
  const longPress = Gesture.LongPress()
    .minDuration(550)
    .onStart(() => runOnJS(longPressSkip)());

  const collapsedGesture = Gesture.Exclusive(longPress, pan, tap);
  const headerGesture = Gesture.Simultaneous(pan, longPress);

  const submit = () => {
    const text = userInput.trim() || 'Help me claim my pension';
    Keyboard.dismiss();
    orchestrator.startTask(text);
  };

  // Mic: use real speech-to-text when ElevenLabs is configured; otherwise fall
  // straight through to the deterministic intent so the demo always runs.
  const onMic = async () => {
    Keyboard.dismiss();
    if (!voice.enabled) {
      submit();
      return;
    }
    const heard = await voice.listen();
    orchestrator.startTask(heard?.trim() || userInput.trim() || 'Help me claim my pension');
  };

  const orbState = orbStateFor(agentState, listening);

  if (!expanded) {
    return (
      <Animated.View pointerEvents="box-none" style={[styles.containerCollapsed, posStyle]}>
        <GestureDetector gesture={collapsedGesture}>
          <Animated.View>
            <Glass strong radius={radius.pill} padding={spacing.xs} contentStyle={styles.pill}>
              <VoiceOrb size={44} state={orbState} />
              <AppText variant="bodyBold" color={colors.ink} numberOfLines={1} style={styles.pillText}>
                {agentState === 'IDLE' ? 'Samwise' : shortStatusFor(agentState)}
              </AppText>
            </Glass>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    );
  }

  const idle = agentState === 'IDLE';
  const done = agentState === 'DONE';

  return (
    <Animated.View pointerEvents="box-none" style={[styles.containerExpanded, posStyle]}>
      <Glass strong radius={radius.lg} padding={0} style={styles.panel} contentStyle={styles.panelContent}>
        <GestureDetector gesture={headerGesture}>
          <Animated.View style={styles.header}>
            <View style={styles.grabber} />
            <View style={styles.headerRow}>
              <View style={styles.brandRow}>
                <VoiceOrb size={56} state={orbState} />
                <AppText variant="title" color={colors.ink}>
                  Samwise
                </AppText>
              </View>
              <Pressable
                onPress={collapse}
                hitSlop={16}
                accessibilityLabel="Minimise"
                style={styles.chevron}
              >
                <Icon name="chevron-down" size={28} color={colors.inkSoft} />
              </Pressable>
            </View>
          </Animated.View>
        </GestureDetector>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Big narration text — what the agent is saying right now. */}
          {!!narration && (
            <Animated.View key={narration} entering={FadeIn.duration(300)} style={styles.narrationWrap}>
              <AppText variant="bodyLg" color={colors.ink}>
                {narration}
              </AppText>
            </Animated.View>
          )}

          {/* The question + big answer buttons. */}
          {pendingQuestion && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.questionBlock}>
              <AppText variant="title" color={colors.ink} style={styles.question}>
                {pendingQuestion.question}
              </AppText>
              <View style={styles.options}>
                {pendingQuestion.options.map((opt) => (
                  <BigButton
                    key={opt}
                    label={opt}
                    variant="primary"
                    onPress={() => orchestrator.provideUserAnswer(opt)}
                    style={styles.option}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Idle: the conversational entry point. */}
          {idle && !pendingQuestion && (
            <View style={styles.inputArea}>
              <AppText variant="bodyLg" color={colors.ink}>
                What would you like help with?
              </AppText>
              <View style={styles.inputRow}>
                <TextInput
                  value={userInput}
                  onChangeText={setUserInput}
                  onSubmitEditing={submit}
                  placeholder="Type or tap the mic…"
                  placeholderTextColor={colors.islandMuted}
                  style={styles.input}
                  returnKeyType="go"
                />
                <Pressable onPress={submit} style={styles.send} accessibilityLabel="Send">
                  <Icon name="arrow-right" size={28} color={colors.surface} />
                </Pressable>
              </View>
              <Pressable onPress={onMic} style={styles.micButton} accessibilityLabel="Speak">
                {listening ? (
                  <Waveform active color={colors.accent} />
                ) : (
                  <Icon name="mic" size={26} color={colors.accent} />
                )}
                <AppText variant="bodyBold" color={colors.ink}>
                  {listening ? 'Listening…' : 'Tap to ask by voice'}
                </AppText>
              </Pressable>
              <Pressable onPress={submit} hitSlop={8} style={styles.suggestion}>
                <AppText variant="body" color={colors.inkSoft} style={styles.suggestionText}>
                  “Help me claim my pension”
                </AppText>
              </Pressable>
            </View>
          )}

          {done && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.doneBlock}>
              <AppText variant="title" color={colors.ink}>
                Claim submitted 🎉
              </AppText>
              <BigButton
                label="Start again"
                variant="secondary"
                onPress={() => useStore.getState().reset()}
              />
            </Animated.View>
          )}
        </ScrollView>
      </Glass>
    </Animated.View>
  );
}

function shortStatusFor(state: string): string {
  switch (state) {
    case 'LISTENING':
      return 'Listening…';
    case 'PLANNING':
      return 'Planning…';
    case 'AWAITING_USER':
      return 'Your turn';
    case 'REVIEW':
      return 'Reviewing…';
    case 'DONE':
      return 'Done ✓';
    default:
      return 'Working…';
  }
}

const styles = StyleSheet.create({
  containerCollapsed: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  containerExpanded: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  // --- collapsed pill ---
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 52,
  },
  pillText: {
    maxWidth: W * 0.5,
  },
  // --- expanded panel ---
  panel: {
    width: PANEL_WIDTH,
    maxHeight: H * 0.74,
  },
  panelContent: {
    maxHeight: H * 0.74,
  },
  header: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.islandMuted,
    alignSelf: 'center',
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chevron: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.md },
  bodyContent: { paddingBottom: spacing.lg },
  narrationWrap: { marginBottom: spacing.sm },
  questionBlock: { marginTop: spacing.md },
  question: {
    marginBottom: spacing.md,
  },
  options: { gap: spacing.sm },
  option: { width: '100%' },
  inputArea: { marginTop: spacing.md, gap: spacing.md },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: touch.minHeight,
    backgroundColor: glass.dim,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.hairline,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    fontFamily: font.familyBody,
    fontSize: font.body,
  },
  send: {
    width: touch.minHeight,
    height: touch.minHeight,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: touch.minHeight,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.accentSoft,
    backgroundColor: glass.dim,
  },
  suggestion: { alignItems: 'center', paddingVertical: spacing.xs },
  suggestionText: { fontStyle: 'italic' },
  doneBlock: { marginTop: spacing.lg, gap: spacing.md },
});
