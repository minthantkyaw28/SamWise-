import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Lexend_400Regular, Lexend_600SemiBold, Lexend_700Bold } from '@expo-google-fonts/lexend';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

import { HomeScreen } from './src/screens/HomeScreen';
import { BrowserStage } from './src/components/BrowserStage';
import { AgentLogPanel } from './src/components/AgentLogPanel';
import { Island } from './src/components/Island';
import { Confetti } from './src/components/Confetti';
import { useStore } from './src/state/store';
import { useVoice } from './src/voice/useVoice';
import { orchestrator } from './src/agent/AgentOrchestrator';
import { createPlanner } from './src/agent/llm';
import { colors } from './src/theme/tokens';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Lexend_400Regular,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const done = useStore((s) => s.agentState === 'DONE');

  // Wire the OpenAI planner (resolved during PLANNING, cached) and the voice
  // layer. Both degrade gracefully when their API keys are absent.
  useVoice();
  useEffect(() => {
    orchestrator.attachPlanner(createPlanner());
  }, []);

  // Hold the UI until the brand fonts are ready (avoids a flash of system text).
  if (!fontsLoaded && !fontError) {
    return <View style={styles.root} />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.root}>
          {/* Base: the Samwise home (aurora backdrop + idle hero). */}
          <HomeScreen />

          {/* 70% — the real in-app browser the agent drives (revealed mid-run). */}
          <BrowserStage />

          {/* 30% — the live agent-activity log, shown while the agent works. */}
          <AgentLogPanel />

          {/* The floating, draggable Samwise control — always on top. */}
          <Island />

          {/* Celebration on success. */}
          <Confetti visible={done} />

          <StatusBar style="dark" />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
