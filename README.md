# Samwise

A personal accessibility AI agent that lives as a floating "island" overlay and
**orchestrates long-horizon, harness-enabled multi-step tasks** for people who
struggle with the maze of app/website menus, settings and UX. You say what you
want to achieve in plain language ("help me claim my pension") and the agent
plans and executes a multi-step workflow — driving a **real browser or any
app**, narrating every step aloud based on true grounding, and asking you when
it needs input.

This is a **hackathon demo**. The golden path: an older user claims UK **Pension
Credit** — the agent reads the eligibility rules and process from His Majesty's
Department for Work and Pensions (DWP), asks questions, then **visibly drives a
section form field-by-field** and submits it.

## Run it

```bash
npm install
cp .env.example .env     # optional — add API keys (see below); works without them
npm start                # = expo start (also syncs the mock site into assets/)
```

Then press `i` (iOS simulator), `a` (Android), or scan the QR with Expo Go.

The full demo runs with **no API keys** — narration shows as large text and the
agent drives the browser deterministically. Keys add polish:

- `EXPO_PUBLIC_OPENAI_API_KEY` — rewrites narration into warmer plain English
  during `PLANNING` (cached, never blocks the live run).
- `EXPO_PUBLIC_ELEVENLABS_API_KEY` — voice narration (TTS) + mic input (STT),
  pre-cached during `PLANNING`. Degrades to on-device `expo-speech`, then text.

## How it works

```
IDLE → LISTENING → PLANNING → EXECUTING_STEP ⇄ AWAITING_USER → REVIEW → DONE
```

- **`src/agent/samwisePlan.ts`** — the data-driven `AgentStep[]` (the editable
  "horizon"). Form values are baked in from `src/data/userProfile.json` so the
  live run is deterministic.
- **`src/agent/AgentOrchestrator.ts`** — the state machine. Walks the plan,
  narrates, drives the browser, ticks the checklist, pauses for the user.
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
```
