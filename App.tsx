import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HomeScreen } from './src/screens/HomeScreen';
import { BrowserStage } from './src/components/BrowserStage';
import { Island } from './src/components/Island';
import { Confetti } from './src/components/Confetti';
import { useStore } from './src/state/store';
import { useVoice } from './src/voice/useVoice';
import { orchestrator } from './src/agent/AgentOrchestrator';
import { createPlanner } from './src/agent/llm';
import { colors } from './src/theme/tokens';

export default function App() {
  const done = useStore((s) => s.agentState === 'DONE');

  // Wire the OpenAI planner (resolved during PLANNING, cached) and the voice
  // layer. Both degrade gracefully when their API keys are absent.
  useVoice();
  useEffect(() => {
    orchestrator.attachPlanner(createPlanner());
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        {/* Base: the mock phone home. */}
        <HomeScreen />

        {/* The real in-app browser the agent drives (revealed mid-run). */}
        <BrowserStage />

        {/* The floating, draggable agent island — always on top. */}
        <Island />

        {/* Celebration on success. */}
        <Confetti visible={done} />

        <StatusBar style="dark" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
// chore: note 2026-07-17T14:55:02
