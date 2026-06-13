# Samwise

A personal accessibility AI agent that lives as a floating "island" overlay and
**orchestrates long-horizon, multi-step tasks** for people who struggle with
app/website UX. You say what you want in plain language ("help me claim my
pension") and the agent plans and executes a multi-step workflow — driving a
**real in-app browser**, narrating every step aloud, and asking you when it
needs input.

This is a **hackathon demo**. The golden path: an older user claims UK **Pension
Credit** — the agent reads the eligibility rules, asks 1–2 questions, then
**visibly drives a 5-section form** field-by-field and submits it.

The interface uses the **Samwise design system** — a calm liquid-glass look over
a warm aurora, built accessibility-first (large type, high contrast, big touch
targets). While the agent works, the screen splits **70% "what's happening" /
30% "agent logs"** (see [The interface](#the-interface--samwise-design-system)).

## Run it

```bash
npm install
cp .env.example .env     # optional — add API keys (see below); works without them
npm start                # = expo start (also syncs the mock site into assets/)
```

Then press `i` (iOS simulator), `a` (Android), or scan the QR with **Expo Go**.
It runs fully in **Expo Go** — no development build or native modules required.

The full demo runs with **no API keys** — narration shows as large text and the
agent drives the browser deterministically. Keys add polish:

- `EXPO_PUBLIC_OPENAI_API_KEY` — rewrites narration into warmer plain English
  during `PLANNING` (cached, never blocks the live run).
- `EXPO_PUBLIC_ELEVENLABS_API_KEY` — voice narration (TTS) + mic input (STT),
  pre-cached during `PLANNING`. Degrades to on-device `expo-speech`, then text.

## The interface — Samwise design system

The UI is a reusable design system layered cleanly over the agent: all view
state flows through `src/state/store.ts` (the orchestrator is the only writer),
and the components are purely presentational — so you can re-skin without
touching any logic.

- **`src/theme/tokens.ts`** — the single source of truth: palette, type ramp
  (**Lexend** for display, **Inter** for body), spacing, radii, `gradients`,
  `glass`, shadows. Change values here to re-skin the whole app.
- **`src/ui/`** — the component kit: `Glass` (frosted card via `expo-blur`),
  `ScreenBackground` (aurora gradient + soft blobs), `VoiceOrb` (the living agent
  orb), `AppText`, `Icon` (`@expo/vector-icons`), `GradientButton`, `Waveform`,
  and `AgentLogFeed`.
- **The 70/30 work layout (`App.tsx`)** — while the agent works, the screen is split:
  - **70% — the stage** (`src/components/BrowserStage.tsx`): the real WebView the
    agent drives — *what's actually happening*.
  - **30% — the agent log** (`src/components/AgentLogPanel.tsx` → `AgentLogFeed`):
    a live, scrolling feed of everything the agent is doing, fed by the store's
    append-only `log` (appended inside `setStatus` / `setNarration` /
    `setFormProgress` — see `src/state/store.ts`).
  - The **Island** (`src/components/Island.tsx`) floats on top as the glass voice
    control (drag, tap to expand, long-press to advance), with the `VoiceOrb` as
    the agent's face.

Added UI dependencies — `expo-blur`, `expo-linear-gradient`,
`react-native-safe-area-context`, `@expo/vector-icons`,
`@expo-google-fonts/{lexend,inter}` — are all Expo Go-compatible.

## How it works

```
IDLE → LISTENING → PLANNING → EXECUTING_STEP ⇄ AWAITING_USER → REVIEW → DONE
```

- **`src/agent/samwisePlan.ts`** — the data-driven `AgentStep[]` (the editable
  "horizon"). Form values are baked in from `src/data/userProfile.json` so the
  live run is deterministic.
- **`src/agent/AgentOrchestrator.ts`** — the state machine. Walks the plan,
  narrates, drives the browser, ticks the checklist, pauses for the user.
- **`src/state/store.ts`** — the zustand store the UI renders (incl. the new
  append-only `log` feed). The orchestrator is the only writer.
- **`src/components/MockBrowser.tsx`** — a real `react-native-webview` that loads
  the bundled mock GOV.UK page (`assets/mock-site.html`, single source:
  `mock-site/index.html`). No network dependency.
- **`src/agent/browserActions.ts`** — typed automation primitives (`typeInto`,
  `click`, `highlight`, `fillSection`, …) that drive the page's
  `window.SAMWISE` bridge via injected JS with request/response correlation.
- **`src/agent/llm.ts`** — OpenAI layer (intent parse, page summarise, narration
  rewrite), resolved once during `PLANNING`, always with a deterministic fallback.
- **`src/voice/useVoice.ts`** — ElevenLabs TTS/STT via `expo-audio`, isolated and
  gracefully degrading.

### Live demo controls

- **Tap the island** → expand. Type or tap the mic, or tap the suggestion.
- **Drag the island** anywhere (it floats over the browser).
- **Long-press the island** = secret "advance/unstick" gesture for stage recovery
  (resolves a pending question with its happy-path answer, or fast-forwards a pause).

## The mock site

`mock-site/index.html` is the single source of truth. `npm start` copies it to
`assets/mock-site.html`, which Metro bundles (see `metro.config.js`). The page
exposes a stable automation contract documented at the top of the file — never
rename its element ids without updating `samwisePlan.ts` / `browserActions.ts`.
