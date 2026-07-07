import { useEffect, useRef } from 'react';
import {
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  RecordingPresets,
  type AudioPlayer,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import { orchestrator, type VoiceBridge } from '../agent/AgentOrchestrator';
import { useStore } from '../state/store';

/**
 * Voice layer (built last, kept isolated). ElevenLabs for TTS + STT, played
 * through expo-audio. Pre-caches every narration line during PLANNING for
 * instant, WiFi-independent playback. Degrades gracefully:
 *   ElevenLabs  ->  on-device expo-speech  ->  silent (text stays on screen).
 */

const EL_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const TTS_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;
const STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

function hasElevenLabs(): boolean {
  return !!EL_KEY && EL_KEY.length > 20;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? B64[b2 & 63] : '=';
  }
  return out;
}

/** The singleton voice bridge. The orchestrator + Island talk to this. */
export const voice: VoiceBridge & {
  enabled: boolean;
  listen: () => Promise<string | null>;
} = {
  enabled: false,
  speak: async () => {},
  stop: () => {},
  prepare: async () => {},
  listen: async () => null,
};

/** Play a local audio file and resolve when it finishes (with a safety cap). */
function playUri(
  uri: string,
  capMs: number,
  onStart?: (stop: () => void) => void
): Promise<void> {
  return new Promise<void>((resolve) => {
    let player: AudioPlayer | null = null;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        sub?.remove();
      } catch {
        /* ignore */
      }
      try {
        player?.remove();
      } catch {
        /* ignore */
      }
      resolve();
    };
    let sub: { remove: () => void } | undefined;
    try {
      player = createAudioPlayer(uri);
      sub = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) finish();
      });
      player.play();
      // Expose a stopper so the next narration can cut this one off cleanly.
      onStart?.(finish);
    } catch {
      return finish();
    }
    setTimeout(finish, capMs);
  });
}

export function useVoice() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;
  // text -> cached local file uri
  const cache = useRef<Map<string, string>>(new Map());
  const counter = useRef(0);
  // stopper for the currently-playing narration clip (so a new line cuts it off)
  const stopCurrent = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});

    async function synthToFile(text: string): Promise<string | null> {
      if (!hasElevenLabs()) return null;
      try {
        const res = await fetch(TTS_URL, {
          method: 'POST',
          headers: {
            'xi-api-key': EL_KEY as string,
            'Content-Type': 'application/json',
            accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: { stability: 0.45, similarity_boost: 0.8 },
          }),
        });
        if (!res.ok) {
          console.warn('[voice] ElevenLabs TTS', res.status);
          return null;
        }
        const buf = await res.arrayBuffer();
        const base64 = arrayBufferToBase64(buf);
        const uri = `${FileSystem.cacheDirectory}samwise-tts-${counter.current++}.mp3`;
        await FileSystem.writeAsStringAsync(uri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return uri;
      } catch (err) {
        console.warn('[voice] synth failed', err);
        return null;
      }
    }

    async function speakViaDevice(text: string): Promise<void> {
      return new Promise<void>((resolve) => {
        try {
          Speech.speak(text, {
            rate: 0.95,
            pitch: 1.0,
            onDone: () => resolve(),
            onStopped: () => resolve(),
            onError: () => resolve(),
          });
          // Safety cap in case no callback fires.
          setTimeout(resolve, Math.min(12000, 1800 + text.length * 65));
        } catch {
          resolve();
        }
      });
    }

    async function speak(text: string): Promise<void> {
      if (!text) return;
      const st = useStore.getState();
      // Cut off any narration still playing from the previous step.
      try {
        stopCurrent.current?.();
      } catch {
        /* ignore */
      }
      stopCurrent.current = null;
      try {
        Speech.stop();
      } catch {
        /* ignore */
      }
      st.setSpeaking(true);
      try {
        let uri = cache.current.get(text);
        if (!uri && hasElevenLabs()) {
          const made = await synthToFile(text);
          if (made) {
            cache.current.set(text, made);
            uri = made;
          }
        }
        if (uri) {
          await playUri(uri, Math.min(20000, 2500 + text.length * 90), (stop) => {
            stopCurrent.current = stop;
          });
        } else {
          await speakViaDevice(text);
        }
      } catch (err) {
        console.warn('[voice] speak failed', err);
      } finally {
        useStore.getState().setSpeaking(false);
      }
    }

    async function prepare(lines: string[]): Promise<void> {
      if (!hasElevenLabs()) return;
      // Generate sequentially to be gentle on rate limits; ignore failures.
      for (const line of lines) {
        if (!mounted) return;
        if (cache.current.has(line)) continue;
        const uri = await synthToFile(line);
        if (uri) cache.current.set(line, uri);
      }
    }

    async function transcribe(uri: string): Promise<string | null> {
      if (!hasElevenLabs()) return null;
      try {
        const form = new FormData();
        form.append('model_id', 'scribe_v1');
        form.append('file', { uri, name: 'speech.m4a', type: 'audio/m4a' } as never);
        const res = await fetch(STT_URL, {
          method: 'POST',
          headers: { 'xi-api-key': EL_KEY as string },
          body: form,
        });
        if (!res.ok) {
          console.warn('[voice] ElevenLabs STT', res.status);
          return null;
        }
        const data = await res.json();
        return typeof data?.text === 'string' ? data.text : null;
      } catch (err) {
        console.warn('[voice] transcribe failed', err);
        return null;
      }
    }

    async function listen(): Promise<string | null> {
      if (!hasElevenLabs()) return null;
      const st = useStore.getState();
      try {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) return null;
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        st.setListening(true);
        await recorderRef.current.prepareToRecordAsync();
        recorderRef.current.record();
        await sleep(3800);
        await recorderRef.current.stop();
        const uri = recorderRef.current.uri;
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        st.setListening(false);
        if (!uri) return null;
        return await transcribe(uri);
      } catch (err) {
        console.warn('[voice] listen failed', err);
        useStore.getState().setListening(false);
        return null;
      }
    }

    function stop() {
      try {
        Speech.stop();
      } catch {
        /* ignore */
      }
    }

    // Populate the singleton + wire into the orchestrator.
    voice.enabled = hasElevenLabs();
    voice.speak = speak;
    voice.prepare = prepare;
    voice.listen = listen;
    voice.stop = stop;
    orchestrator.attachVoice(voice);
    useStore.getState().setVoiceEnabled(hasElevenLabs());

    return () => {
      mounted = false;
      stop();
    };
  }, []);
}
// chore: note 2026-07-07T12:07:15
