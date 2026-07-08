# Samwise — working notes for Claude Code

**What it is:** an Expo (React Native, SDK 56) hackathon demo of a floating
accessibility AI agent that drives a real in-app WebView to complete a UK
Pension Credit claim, narrating each step. Optimise for a **flawless live demo**
over production-readiness. Don't over-engineer; no backend services.

## Hard constraints
- **No real cross-app/OS automation, no real gov.uk.** The agent drives *our*
  bundled mock page (`assets/mock-site.html`) inside a `react-native-webview`.
  The automation is genuine; the target is ours.
- **One golden path that must never fail on stage.** Form data is deterministic
  from `src/data/userProfile.json`. OpenAI/ElevenLabs are enhancements that are
  resolved/cached during `PLANNING` and **must degrade gracefully** (network can
  fail at the venue). Never block the state machine on a network call.
- Secrets only via `.env` (`EXPO_PUBLIC_*`). Never hardcode.

## Architecture (see README for the file map)
- State machine: `IDLE→LISTENING→PLANNING→EXECUTING_STEP⇄AWAITING_USER→REVIEW→DONE`
  in `src/agent/AgentOrchestrator.ts` (singleton `orchestrator`).
- The plan is data-driven: `src/agent/samwisePlan.ts` (`AgentStep[]`).
- Render state in Zustand: `src/state/store.ts`. Orchestrator mutates it.
- Browser automation: `src/agent/browserActions.ts` ↔ the page's
  `window.SAMWISE` bridge (injected JS, ack/text messages correlated by id in
  `MockBrowser`).
- Voice is built last and isolated: `src/voice/useVoice.ts` (singleton `voice`).

## Conventions
- Accessibility-first: large fonts, high contrast, slow motion — see
  `src/theme/tokens.ts`. Use the tokens, don't hardcode sizes/colours.
- The mock page's element ids are an **automation contract** (documented at the
  top of `mock-site/index.html`). `mock-site/index.html` is the single source;
  `npm start` copies it to `assets/`. If you change ids, update `samwisePlan.ts`.
- Long-press on the island = secret demo-advance (`orchestrator.skip()`).

## Verify
- `npm run typecheck` (tsc) and `npx expo export --platform ios` both pass.
- `babel-preset-expo` is a direct devDependency (Metro needs it hoisted).
  `react-native-worklets/plugin` is the Reanimated-4 babel plugin (in
  `babel.config.js`, must be last). `.html` is added to `assetExts` in
  `metro.config.js`.
