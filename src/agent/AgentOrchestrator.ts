import * as Haptics from 'expo-haptics';
import { store } from '../state/store';
import { samwisePlan, questionFor } from './samwisePlan';
import type { AgentStep } from './types';
import type { BrowserHandle } from './browserActions';
import { click, fillSection, highlight, showStep } from './browserActions';

/** Voice bridge injected by the useVoice hook (built last; optional). */
export type VoiceBridge = {
  speak: (text: string) => Promise<void>;
  stop?: () => void;
  /** Pre-generate/cache audio for these lines during PLANNING. */
  prepare?: (lines: string[]) => Promise<void>;
};

/** LLM bridge injected by llm.ts (optional; falls back to the static plan). */
export type Planner = (plan: AgentStep[]) => Promise<AgentStep[]>;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function haptic(kind: 'light' | 'success' = 'light') {
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // haptics are best-effort; never block the machine
  }
}

/**
 * The agent. A deterministic state machine that *feels* like reasoning:
 * it plans visibly, narrates every step, drives a real WebView, and pauses to
 * converse. One singleton instance, wired up in App.
 */
class AgentOrchestrator {
  private browser: BrowserHandle | null = null;
  private voice: VoiceBridge = { speak: async () => {} };
  private planner: Planner | null = null;

  private running = false;
  /** Resolver for the current AWAITING_USER pause. */
  private answerResolver: ((value: string) => void) | null = null;
  /** Resolvers for in-flight interruptible delays (for the secret skip). */
  private delayResolvers = new Set<() => void>();

  // ---- wiring (called from App) ----

  attachBrowser(handle: BrowserHandle) {
    this.browser = handle;
  }

  attachVoice(voice: VoiceBridge) {
    this.voice = voice;
  }

  attachPlanner(planner: Planner) {
    this.planner = planner;
  }

  // ---- public control ----

  /** Kick off the golden path from the user's free-text/voice intent. */
  async startTask(_intentText: string) {
    if (this.running) return;
    this.running = true;
    const st = store.getState();

    st.reset();
    st.setIslandExpanded(true);

    // LISTENING — acknowledge we heard them.
    st.setAgentState('LISTENING');
    st.setStatus('Listening…');
    st.setNarration('Okay — let me help you with that.');
    await this.delay(450);

    // PLANNING — resolve the plan (LLM may rewrite narration), reveal checklist.
    st.setAgentState('PLANNING');
    st.setThinking(true);
    st.setStatus('Working out the steps…');
    st.setNarration('Let me work out the steps for claiming your Pension Credit.');

    let plan = samwisePlan;
    if (this.planner) {
      try {
        plan = await this.planner(samwisePlan);
      } catch (err) {
        console.warn('[orchestrator] planner failed, using static plan', err);
        plan = samwisePlan;
      }
    }
    st.setPlan(plan);

    // Pre-cache narration audio (best-effort; never blocks).
    if (this.voice.prepare) {
      this.voice.prepare(plan.map((s) => s.narration)).catch(() => {});
    }

    // Let the checklist visibly materialise.
    await this.delay(900);
    st.setThinking(false);

    await this.run(plan);
  }

  /** Called by the UI when the user taps a big answer button. */
  provideUserAnswer(value: string) {
    if (this.answerResolver) {
      const resolve = this.answerResolver;
      this.answerResolver = null;
      resolve(value);
    }
  }

  /** Secret long-press on the island: unstick a pause / advance. */
  skip() {
    // Resolve a pending question with its happy-path (first) option.
    if (this.answerResolver) {
      const q = store.getState().pendingQuestion;
      const resolve = this.answerResolver;
      this.answerResolver = null;
      resolve(q?.options?.[0] ?? 'Yes');
      return;
    }
    // Otherwise fast-forward any active delay.
    this.delayResolvers.forEach((r) => r());
    this.delayResolvers.clear();
  }

  // ---- the run loop ----

  private async run(plan: AgentStep[]) {
    try {
      for (let i = 0; i < plan.length; i++) {
        const step = plan[i];
        const st = store.getState();
        st.setCurrentStep(i);
        st.setChecklistStatus(step.id, 'active');
        st.setAgentState('EXECUTING_STEP');
        st.setStatus(step.title);
        st.setNarration(step.narration);
        // Get out of the way while driving the browser; pop open to ask the
        // user. The collapsed pill still shows live status, and the user can
        // re-expand it manually at any time.
        st.setIslandExpanded(step.kind === 'askUser');
        haptic('light');

        const keepGoing = await this.execute(step);

        st.setChecklistStatus(step.id, 'done');
        if (!keepGoing) {
          // graceful stop (e.g. user declined to start the claim)
          this.running = false;
          return;
        }
        await this.delay(step.kind === 'fillForm' ? 200 : 300);
      }

      // Done — bring the full island back for the celebration / summary.
      store.getState().setAgentState('DONE');
      store.getState().setStatus('All done');
      store.getState().setIslandExpanded(true);
      haptic('success');
    } finally {
      this.running = false;
    }
  }

