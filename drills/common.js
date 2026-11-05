// Page pieces shared by the drill pages: the canons to choose from, the
// on-screen keyboard, the strip of beats and a few small form helpers.
// Display only: every verdict comes from the rules core (src/taneyev/).
// Intervals are zero-indexed (3rd 2, 5th 4, octave 7); pitches are diatonic steps.

import { keyboard } from '../src/ui/keyboard.js';
import { keyLabels } from '../src/input/key-map.js';
import { intervalName } from '../src/taneyev/rules.js';
import { VERDICT } from '../src/taneyev/canon.js';
import { parsePitch } from '../src/common/diatonic.js';
import { entryName } from '../canon/names.js';

/** The on-screen keyboard's range: the three rows of computer keys, C3 to C6. */
export const LOW = parsePitch('C3');
export const HIGH = parsePitch('C6');

/**
 * Canons to practice, easiest first: unison and octaves, then 5ths and 4ths,
 * then 3rds and 6ths, then the compound sizes (12th, 10th). Positive: the
 * risposta enters above. The order is a practice plan, not a rule.
 */
export const CANONS = [0, 7, -7, 4, -4, 3, -3, 2, -2, 5, -5, 11, -11, 9, -9];

/** Delay choices, in notes: how long the risposta waits before copying you. */
export const DELAYS = [1, 2, 3].map((notes) => ({ value: notes, text: notes === 1 ? '1 note' : `${notes} notes` }));

/** Run lengths, in notes of the proposta. */
export const LENGTHS = [8, 12, 16].map((notes) => ({ value: notes, text: `${notes} notes` }));

/** Options for an interval-of-entrance select, e.g. "5th above". */
export const canonOptions = (entries = CANONS) => entries.map((entry) => ({ value: entry, text: entryName(entry) }));

/** Tempo choices: 0 waits for each note; the rest are beats per minute. */
export const TEMPOS = [
  { value: 0, text: 'Wait for me' },
  { value: 30, text: '30 a minute' },
  { value: 40, text: '40 a minute' },
  { value: 60, text: '60 a minute' },
  { value: 80, text: '80 a minute' },
  { value: 100, text: '100 a minute' },
];

/** Fills a select with { value, text } options and picks `value`. */
export function fillSelect(select, options, value) {
  select.innerHTML = options.map((option) => `<option value="${option.value}">${option.text}</option>`).join('');
  select.value = String(value);
}

/** The number in a select, e.g. the interval of entrance. */
export const numberIn = (id) => Number(document.getElementById(id).value);

/**
 * Draws the on-screen keyboard into `box`, with the computer key for each
 * white key printed on it. marks and tags as in src/ui/keyboard.js; lit maps a
 * step to 'kb-good', 'kb-bad' or 'kb-on'.
 */
export function drawKeys(box, { marks = [], tags = [], lit = new Map() } = {}) {
  box.innerHTML = keyboard(LOW, HIGH, marks, tags, { lit, labels: keyLabels() });
}

/**
 * Words and a color class for one checked canon note (canon.js checkProposta),
 * worst problem first: dissonance, consecutive perfects, similar motion into a
 * perfect, crossed voices, a melodic tritone, then the plain verdict.
 * Kinds: 'miss', 'perfect', 'free'.
 */
export function verdictLabel(result, { crossed = false, tritone = false } = {}) {
  if (result.verdict === VERDICT.SUSPENSION) return { text: 'dissonant', kind: 'miss' };
  if (result.consecutive) return { text: 'parallel', kind: 'miss' };
  if (result.similar) return { text: 'direct', kind: 'miss' };
  if (crossed) return { text: 'crossed', kind: 'miss' };
  if (tritone) return { text: 'tritone', kind: 'miss' };
  if (result.verdict === VERDICT.PERFECT) return { text: 'perfect', kind: 'perfect' };
  return { text: 'free', kind: 'free' };
}

/** The interval between the voices in words, e.g. "6th", "unison". */
export const betweenName = (n) => intervalName(Math.abs(n));

/** One cell of the beat strip: three lines of text and a color class. */
export function stripCell({ top, middle, bottom, kind = '' }) {
  return `<li class="${kind}"><span>${top}</span><span>${middle}</span><span>${bottom}</span></li>`;
}
