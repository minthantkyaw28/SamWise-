import type { AgentStep } from './types';
import type { Planner } from './AgentOrchestrator';

/**
 * OpenAI layer. Used ONCE during PLANNING and cached into the plan, so the live
 * EXECUTING run never waits on the network. Every call has a timeout and a
 * deterministic fallback — if OpenAI is unreachable, the static plan is used
 * unchanged and the demo is unaffected.
 */

const KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export function hasOpenAI(): boolean {
  return !!KEY && KEY.length > 20;
}

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

async function chat(messages: Msg[], timeoutMs = 6000): Promise<string | null> {
  if (!hasOpenAI()) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn('[llm] OpenAI responded', res.status);
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn('[llm] OpenAI call failed', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * (a) Map the user's free-text/voice intent to a known plan. We ship one plan,
 * so this is mostly a confidence gate; it never blocks the demo.
 */
export async function parseIntent(text: string): Promise<'pension-credit' | 'unknown'> {
  if (!hasOpenAI()) return 'pension-credit';
  const content = await chat(
    [
      {
        role: 'system',
        content:
          'Classify the user request. Return JSON {"intent":"pension-credit"} if it is about claiming a pension, pension credit, or a benefit/government form. Otherwise {"intent":"unknown"}.',
      },
      { role: 'user', content: text },
    ],
    4000
  );
  try {
    const parsed = content ? JSON.parse(content) : null;
    return parsed?.intent === 'unknown' ? 'unknown' : 'pension-credit';
  } catch {
    return 'pension-credit';
  }
}

/**
 * (b) Summarise raw page text into one plain, large-font narration line.
 * Falls back to the provided default if OpenAI is unavailable.
 */
export async function summarisePage(pageText: string, fallback: string): Promise<string> {
  if (!hasOpenAI()) return fallback;
  const content = await chat(
    [
      {
        role: 'system',
        content:
          'You explain government text to an older person in warm, plain English. Summarise the page in one or two short sentences they could act on. Preserve any figures. Return JSON {"summary": string}.',
      },
      { role: 'user', content: pageText.slice(0, 4000) },
    ],
    6000
  );
  try {
    const parsed = content ? JSON.parse(content) : null;
    return typeof parsed?.summary === 'string' && parsed.summary.trim() ? parsed.summary : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Rewrite all narration lines into warmer, plainer language in one batched call.
 * Returns the originals on any failure or length mismatch.
 */
async function rewriteNarrations(lines: string[]): Promise<string[]> {
  const content = await chat(
    [
      {
        role: 'system',
        content:
          'You rewrite narration spoken aloud by an accessibility assistant helping an older British person claim Pension Credit. Rewrite each line to be warm, calm, and plain — one or two short sentences. Keep the same meaning and any figures (e.g. £3,900, age 66). Do not add or drop steps. Return strict JSON {"lines": string[]} with EXACTLY the same number of items in the same order.',
      },
      { role: 'user', content: JSON.stringify({ lines }) },
    ],
    3000
  );
  if (!content) return lines;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed?.lines) && parsed.lines.length === lines.length) {
      return parsed.lines.map((l: unknown) => (typeof l === 'string' && l.trim() ? l : ''));
    }
  } catch {
    // fall through
  }
  return lines;
}

/**
 * The Planner wired into the orchestrator. Resolves (rewrites narration) once
 * during PLANNING; field values stay deterministic from the profile.
 */
export function createPlanner(): Planner {
  return async (plan: AgentStep[]) => {
    if (!hasOpenAI()) return plan;
    const rewritten = await rewriteNarrations(plan.map((s) => s.narration));
    return plan.map((step, i) => ({
      ...step,
      narration: rewritten[i] && rewritten[i].trim() ? rewritten[i] : step.narration,
    }));
  };
}
// chore: note 2026-06-25T15:57:41
