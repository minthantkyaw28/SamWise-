import { create } from 'zustand';
import type {
  AgentState,
  AgentStep,
  ChecklistItem,
  ChecklistStatus,
  PendingQuestion,
} from '../agent/types';

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
  setNarration: (text) => set({ narration: text }),
  setStatus: (line) => set({ statusLine: line }),
  setThinking: (v) => set({ thinking: v }),
  setIslandExpanded: (v) => set({ islandExpanded: v }),
  setUserInput: (v) => set({ userInput: v }),
  setPendingQuestion: (q) => set({ pendingQuestion: q }),
  recordAnswer: (stepId, value) =>
    set((state) => ({ collectedAnswers: { ...state.collectedAnswers, [stepId]: value } })),
  setBrowserVisible: (v) => set({ browserVisible: v }),
  setBrowserUrl: (url) => set({ browserUrl: url }),
  setWebReady: (v) => set({ webReady: v }),
  setFormProgress: (label) => set({ formProgressLabel: label }),
  setSpeaking: (v) => set({ speaking: v }),
  setListening: (v) => set({ listening: v }),
  setVoiceEnabled: (v) => set({ voiceEnabled: v }),
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
// chore: note 2026-07-19T20:26:57
