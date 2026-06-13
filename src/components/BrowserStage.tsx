import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MockBrowser } from './MockBrowser';
import { orchestrator } from '../agent/AgentOrchestrator';
import type { BrowserHandle } from '../agent/browserActions';
import type { BridgeMessage } from '../agent/types';
import { useStore } from '../state/store';
import { AppText, Icon } from '../ui';
import { colors, glass, radius, shadowCard, spacing } from '../theme/tokens';

/**
 * The "real in-app browser" card. Always mounted so the WebView preloads, but
 * only revealed (animated in) once the agent reaches a browser step. It is a
 * SOLID card (not glass) — a WebView will not render inside a BlurView on iOS.
 */
export function BrowserStage() {
  const visible = useStore((s) => s.browserVisible);
  const url = useStore((s) => s.browserUrl);
  const handleRef = useRef<BrowserHandle>(null);

  // Wire the live WebView into the orchestrator once.
  useEffect(() => {
    if (handleRef.current) orchestrator.attachBrowser(handleRef.current);
  }, []);

  const onEvent = useCallback((msg: BridgeMessage) => {
    if (msg.type === 'ready') {
      useStore.getState().setWebReady(true);
    }
  }, []);

  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withTiming(visible ? 1 : 0, { duration: 380 });
  }, [visible, v]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * 28 }],
  }));

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.stage, animStyle]}>
      {/* Fake browser chrome so it reads as a real, hosted page. */}
      <View style={styles.chrome}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: '#ff5f57' }]} />
          <View style={[styles.dot, { backgroundColor: '#febc2e' }]} />
          <View style={[styles.dot, { backgroundColor: '#28c840' }]} />
        </View>
        <View style={styles.urlBar}>
          <Icon name="lock" size={12} color={colors.success} />
          <AppText variant="caption" color={colors.inkSoft} numberOfLines={1} style={styles.url}>
            {url || 'www.gov.uk'}
          </AppText>
        </View>
      </View>
      <View style={styles.webWrap}>
        <MockBrowser ref={handleRef} onEvent={onEvent} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'absolute',
    top: 100,
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    zIndex: 50,
    ...shadowCard,
  },
  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#F2F0EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: glass.hairline,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.hairline,
  },
  url: { flex: 1 },
  webWrap: { flex: 1, backgroundColor: colors.surface },
});
