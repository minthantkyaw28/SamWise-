import { create } from 'zustand';
import type {
  AgentState,
  AgentStep,
  ChecklistItem,
  ChecklistStatus,
  PendingQuestion,
} from '../agent/types';

/** A single line in the live agent-activity log (the 30% panel). */
export type LogEntry = { id: number; text: string; kind: 'status' | 'narration' | 'progress' };

let _logSeq = 0;
const LOG_CAP = 80;
function appendLog(log: LogEntry[], text: string, kind: LogEntry['kind']): LogEntry[] {
  const t = (text ?? '').trim();
  if (!t) return log;
  const last = log[log.length - 1];
  if (last && last.text === t) return log; // dedupe consecutive duplicates
  const next = log.concat({ id: ++_logSeq, text: t, kind });
  return next.length > LOG_CAP ? next.slice(next.length - LOG_CAP) : next;
}

type SamwiseState = {
  // --- machine ---
  agentState: AgentState;
  plan: AgentStep[];
  checklist: ChecklistItem[];
  currentStepIndex: number;

  // --- what the user sees the agent doing ---
  /** The big narration text currently on screen (mirrors what's spoken). */
  narration: string;
  /** Terse "what I'm doing right now" line. */
  statusLine: string;
  /** True while the agent is "thinking" (planning / between actions). */
  thinking: boolean;
  /** Append-only feed of what the agent has been doing — the 30% log panel. */
  log: LogEntry[];

  // --- island / conversation ---
  islandExpanded: boolean;
  userInput: string;
  pendingQuestion: PendingQuestion | null;
  collectedAnswers: Record<string, string>;

  // --- browser stage ---
  browserVisible: boolean;
  browserUrl: string;
  webReady: boolean;
  formProgressLabel: string; // e.g. "Filling section 2 of 5 — Income"

  // --- voice ---
  speaking: boolean;
  listening: boolean;
  voiceEnabled: boolean;

  // --- actions (plain setters; logic lives in the orchestrator) ---
  setAgentState: (s: AgentState) => void;
  setPlan: (plan: AgentStep[]) => void;
  setChecklistStatus: (id: string, status: ChecklistStatus) => void;
  setCurrentStep: (index: number) => void;
  setNarration: (text: string) => void;
  setStatus: (line: string) => void;
  setThinking: (v: boolean) => void;
  setIslandExpanded: (v: boolean) => void;
  setUserInput: (v: string) => void;
  setPendingQuestion: (q: PendingQuestion | null) => void;
  recordAnswer: (stepId: string, value: string) => void;
  setBrowserVisible: (v: boolean) => void;
  setBrowserUrl: (url: string) => void;
  setWebReady: (v: boolean) => void;
  setFormProgress: (label: string) => void;
  setSpeaking: (v: boolean) => void;
  setListening: (v: boolean) => void;
  setVoiceEnabled: (v: boolean) => void;
  clearLog: () => void;
  reset: () => void;
};

const initialState = {
  agentState: 'IDLE' as AgentState,
  plan: [] as AgentStep[],
  checklist: [] as ChecklistItem[],
  currentStepIndex: -1,
  narration: '',
  statusLine: '',
  thinking: false,
  log: [] as LogEntry[],
  islandExpanded: false,
  userInput: '',
  pendingQuestion: null as PendingQuestion | null,
  collectedAnswers: {} as Record<string, string>,
  browserVisible: false,
  browserUrl: '',
  webReady: false,
  formProgressLabel: '',
  speaking: false,
  listening: false,
  voiceEnabled: false,
};

export const useStore = create<SamwiseState>((set) => ({
  ...initialState,

  setAgentState: (s) => set({ agentState: s }),
  setPlan: (plan) =>
    set({
      plan,
      checklist: plan.map((step) => ({
        id: step.id,
        title: step.title,
        status: 'pending' as ChecklistStatus,
      })),
    }),
  setChecklistStatus: (id, status) =>
    set((state) => ({
      checklist: state.checklist.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    })),
  setCurrentStep: (index) => set({ currentStepIndex: index }),
  setNarration: (text) =>
    set((state) => ({ narration: text, log: appendLog(state.log, text, 'narration') })),
  setStatus: (line) =>
    set((state) => ({ statusLine: line, log: appendLog(state.log, line, 'status') })),
  setThinking: (v) => set({ thinking: v }),
  setIslandExpanded: (v) => set({ islandExpanded: v }),
  setUserInput: (v) => set({ userInput: v }),
  setPendingQuestion: (q) => set({ pendingQuestion: q }),
  recordAnswer: (stepId, value) =>
    set((state) => ({ collectedAnswers: { ...state.collectedAnswers, [stepId]: value } })),
  setBrowserVisible: (v) => set({ browserVisible: v }),
  setBrowserUrl: (url) => set({ browserUrl: url }),
  setWebReady: (v) => set({ webReady: v }),
  setFormProgress: (label) =>
    set((state) => ({ formProgressLabel: label, log: appendLog(state.log, label, 'progress') })),
  setSpeaking: (v) => set({ speaking: v }),
  setListening: (v) => set({ listening: v }),
  setVoiceEnabled: (v) => set({ voiceEnabled: v }),
  clearLog: () => set({ log: [] }),
  reset: () =>
    set((state) => ({
      ...initialState,
      // keep the loaded plan available but reset its checklist
      plan: state.plan,
      checklist: state.plan.map((step) => ({
        id: step.id,
        title: step.title,
        status: 'pending' as ChecklistStatus,
      })),
      voiceEnabled: state.voiceEnabled,
      webReady: state.webReady,
    })),
}));

/** Non-React access for the orchestrator. */
export const store = useStore;
