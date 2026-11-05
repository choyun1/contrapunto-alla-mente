// A short three-voice example, note against note, that stays correct when the
// voices shift by a split of the outer shift (see three-voices.js).
//
// The lower voice sings a four-note cantus firmus and stays where it is. In the
// shifted version the middle voice moves by Jv(middle, lower) and the upper
// voice by Jv(upper, middle) + Jv(middle, lower), so every pair shifts by its
// own Jv. The upper and middle voices are found by search: every pair of lines
// is tried, and the smoothest one whose three pairs obey the two-voice rules in
// both versions is kept, as in first-species.js.
//
// Intervals are zero-indexed (unison 0, 5th 4, octave 7). Pitches are diatonic
// steps in C major (src/common/diatonic.js). Each pair is checked by the
// two-voice rules, except that a 4th is allowed between the two voices above
// the lowest-sounding one (see isChordConsonance in three-voices.js).

import { isTritone, MIDDLE_C } from '../common/diatonic.js';
import { isPerfect } from './rules.js';
import { motion, moveSurvivesShift } from './motion.js';
import { CANTI } from './first-species.js';
import { pairShifts, isChordConsonance } from './three-voices.js';

/** Widest interval in either inner pair of the original: a 10th (9). */
const WIDEST = 9;

/**
 * Melodic moves the upper voices may make, in steps: a repeated note, 2nd, 3rd,
 * 4th, 5th, octave (Fux). Three voices need the repeated note far more often
 * than two, so it is allowed here at a small cost (see leapCost).
 */
const ALLOWED_LEAPS = [0, 1, 2, 3, 4, 7];

/** Widest the outer voices may be in the original: two octaves (14). */
const WIDEST_OUTER = 14;

/** How far each voice moves in the shifted version, in steps. */
function voiceMoves(split) {
  const { middleLower, upperLower } = pairShifts(split);
  return { upper: upperLower, middle: middleLower, lower: 0 };
}

/** The three pairs of a chord as dyads (voice I above voice II in the original), each with its Jv. */
function pairsOf(chord, split) {
  const { upperMiddle, middleLower, upperLower } = pairShifts(split);
  return [
    { dyad: { voiceI: chord.upper, voiceII: chord.middle }, jv: upperMiddle },
    { dyad: { voiceI: chord.middle, voiceII: chord.lower }, jv: middleLower },
    { dyad: { voiceI: chord.upper, voiceII: chord.lower }, jv: upperLower },
  ];
}

/**
 * Is one chord, in one version, usable? First the lowest-sounding voice: both
 * other voices must be consonant with it (two-voice rules). Then the pair above
 * it, which may also form a 4th (isChordConsonance). No pair may be a tritone,
 * and a unison only belongs at the start or the end (Fux).
 */
function goodVersion(chord, isEdge) {
  const pitches = [chord.upper, chord.middle, chord.lower];
  const lowest = Math.min(...pitches);
  const pairs = [[chord.upper, chord.middle], [chord.middle, chord.lower], [chord.upper, chord.lower]];
  return pairs.every(([a, b]) => {
    const bothAboveLowest = Math.min(a, b) > lowest;
    if (!isChordConsonance(a - b, bothAboveLowest) || isTritone(a, b)) return false;
    return isEdge || a !== b;
  });
}

/** Is a chord good in the original and the shifted version? */
function goodChord(chord, split, isEdge) {
  const shifted = shiftChord(chord, voiceMoves(split));
  return goodVersion(chord, isEdge) && goodVersion(shifted, isEdge);
}

/** A chord with each voice moved by its shift. */
const shiftChord = (chord, moves) => ({
  upper: chord.upper + moves.upper,
  middle: chord.middle + moves.middle,
  lower: chord.lower + moves.lower,
});

/** Is a melodic move of one voice singable in both versions (no tritone leap)? */
function goodMelody(from, to, move) {
  if (!ALLOWED_LEAPS.includes(Math.abs(to - from))) return false;
  return !isTritone(from, to) && !isTritone(from + move, to + move);
}

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
  const chords = [];
  for (let low = 0; low <= WIDEST; low += 1) {
    for (let high = 0; high <= WIDEST; high += 1) {
      if (low + high > WIDEST_OUTER) continue;
      const lower = cantus[k];
      const chord = { upper: lower + low + high, middle: lower + low, lower };
      if (goodChord(chord, split, isEdge)) chords.push(chord);
    }
  }
  return chords;
}

/** Cost of a melodic move: steps are free, a repeated note costs 1, every larger leap more. */
function leapCost(from, to) {
  const size = Math.abs(to - from);
  if (size === 0) return 1;
  return size - 1;
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
