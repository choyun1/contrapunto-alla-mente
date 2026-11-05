// Canon over a cantus firmus: where the three voices sit.
//
// The composer chooses the order of the cantus (CF), proposta (P) and
// risposta (R) from top to bottom, plus the size of the interval of entrance
// and the delay. Everything else follows from the order: whether the risposta
// enters above or below the proposta (the sign of the entry), and which side
// of the cantus each canon voice keeps. Video 4 uses R / CF / P (02:40) and
// R / P / CF (16:29), and shows CF on top too (19:00).
//
// Intervals are zero-indexed: the size of a 12th is 11, of a unison 0.

import { SIDE } from './imaginary-cantus.js';

/** The three voices, by the names used in chords and setups. */
export const VOICE = { RISPOSTA: 'risposta', CANTUS: 'cantus', PROPOSTA: 'proposta' };

/** Short staff labels for the voices. */
export const LABEL = { risposta: 'R', cantus: 'CF', proposta: 'P' };

/** Every order of the three voices, top to bottom, with the cantus in the middle first. */
export const ORDERS = [
  ['risposta', 'cantus', 'proposta'],
  ['proposta', 'cantus', 'risposta'],
  ['risposta', 'proposta', 'cantus'],
  ['proposta', 'risposta', 'cantus'],
  ['cantus', 'risposta', 'proposta'],
  ['cantus', 'proposta', 'risposta'],
];

/** An order in words, top to bottom, e.g. "R / CF / P". */
export const orderName = (order) => order.map((voice) => LABEL[voice]).join(' / ');

/** Is voice `a` above voice `b` in this order? */
export const isAbove = (order, a, b) => order.indexOf(a) < order.indexOf(b);

/** The side of the cantus a canon voice keeps in this order. */
const sideOf = (order, voice) => (isAbove(order, voice, VOICE.CANTUS) ? SIDE.ABOVE : SIDE.BELOW);

/**
 * The interval of entrance, signed: positive when the risposta is above the
 * proposta in the order. A unison stays 0, and its two voices may cross.
 */
export function entryFor(order, size) {
  if (size === 0) return 0;
  return isAbove(order, VOICE.RISPOSTA, VOICE.PROPOSTA) ? size : 0 - size;
}

/**
 * The full setup for a canon over a cantus firmus.
 * Returns { cantus, order, entry, delay, side, rispostaSide }, where side is
 * the proposta's side of the cantus (as imaginary-cantus.js expects) and
 * rispostaSide is the risposta's.
 */
export function setupFor({ cantus, order, size, delay }) {
  return {
    cantus,
    order,
    entry: entryFor(order, size),
    delay,
    side: sideOf(order, VOICE.PROPOSTA),
    rispostaSide: sideOf(order, VOICE.RISPOSTA),
  };
}
