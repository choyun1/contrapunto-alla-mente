// Display names shared by the canon page's scripts: numbers with a real minus
// sign, and intervals of entrance in words. Display only; no theory here.
// Intervals are zero-indexed (step 1, 3rd 2, octave 7).

import { intervalName } from '../src/taneyev/rules.js';

/** A number with a typographic minus, e.g. "−9". */
export const fmt = (n) => (n < 0 ? `−${-n}` : String(n));

/** A number with its sign always shown, e.g. "+7", "−9", "0". */
export const sign = (n) => (n > 0 ? `+${n}` : fmt(n));

/** An interval name with "a" or "an", e.g. "an octave", "a 3rd". */
export const withArticle = (name) => `${/^(octave|8|11)/.test(name) ? 'an' : 'a'} ${name}`;

/** Display name for an interval of entrance, e.g. "octave above". */
export function entryName(entry) {
  if (entry === 0) return 'unison';
  return `${intervalName(Math.abs(entry))} ${entry > 0 ? 'above' : 'below'}`;
}

/** Which hand plays the proposta's next note, in words (see canon-hands.js). */
export function handName(entry) {
  if (entry === 0) return 'both hands, thumbs together';
  return entry > 0 ? 'left hand, going down' : 'right hand, going up';
}
