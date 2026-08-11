import type { FormSection } from './types';

/**
 * Imperative handle exposed by <MockBrowser/>. The orchestrator drives the
 * real WebView through these two primitives; everything else in this file is a
 * typed convenience built on top of them.
 */
export type BrowserHandle = {
  /** Fire-and-forget JS injection into the page. */
  inject: (js: string) => void;
  /**
   * Inject JS that posts `{type, payload:{id, ...}}` back via window.SAMWISE.post,
   * and resolve when the matching id arrives. Resolves with the payload, or with
   * `{ id, ok:false, timedOut:true }` after `timeoutMs` so the demo never hangs.
   */
  request: (id: string, js: string, timeoutMs?: number) => Promise<Record<string, unknown>>;
};

let counter = 0;
const nextId = (tag: string) => `${tag}-${++counter}`;

/** Wrap an injected statement so it can't throw and always ends cleanly. */
function wrap(body: string): string {
  return `(function(){ try { ${body} } catch(e){ if(window.SAMWISE){ window.SAMWISE.post('error',{message:String(e)}); } } })(); true;`;
}

const s = (v: unknown) => JSON.stringify(v);

/** Show a specific page section (step-personal, step-review, …). */
export async function showStep(b: BrowserHandle, stepId: string): Promise<void> {
  const id = nextId('show');
  await b.request(
    id,
    wrap(`window.SAMWISE.showStep(${s(stepId)}); window.SAMWISE.post('ack',{id:${s(id)},ok:true});`)
  );
}

/** Smoothly scroll a selector into view and flash a highlight outline. */
export async function highlight(b: BrowserHandle, selector: string): Promise<void> {
  const id = nextId('hl');
  await b.request(
    id,
    wrap(
      `window.SAMWISE.highlight(${s(selector)}); window.SAMWISE.post('ack',{id:${s(id)},ok:true});`
    )
  );
}

/** Type a value into a field character-by-character (visible to the audience). */
export async function typeInto(
  b: BrowserHandle,
  selector: string,
  value: string,
  delayMs = 52
): Promise<void> {
  const id = nextId('type');
  // Generous timeout: typing is the slow, visible part. value.length * delay + buffer.
  const timeout = value.length * delayMs + 4000;
  await b.request(
    id,
    wrap(
      `window.SAMWISE.typeInto(${s(selector)}, ${s(value)}, ${delayMs}).then(function(ok){ window.SAMWISE.post('ack',{id:${s(
        id
      )},ok:ok}); });`
    ),
    timeout
  );
}

/** Check a radio option by element id. */
export async function selectRadio(b: BrowserHandle, radioId: string): Promise<void> {
  const id = nextId('radio');
  await b.request(
    id,
    wrap(
      `var ok=window.SAMWISE.selectRadio(${s(radioId)}); window.SAMWISE.post('ack',{id:${s(
        id
      )},ok:ok});`
    )
  );
}

/** Click an element (e.g. a "Continue" or "Start now" button). */
export async function click(b: BrowserHandle, selector: string): Promise<void> {
  const id = nextId('click');
  await b.request(
    id,
    wrap(
      `var el=document.querySelector(${s(
        selector
      )}); if(el){el.click();} window.SAMWISE.post('ack',{id:${s(id)},ok:!!el});`
    )
  );
}

/** Read the visible text of a selector (used for narration/summaries). */
export async function readText(b: BrowserHandle, selector: string): Promise<string> {
  const id = nextId('read');
  const res = await b.request(
    id,
    wrap(
      `window.SAMWISE.post('text',{id:${s(id)}, value: window.SAMWISE.readText(${s(selector)})});`
    )
  );
  return typeof res.value === 'string' ? res.value : '';
}

export type FillCallbacks = {
  /** Called as each field begins, for status-line / narration updates. */
  onField?: (label: string, fieldIndex: number, total: number) => void;
  /** Per-character typing speed. */
  delayMs?: number;
  /** Pause between fields. */
  betweenFieldsMs?: number;
};

/** A small interruptible delay. */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Fill one form section field-by-field, then click its "next" button.
 * Text fields type visibly; radio fields are checked. This is the centrepiece.
 */
export async function fillSection(
  b: BrowserHandle,
  section: FormSection,
  cb: FillCallbacks = {}
): Promise<void> {
  // Make sure the right page section is showing before we touch fields.
  await showStep(b, section.id);
  await sleep(150);

  const total = section.fields.length;
  for (let i = 0; i < total; i++) {
    const field = section.fields[i];
    cb.onField?.(field.label, i, total);
    if (field.kind === 'radio' && field.radioId) {
      await selectRadio(b, field.radioId);
    } else if (field.kind === 'text' && field.selector) {
      await typeInto(b, field.selector, field.value ?? '', cb.delayMs ?? 30);
    }
    await sleep(cb.betweenFieldsMs ?? 150);
  }

  // Advance to the next section.
  await sleep(120);
  await click(b, section.nextSelector);
  await sleep(200);
}
