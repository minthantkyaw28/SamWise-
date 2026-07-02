import type { AgentStep, FormSection } from './types';
import profile from '../data/userProfile.json';

/**
 * The Pension Credit golden path — trimmed for a ~45-second live demo.
 *
 * Five visible checklist steps tell the whole story: read the rules, confirm,
 * fill the claim, review, submit. The single fillForm step still drives all five
 * real form sections inside the WebView (the centrepiece), but counts as one
 * checklist item so the plan stays short and legible.
 *
 * Narration is deliberately one short sentence per step so it can be spoken in
 * full without dragging. Form values are baked in from userProfile.json; the LLM
 * only rewrites narration, never the outcome.
 */

const GOV_URL = 'www.gov.uk/pension-credit';

// The five real form sections the agent drives, in order.
const FORM_SECTIONS: FormSection[] = [
  {
    id: 'step-personal',
    title: 'Personal details',
    nextSelector: '#btn-personal-next',
    fields: [
      { label: 'your name', kind: 'text', selector: '#full-name', value: profile.fullName },
      { label: 'your date of birth', kind: 'text', selector: '#dob', value: profile.dob },
      {
        label: 'your National Insurance number',
        kind: 'text',
        selector: '#ni-number',
        value: profile.niNumber,
      },
    ],
  },
  {
    id: 'step-income',
    title: 'Income',
    nextSelector: '#btn-income-next',
    fields: [
      {
        label: 'your weekly income',
        kind: 'text',
        selector: '#weekly-income',
        value: profile.weeklyIncome,
      },
      { label: 'your savings', kind: 'text', selector: '#savings', value: profile.savings },
      {
        label: 'whether you have a partner',
        kind: 'radio',
        radioId: profile.hasPartner === 'yes' ? 'partner-yes' : 'partner-no',
      },
    ],
  },
  {
    id: 'step-housing',
    title: 'Where you live',
    nextSelector: '#btn-housing-next',
    fields: [
      { label: 'your address', kind: 'text', selector: '#address-line', value: profile.address },
      { label: 'your postcode', kind: 'text', selector: '#postcode', value: profile.postcode },
      {
        label: 'whether you own or rent',
        kind: 'radio',
        radioId: profile.tenure === 'own' ? 'tenure-own' : 'tenure-rent',
      },
    ],
  },
  {
    id: 'step-bank',
    title: 'How you’re paid',
    nextSelector: '#btn-bank-next',
    fields: [
      {
        label: 'the name on your account',
        kind: 'text',
        selector: '#account-name',
        value: profile.accountName,
      },
      { label: 'your sort code', kind: 'text', selector: '#sort-code', value: profile.sortCode },
      {
        label: 'your account number',
        kind: 'text',
        selector: '#account-number',
        value: profile.accountNumber,
      },
    ],
  },
  {
    id: 'step-contact',
    title: 'Contact details',
    nextSelector: '#btn-contact-next',
    fields: [
      { label: 'your phone number', kind: 'text', selector: '#phone', value: profile.phone },
      { label: 'your email address', kind: 'text', selector: '#email', value: profile.email },
    ],
  },
];

export const samwisePlan: AgentStep[] = [
  {
    id: 'research',
    title: 'Read the eligibility rules',
    kind: 'research',
    url: GOV_URL,
    highlights: ['#elig-lede', '#elig-inset'],
    narration:
      "I'll read the rules for you. Pension Credit tops up a low income for people over 66.",
  },
  {
    id: 'gate',
    title: 'Check you qualify',
    kind: 'askUser',
    awaitUser: true,
    narration: 'Good news — you qualify, and it could be worth around £3,900 a year.',
    question: 'You qualify. Shall I claim it for you?',
    options: ['Yes, claim it', 'Not now'],
  },
  {
    id: 'fill',
    title: 'Fill in your claim',
    kind: 'fillForm',
    url: GOV_URL + '/apply',
    clickSelector: '#btn-start',
    narration: "Now I'll fill in your claim — watch me complete each section for you.",
    formSections: FORM_SECTIONS,
  },
  {
    id: 'review',
    title: 'Check your answers',
    kind: 'review',
    durationMs: 1200,
    narration: "Here's everything I entered — please check it looks right.",
  },
  {
    id: 'submit',
    title: 'Submit your claim',
    kind: 'submit',
    clickSelector: '#btn-submit',
    durationMs: 900,
    narration:
      "Submitting now. Done — your claim is in, worth around £3,900 a year. A decision letter follows within six weeks.",
  },
];

/** Pull the question + options off an askUser step, if present. */
export function questionFor(step: AgentStep): { question: string; options: string[] } | null {
  if (step.kind === 'askUser' && step.question && step.options) {
    return { question: step.question, options: step.options };
  }
  return null;
}
// chore: note 2026-07-02T15:37:16
