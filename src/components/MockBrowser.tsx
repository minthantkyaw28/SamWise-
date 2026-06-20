import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import type { BrowserHandle } from '../agent/browserActions';
import type { BridgeMessage } from '../agent/types';
import { colors } from '../theme/tokens';

type Props = {
  /** Receives every message posted by the page (ready / stepChanged / submitted / …). */
  onEvent?: (msg: BridgeMessage) => void;
};

type Pending = { resolve: (payload: Record<string, unknown>) => void; timer: ReturnType<typeof setTimeout> };

// Minimal fallback so the stage is never blank if the asset fails to read.
const FALLBACK_HTML =
  '<html><body style="font-family:sans-serif;padding:40px;font-size:22px">Loading GOV.UK…</body></html>';

export const MockBrowser = forwardRef<BrowserHandle, Props>(function MockBrowser({ onEvent }, ref) {
  const webRef = useRef<WebView>(null);
  const pending = useRef<Map<string, Pending>>(new Map());
  const [html, setHtml] = useState<string | null>(null);

  // Load the bundled mock-site.html into a string (no network dependency).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/mock-site.html'));
        await asset.downloadAsync();
        const content = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
        if (!cancelled) setHtml(content);
      } catch (err) {
        console.warn('[MockBrowser] failed to load mock-site.html', err);
        if (!cancelled) setHtml(FALLBACK_HTML);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const inject = useCallback((js: string) => {
    webRef.current?.injectJavaScript(js);
  }, []);

  const request = useCallback(
    (id: string, js: string, timeoutMs = 6000) =>
      new Promise<Record<string, unknown>>((resolve) => {
        const timer = setTimeout(() => {
          pending.current.delete(id);
          resolve({ id, ok: false, timedOut: true });
        }, timeoutMs);
        pending.current.set(id, { resolve, timer });
        webRef.current?.injectJavaScript(js);
      }),
    []
  );

  useImperativeHandle(ref, () => ({ inject, request }), [inject, request]);

  const handleMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: BridgeMessage | null = null;
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      if (!msg || msg.source !== 'samwise-mock') return;

      // Resolve a correlated request if this carries a matching id.
      const id = (msg.payload as { id?: string } | undefined)?.id;
      if (id && pending.current.has(id)) {
        const p = pending.current.get(id)!;
        clearTimeout(p.timer);
        pending.current.delete(id);
        p.resolve(msg.payload);
      }

      onEvent?.(msg);
    },
    [onEvent]
  );

  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      source={{ html, baseUrl: 'https://www.gov.uk/' }}
      originWhitelist={['*']}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      // Keep the page from being zoomed/offset so highlights land where we expect.
      scalesPageToFit
      automaticallyAdjustContentInsets={false}
      style={styles.web}
      // We never want the page itself to look "broken" on a slow first paint.
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
    />
  );
});

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: colors.surface },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
// chore: note 2026-06-20T15:19:43
