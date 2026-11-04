// How two voices move from one dyad to the next, and which moves are forbidden.
//
// A dyad is { voiceI, voiceII } in diatonic steps (see src/common/diatonic.js).
// Intervals are zero-indexed and measured voice I minus voice II, so a negative
// interval means voice I is below.
//
// A vertical shift moves voice I by a fixed amount, so the direction each voice
// moves is the same in the original and the derivative. Only the intervals
// change. That is why every check here takes the interval pair separately.

import { isPerfect, forbidsSimilarMotion } from './rules.js';

/** Motion between two dyads: 'contrary', 'similar', 'oblique' or 'none'. */
export function motion(from, to) {
  const moveI = Math.sign(to.voiceI - from.voiceI);
  const moveII = Math.sign(to.voiceII - from.voiceII);
  if (moveI === 0 && moveII === 0) return 'none';
  if (moveI === 0 || moveII === 0) return 'oblique';
  return moveI === moveII ? 'similar' : 'contrary';
}

/** The interval of a dyad: voice I minus voice II. */
export const intervalOf = (dyad) => dyad.voiceI - dyad.voiceII;

/**
 * Is a move from interval a to interval b forbidden, given the motion?
 *   - similar or parallel motion into a perfect consonance (Fux, first species;
 *     Taneyev's bold numerals);
 *   - a perfect consonance followed by another of the same size while both
 *     voices move, even in contrary motion (Fux: octave to octave, 5th to 12th).
 */
export function isForbiddenMove(a, b, kind) {
  if (kind === 'similar' && isPerfect(b)) return true;
  const bothMove = kind === 'similar' || kind === 'contrary';
  const samePerfect = isPerfect(a) && isPerfect(b) && Math.abs(a) % 7 === Math.abs(b) % 7;
  return bothMove && samePerfect;
}

/**
 * Is a move between two dyads allowed in both the original and the shifted
 * version? §101 adds: for some shifts, no similar motion at all.
 */
export function moveSurvivesShift(from, to, jv) {
  const kind = motion(from, to);
  if (kind === 'similar' && forbidsSimilarMotion(jv)) return false;
  const a = intervalOf(from);
  const b = intervalOf(to);
  return !isForbiddenMove(a, b, kind) && !isForbiddenMove(a + jv, b + jv, kind);
}
