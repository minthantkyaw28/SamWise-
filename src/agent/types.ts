/**
 * Core agent type definitions. The whole "horizon" is data-driven from these
 * types — see samwisePlan.ts for the authored Pension Credit plan.
 */

/** The orchestrator's state machine. */
export type AgentState =
  | 'IDLE'
  | 'LISTENING'
  | 'PLANNING'
  | 'EXECUTING_STEP'
  | 'AWAITING_USER'
  | 'REVIEW'
  | 'DONE';

export type StepKind =
  | 'say' // narrate only
  | 'research' // open WebView, scroll/highlight/read eligibility page
  | 'askUser' // pause and ask a question with big buttons
  | 'navigate' // drive the WebView to another page/step
  | 'fillForm' // drive a form section field-by-field
  | 'review' // read back the summary page
  | 'submit'; // click submit -> confirmation

/** One field the agent will drive inside the WebView form. */
export type FormField = {
  /** Human label used in narration / status ("your date of birth"). */
  label: string;
  /** 'text' types character-by-character; 'radio' checks a radio option. */
  kind: 'text' | 'radio';
  /** CSS selector for text inputs. */
  selector?: string;
  /** Value to type (text fields). */
  value?: string;
  /** Element id to check (radio fields). */
  radioId?: string;
};

/** A page/section of the form the agent fills in one EXECUTING_STEP. */
export type FormSection = {
  /** The page section id on the mock site (e.g. 'step-personal'). */
  id: string;
  title: string;
  fields: FormField[];
  /** Selector of the button that advances to the next section. */
  nextSelector: string;
};

/** One node in the agent's plan. */
export type AgentStep = {
  id: string;
  /** Short label shown in the plan checklist. */
  title: string;
  /** Spoken + shown as large text. May be rewritten by the LLM during PLANNING. */
  narration: string;
  kind: StepKind;
  /** Pacing for non-interactive steps. */
  durationMs?: number;
  /** Pause the machine until the user answers. */
  awaitUser?: boolean;
  /** The question text shown above the big buttons on askUser steps. */
  question?: string;
  /** Big-button options for askUser steps. */
  options?: string[];
  /** Display URL shown in the fake browser chrome for research/navigate steps. */
  url?: string;
  /** Selectors to highlight + read on research steps. */
  highlights?: string[];
  /** Selector to click for navigate steps. */
  clickSelector?: string;
  /** Section to fill for fillForm steps. */
  formSection?: FormSection;
  /** Multiple sections filled in one step (keeps the checklist short). */
  formSections?: FormSection[];
};

export type ChecklistStatus = 'pending' | 'active' | 'done';

export type ChecklistItem = {
  id: string;
  title: string;
  status: ChecklistStatus;
};

/** A question surfaced to the UI while AWAITING_USER. */
export type PendingQuestion = {
  stepId: string;
  question: string;
  options: string[];
};

/** Messages posted from the mock page back into React Native. */
export type BridgeMessage = {
  source: 'samwise-mock';
  type: 'ready' | 'stepChanged' | 'submitted' | 'error' | 'ack' | 'text';
  payload: Record<string, unknown>;
};
// chore: note 2026-07-02T15:37:16
