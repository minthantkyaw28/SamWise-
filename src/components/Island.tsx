import React, { useEffect } from 'react';
import {
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, font, radius, shadowCard, spacing, touch } from '../theme/tokens';
import { useStore } from '../state/store';
import { orchestrator } from '../agent/AgentOrchestrator';
import { voice } from '../voice/useVoice';
import { PlanChecklist } from './PlanChecklist';
import { StatusFeed } from './StatusFeed';
import { BigButton } from './BigButton';

const { width: W, height: H } = Dimensions.get('window');
const PANEL_WIDTH = W - 24;

export function Island() {
  const expanded = useStore((s) => s.islandExpanded);
  const setExpanded = useStore((s) => s.setIslandExpanded);
  const agentState = useStore((s) => s.agentState);
  const narration = useStore((s) => s.narration);
  const statusLine = useStore((s) => s.statusLine);
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

  if (!expanded) {
    const pillLabel =
      agentState === 'IDLE' ? 'Samwise' : statusLine || shortStatusFor(agentState);
    return (
      <Animated.View pointerEvents="box-none" style={[styles.containerCollapsed, posStyle]}>
        <GestureDetector gesture={collapsedGesture}>
          <Animated.View entering={FadeIn.duration(220)} style={styles.pill}>
            <PulseDot active={agentState !== 'IDLE'} listening={listening} />
            <Text style={styles.pillText} numberOfLines={1}>
              {pillLabel}
            </Text>
            {/* dropdown affordance — tap the pill to re-open the full island */}
            <Text style={styles.pillChevron}>⌄</Text>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    );
  }

  const idle = agentState === 'IDLE';
  const done = agentState === 'DONE';

  return (
    <Animated.View pointerEvents="box-none" style={[styles.containerExpanded, posStyle]}>
      <Animated.View entering={FadeIn.duration(240)} style={styles.panel}>
        <GestureDetector gesture={headerGesture}>
          <Animated.View style={styles.header}>
            <View style={styles.grabber} />
            <View style={styles.headerRow}>
              <View style={styles.brandRow}>
                <PulseDot active={agentState !== 'IDLE'} listening={listening} />
                <Text style={styles.brand}>Samwise</Text>
              </View>
              <Pressable
                onPress={collapse}
                hitSlop={16}
                accessibilityLabel="Minimise"
                style={styles.chevron}
              >
                <Text style={styles.chevronText}>⌄</Text>
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
            <Animated.Text key={narration} entering={FadeIn.duration(300)} style={styles.narration}>
              {narration}
            </Animated.Text>
          )}

          <StatusFeed />

          {/* The question + big answer buttons. */}
          {pendingQuestion && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.questionBlock}>
              <Text style={styles.question}>{pendingQuestion.question}</Text>
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

          <PlanChecklist />

          {/* Idle: the conversational entry point. */}
          {idle && !pendingQuestion && (
            <View style={styles.inputArea}>
              <Text style={styles.prompt}>What would you like help with?</Text>
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
                  <Text style={styles.sendText}>→</Text>
                </Pressable>
              </View>
              <Pressable onPress={onMic} style={styles.micButton} accessibilityLabel="Speak">
                <Text style={styles.micIcon}>🎙</Text>
                <Text style={styles.micLabel}>
                  {listening ? 'Listening…' : 'Tap to ask by voice'}
                </Text>
              </Pressable>
              <Pressable onPress={submit} hitSlop={8} style={styles.suggestion}>
                <Text style={styles.suggestionText}>“Help me claim my pension”</Text>
              </Pressable>
            </View>
          )}

          {done && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.doneBlock}>
              <Text style={styles.doneTitle}>Claim submitted 🎉</Text>
              <BigButton
                label="Start again"
                variant="secondary"
                onPress={() => useStore.getState().reset()}
              />
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

function PulseDot({ active, listening }: { active: boolean; listening: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (active || listening) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [active, listening, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[styles.dot, { backgroundColor: listening ? colors.accent : colors.success }, style]}
      />
    </View>
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
    backgroundColor: colors.island,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    minHeight: 52,
    ...shadowCard,
  },
  pillText: {
    color: colors.islandInk,
    fontSize: font.body,
    fontWeight: font.weightBold,
    maxWidth: W * 0.5,
  },
  pillChevron: {
    color: colors.islandMuted,
    fontSize: 22,
    lineHeight: 22,
    marginLeft: 2,
  },
  // --- expanded panel ---
  panel: {
    width: PANEL_WIDTH,
    backgroundColor: colors.island,
    borderRadius: radius.lg,
    maxHeight: H * 0.74,
    overflow: 'hidden',
    ...shadowCard,
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
  brand: {
    color: colors.islandInk,
    fontSize: font.bodyLarge,
    fontWeight: font.weightBold,
  },
  chevron: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: { color: colors.islandMuted, fontSize: 28, lineHeight: 28 },
  body: { paddingHorizontal: spacing.md },
  bodyContent: { paddingBottom: spacing.lg },
  narration: {
    color: colors.islandInk,
    fontSize: font.bodyLarge,
    lineHeight: font.bodyLarge * 1.35,
    fontWeight: font.weightMedium,
    marginBottom: spacing.sm,
  },
  questionBlock: { marginTop: spacing.md },
  question: {
    color: colors.islandInk,
    fontSize: font.title,
    fontWeight: font.weightBold,
    marginBottom: spacing.md,
    lineHeight: font.title * 1.25,
  },
  options: { gap: spacing.sm },
  option: { width: '100%' },
  inputArea: { marginTop: spacing.md, gap: spacing.md },
  prompt: {
    color: colors.islandInk,
    fontSize: font.bodyLarge,
    fontWeight: font.weightMedium,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: touch.minHeight,
    backgroundColor: '#26221E',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.islandInk,
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
  sendText: { color: colors.surface, fontSize: 30, fontWeight: font.weightBold },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: touch.minHeight,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.islandMuted,
  },
  micIcon: { fontSize: 26 },
  micLabel: { color: colors.islandInk, fontSize: font.body, fontWeight: font.weightMedium },
  suggestion: { alignItems: 'center', paddingVertical: spacing.xs },
  suggestionText: { color: colors.islandMuted, fontSize: font.body, fontStyle: 'italic' },
  doneBlock: { marginTop: spacing.lg, gap: spacing.md },
  doneTitle: {
    color: colors.islandInk,
    fontSize: font.title,
    fontWeight: font.weightBold,
  },
  // --- shared dot ---
  dotWrap: { width: 16, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