  /** Run one step's action. Returns false to stop the machine gracefully. */
  private async execute(step: AgentStep): Promise<boolean> {
    const st = store.getState();

    // Narration is already on screen (set in run()). For most steps we let it be
    // spoken fully before acting; for the long form-fill we fire it and let it
    // play *over* the typing so the agent talks while it works.
    if (step.kind === 'fillForm') {
      void this.narrate(step.narration);
    } else {
      await this.narrate(step.narration);
    }

    switch (step.kind) {
      case 'say':
        await this.delay(step.durationMs ?? 800);
        return true;

      case 'askUser': {
        const q = questionFor(step);
        if (!q) return true;
        st.setAgentState('AWAITING_USER');
        st.setStatus('Waiting for your answer…');
        st.setPendingQuestion({ stepId: step.id, question: q.question, options: q.options });
        const answer = await this.waitForAnswer();
        st.setPendingQuestion(null);
        st.recordAnswer(step.id, answer);
        st.setAgentState('EXECUTING_STEP');
        // The gate can stop the run gracefully if the user declines.
        if (step.id === 'gate' && answer === q.options[1]) {
          const line = "That's completely fine. We can do this whenever you're ready.";
          st.setNarration(line);
          await this.narrate(line);
          st.setStatus('Paused');
          return false;
        }
        return true;
      }

      case 'research': {
        this.showBrowser(step.url);
        if (!this.browser) {
          await this.delay(step.durationMs ?? 1500);
          return true;
        }
        // The page has had several seconds to load by now; make sure.
        await this.ensureWebReady();
        await showStep(this.browser, 'step-eligibility');
        await this.delay(350);
        for (const sel of step.highlights ?? []) {
          st.setStatus('Reading the rules…');
          await highlight(this.browser, sel);
          await this.delay(650);
        }
        return true;
      }

      case 'navigate': {
        this.showBrowser(step.url);
        if (this.browser && step.clickSelector) {
          await click(this.browser, step.clickSelector);
          await this.delay(step.durationMs ?? 800);
        } else {
          await this.delay(step.durationMs ?? 800);
        }
        return true;
      }

      case 'fillForm': {
        this.showBrowser(step.url);
        const sections = step.formSections ?? (step.formSection ? [step.formSection] : []);
        if (!this.browser || sections.length === 0) {
          await this.delay(step.durationMs ?? 1000);
          return true;
        }
        await this.ensureWebReady();
        // Enter the form (e.g. click "Start now") if this step opens it.
        if (step.clickSelector) {
          await click(this.browser, step.clickSelector);
          await this.delay(350);
        }
        const totalSections = sections.length;
        for (let s = 0; s < totalSections; s++) {
          const section = sections[s];
          store.getState().setFormProgress(
            `Section ${s + 1} of ${totalSections} — ${section.title}`
          );
          await fillSection(this.browser, section, {
            delayMs: 28,
            betweenFieldsMs: 150,
            onField: (label) => store.getState().setStatus(`Entering ${label}…`),
          });
        }
        store.getState().setFormProgress('');
        return true;
      }

      case 'review': {
        st.setAgentState('REVIEW');
        if (this.browser) {
          await showStep(this.browser, 'step-review');
        }
        await this.delay(step.durationMs ?? 2400);
        return true;
      }

      case 'submit': {
        if (this.browser && step.clickSelector) {
          await click(this.browser, step.clickSelector);
        }
        await this.delay(step.durationMs ?? 1200);
        return true;
      }

      default:
        await this.delay(step.durationMs ?? 600);
        return true;
    }
  }

  // ---- helpers ----

  private showBrowser(url?: string) {
    const st = store.getState();
    if (url) st.setBrowserUrl(url);
    if (!st.browserVisible) st.setBrowserVisible(true);
  }

  /** Wait (briefly) for the WebView bridge to report ready. */
  private async ensureWebReady(timeoutMs = 4000): Promise<void> {
    const start = Date.now();
    while (!store.getState().webReady && Date.now() - start < timeoutMs) {
      await this.delay(150);
    }
  }

  /** Speak a line, capped so TTS latency never stalls the demo. */
  private async narrate(text: string) {
    const cap = wait(4000);
    try {
      await Promise.race([this.voice.speak(text), cap]);
    } catch {
      // text is already on screen; speech is a bonus
    }
  }

  /** Interruptible delay — the secret skip can fast-forward it. */
  private delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.delayResolvers.delete(done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      this.delayResolvers.add(done);
    });
  }

  private waitForAnswer(): Promise<string> {
    return new Promise<string>((resolve) => {
      this.answerResolver = resolve;
    });
  }
}

export const orchestrator = new AgentOrchestrator();
