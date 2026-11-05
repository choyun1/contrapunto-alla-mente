// Which shifts Jv there are, which ones matter most, and what to call them.
//
// Shifts are zero-indexed, as in rules.js: −7 is inversion at the octave,
// −9 at the 10th, −11 at the 12th. Negative shifts cross the voices (inverse
// shift); positive ones move them apart (direct shift).

import { intervalName } from './rules.js';

/**
 * The shifts the site offers: up to three octaves either way (±21, inversion
 * at the 22nd), the same range as the three-voice page.
 */
export const JV_RANGE = { min: -21, max: 21 };

/**
 * The common shifts: inversion at the octave, 10th and 12th, the three
 * Taneyev treats at length, plus 0 (simple counterpoint, nothing moves).
 * These are the "easy" pair shifts of the three-voice page too.
 */
export const COMMON_SHIFTS = [0, -7, -9, -11];

/**
 * The shifts Taneyev works through, with his practice order where he gives
 * one (the order in which he sets the exercises; § to check against the book).
 * `order` is null for 0 and −14, which he does not practice as separate kinds.
 */
export const BOOK_SHIFTS = [
  { jv: 0, order: null, note: 'The reference marks that every other chart is built from.' },
  { jv: -7, order: 6, note: 'The textbook case.' },
  { jv: -14, order: null, note: 'The same as −7 up to the 10th. It differs at the 11th and 12th (10 and 11): at −7 a 12th becomes a 5th, at −14 it becomes a 4th. Use it when the voices sit more than an octave apart, as in Bach’s keyboard openings.' },
  { jv: -11, order: 3, note: 'Taneyev’s most important kind.' },
  { jv: -9, order: 2, note: 'Without suspensions or similar motion.' },
  { jv: -4, order: 4, note: '' },
  { jv: -2, order: 7, note: '' },
  { jv: 3, order: 5, note: 'Voices move apart without crossing.' },
  { jv: 5, order: 8, note: '' },
  { jv: -12, order: 9, note: '' },
  { jv: -13, order: 10, note: 'Rare in real music.' },
];

const ORDINALS = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];

/** Every shift in JV_RANGE, from the widest inversion up to the widest direct shift. */
export function allShifts() {
  const list = [];
  for (let jv = JV_RANGE.min; jv <= JV_RANGE.max; jv += 1) list.push(jv);
  return list;
}

/** Is jv a whole number inside JV_RANGE? */
export const inRange = (jv) => Number.isInteger(jv) && jv >= JV_RANGE.min && jv <= JV_RANGE.max;

/** Is this one of the common shifts (0, −7, −9, −11)? */
export const isCommonShift = (jv) => COMMON_SHIFTS.includes(jv);

/** The BOOK_SHIFTS entry for jv, or undefined when Taneyev does not treat it. */
export const bookEntry = (jv) => BOOK_SHIFTS.find((entry) => entry.jv === jv);

/** "a" or "an" before an interval name, by sound: "an octave", "an 11th", "an 18th". */
const article = (name) => (/^(octave|8|11|18)/.test(name) ? 'an' : 'a');

/**
 * The chart's title, e.g. "Invertible at the 12th" for −11 or "Direct shift up
 * a 4th" for +3. An inverse shift of −k inverts at the interval numbered k
 * (zero-indexed), so −11 is the 12th and −7 the octave.
 */
export function shiftTitle(jv) {
  if (jv === 0) return 'Simple counterpoint';
  if (jv < 0) return `Invertible at the ${intervalName(-jv)}`;
  const name = intervalName(jv);
  return `Direct shift up ${article(name)} ${name}`;
}

/** A sentence about the shift: Taneyev's note and practice order, or that it is outside the book. */
export function shiftNote(jv) {
  const entry = bookEntry(jv);
  if (!entry) return 'Not one of the shifts Taneyev works through; generated from the same rules.';
  const order = entry.order ? `${ORDINALS[entry.order]} in Taneyev’s practice order.` : '';
  return [entry.note, order].filter(Boolean).join(' ');
}
