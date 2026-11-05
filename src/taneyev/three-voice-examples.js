// A short three-voice example, note against note, that stays correct when the
// voices shift by a split of the outer shift (see three-voices.js).
//
// The lower voice sings a four-note cantus firmus and stays where it is. In the
// shifted version the middle voice moves by Jv(middle, lower) and the upper
// voice by Jv(upper, middle) + Jv(middle, lower), so every pair shifts by its
// own Jv. The upper and middle voices are found by search: every pair of lines
// is tried, and the smoothest one whose three pairs obey the two-voice rules in
// both versions is kept, as in first-species.js. The chord rules are in
// three-voice-chords.js; three-voice-species.js is the fallback with
// suspensions and passing tones when this strict search finds nothing.
//
// Intervals are zero-indexed (unison 0, 5th 4, octave 7). Pitches are diatonic
// steps in C major (src/common/diatonic.js).

import { MIDDLE_C } from '../common/diatonic.js';
import { isPerfect } from './rules.js';
import { motion, moveSurvivesShift } from './motion.js';
import { CANTI } from './first-species.js';
import {
  voiceMoves, shiftChord, pairsOf, goodChord, goodMelody, leapCost, spacingsOver,
} from './three-voice-chords.js';

/** Can the voices move from one chord to the next, in both versions? */
function goodMove(from, to, split) {
  const moves = voiceMoves(split);
  if (!goodMelody(from.upper, to.upper, moves.upper)) return false;
  if (!goodMelody(from.middle, to.middle, moves.middle)) return false;
  const before = pairsOf(from, split);
  const after = pairsOf(to, split);
  return before.every((pair, k) => moveSurvivesShift(pair.dyad, after[k].dyad, pair.jv));
}

/** Every chord that may stand over cantus note k. */
function candidates(cantus, k, split) {
  const isEdge = k === 0 || k === cantus.length - 1;
  return spacingsOver(cantus[k]).filter((chord) => goodChord(chord, split, isEdge));
}

/** Cost of a finished example: smoothness, then a nudge toward a perfect close (Fux). */
function exampleCost(chords, split) {
  let cost = 0;
  for (let k = 1; k < chords.length; k += 1) {
    cost += leapCost(chords[k - 1].upper, chords[k].upper);
    cost += leapCost(chords[k - 1].middle, chords[k].middle);
    const before = pairsOf(chords[k - 1], split);
    const after = pairsOf(chords[k], split);
    cost += before.filter((pair, j) => motion(pair.dyad, after[j].dyad) === 'similar').length;
  }
  const last = chords.at(-1);
  const shiftedLast = shiftChord(last, voiceMoves(split));
  if (!isPerfect(last.upper - last.lower)) cost += 2;
  if (!isPerfect(shiftedLast.upper - shiftedLast.lower)) cost += 2;
  return cost;
}

/** Every legal sequence of chords over one cantus. */
function legalExamples(cantus, split) {
  const found = [];
  const extend = (chords) => {
    const k = chords.length;
    if (k === cantus.length) {
      found.push(chords);
      return;
    }
    for (const chord of candidates(cantus, k, split)) {
      if (k > 0 && !goodMove(chords[k - 1], chord, split)) continue;
      extend([...chords, chord]);
    }
  };
  extend([]);
  return found;
}

/**
 * The smoothest four-bar example for a split, or null if no cantus allows one
 * (the pairs share too few fixed consonances). The cantus starts on `start`
 * (a diatonic step; middle C by default), moved within C major, so the
 * tritone checks follow it. Returns { cantus, original, shifted }, where
 * original and shifted are lists of { upper, middle, lower }.
 */
export function threeVoiceExample(split, { start = MIDDLE_C } = {}) {
  let best = null;
  const canti = CANTI.map((notes) => notes.map((step) => step - MIDDLE_C + start));
  for (const cantus of canti) {
    for (const chords of legalExamples(cantus, split)) {
      const cost = exampleCost(chords, split);
      if (!best || cost < best.cost) best = { cost, cantus, chords };
    }
  }
  if (!best) return null;
  const moves = voiceMoves(split);
  return {
    cantus: best.cantus,
    original: best.chords,
    shifted: best.chords.map((chord) => shiftChord(chord, moves)),
  };
}
