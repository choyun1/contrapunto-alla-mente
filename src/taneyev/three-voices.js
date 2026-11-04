// Three voices: splitting one outer shift between two inner pairs.
//
// Voices are named upper, middle and lower, as they stand in the original
// combination. Every pair of voices has its own shift Jv, measured against how
// that pair sounded in the original, and the shifts add up:
//
//   Jv(upper, lower) = Jv(upper, middle) + Jv(middle, lower)
//
// because each voice moves by a fixed number of steps and a pair's shift is
// the difference of its two voices' moves (Taneyev's three-voice shifts, §§ to
// check against the book). Intervals and shifts are zero-indexed, as in
// rules.js: −7 is the octave, −9 the 10th, −11 the 12th.

import { chart, isConsonant, simple } from './rules.js';

/**
 * Inner-pair shifts that are comfortable to write against: inversion at the
 * octave, 10th and 12th, the three Taneyev treats at length. A shift of 0
 * (the pair keeps its original spacing) is simple counterpoint and also easy.
 */
export const EASY_SHIFTS = [-7, -9, -11];

/** Is this shift easy for one pair: 0 or one of EASY_SHIFTS? */
export const isEasyShift = (jv) => jv === 0 || EASY_SHIFTS.includes(jv);

/**
 * Every way to split an outer shift with the middle voice lying between the
 * other two: { upper: Jv(upper, middle), lower: Jv(middle, lower) }, both with
 * the outer shift's sign (or 0). Ordered from the middle voice moving with the
 * lower voice (upper = total) to moving with the upper voice (upper = 0).
 */
export function splitShift(total) {
  const splits = [];
  for (let size = 0; size <= Math.abs(total); size += 1) {
    const lower = total < 0 ? 0 - size : size; // 0 - size, not -size, so no −0
    splits.push({ upper: total - lower, lower });
  }
  return splits;
}

/** The three pair shifts of a split, keyed by pair. */
export function pairShifts({ upper, lower }) {
  return { upperMiddle: upper, middleLower: lower, upperLower: upper + lower };
}

/** Are both inner pairs easy shifts? */
export const isEasySplit = ({ upper, lower }) => isEasyShift(upper) && isEasyShift(lower);

/** Intervals 0–9 that stay consonant under a shift (fixed consonances, from rules.js). */
export function fixedConsonances(jv) {
  return chart(jv, { width: 9 })
    .filter((col) => col.kind === 'fixed-consonance')
    .map((col) => col.m);
}

/**
 * In a canon all voices enter with the same tune, so each pair's shift is the
 * distance between their entries (inverted: Jv = −interval). Given the lower
 * voice's entry as a diatonic step (see common/diatonic.js), returns the
 * middle voice's entry step for a split.
 */
export const middleEntry = (lowerStep, { lower }) => lowerStep + Math.abs(lower);

/**
 * Is interval i consonant between two voices of a three-voice chord? As in two
 * voices, except that a perfect 4th (3, or a compound of it) is consonant
 * between two voices that both sit above the lowest-sounding voice, provided
 * each is consonant with that voice (Movable Counterpoint 4, 10:23). The
 * augmented 4th is still out: callers check tritones separately.
 */
export function isChordConsonance(i, bothAboveLowest) {
  if (isConsonant(i)) return true;
  return bothAboveLowest && simple(i) === 3;
}
