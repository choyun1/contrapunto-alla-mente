// Chords of three voices and how they move, shared by the three-voice example
// searches (three-voice-examples.js, note against note, and
// three-voice-species.js, with suspensions and passing tones).
//
// A chord is { upper, middle, lower } in diatonic steps (src/common/diatonic.js).
// The lower voice is the cantus firmus and stays where it is. In the shifted
// version the middle voice moves by Jv(middle, lower) and the upper voice by
// Jv(upper, middle) + Jv(middle, lower), so every pair shifts by its own Jv
// (see three-voices.js). Intervals are zero-indexed (unison 0, 5th 4, octave 7).

import { isTritone } from '../common/diatonic.js';
import { pairShifts, isChordConsonance } from './three-voices.js';

/** Widest interval in either inner pair of the original: a 10th (9). */
export const WIDEST = 9;

/** Widest the outer voices may be in the original: two octaves (14). */
export const WIDEST_OUTER = 14;

/**
 * Melodic moves the upper voices may make, in steps: a repeated note, 2nd, 3rd,
 * 4th, 5th, octave (Fux). Three voices need the repeated note far more often
 * than two, so it is allowed at a small cost (see leapCost).
 */
export const ALLOWED_LEAPS = [0, 1, 2, 3, 4, 7];

/** How far each voice moves in the shifted version, in steps. */
export function voiceMoves(split) {
  const { middleLower, upperLower } = pairShifts(split);
  return { upper: upperLower, middle: middleLower, lower: 0 };
}

/** A chord with each voice moved by its shift. */
export const shiftChord = (chord, moves) => ({
  upper: chord.upper + moves.upper,
  middle: chord.middle + moves.middle,
  lower: chord.lower + moves.lower,
});

/** The three pairs, by voice name: [voice I, voice II] as they stand in the original. */
export const PAIRS = [['upper', 'middle'], ['middle', 'lower'], ['upper', 'lower']];

/** The three pairs of a chord as dyads (voice I above voice II in the original), each with its Jv. */
export function pairsOf(chord, split) {
  const { upperMiddle, middleLower, upperLower } = pairShifts(split);
  const jvs = [upperMiddle, middleLower, upperLower];
  return PAIRS.map(([high, low], k) => ({
    voices: [high, low],
    dyad: { voiceI: chord[high], voiceII: chord[low] },
    jv: jvs[k],
  }));
}

/**
 * Is the pair a–b (two pitches of `chord`) usable in one version? Consonant by
 * the two-voice rules, or a 4th between two voices above the lowest
 * (isChordConsonance); never a tritone; a unison only at the start or the end (Fux).
 */
export function goodPair(chord, a, b, isEdge) {
  const lowest = Math.min(chord.upper, chord.middle, chord.lower);
  const bothAboveLowest = Math.min(a, b) > lowest;
  if (!isChordConsonance(a - b, bothAboveLowest) || isTritone(a, b)) return false;
  return isEdge || a !== b;
}

/** Is one chord, in one version, usable: every pair good (goodPair)? */
export function goodVersion(chord, isEdge) {
  return PAIRS.every(([high, low]) => goodPair(chord, chord[high], chord[low], isEdge));
}

/** Is a chord good in the original and the shifted version? */
export function goodChord(chord, split, isEdge) {
  const shifted = shiftChord(chord, voiceMoves(split));
  return goodVersion(chord, isEdge) && goodVersion(shifted, isEdge);
}

/** Is a melodic move of one voice singable in both versions (an allowed leap, no tritone)? */
export function goodMelody(from, to, move, leaps = ALLOWED_LEAPS) {
  if (!leaps.includes(Math.abs(to - from))) return false;
  return !isTritone(from, to) && !isTritone(from + move, to + move);
}

/** Cost of a melodic move: steps are free, a repeated note costs 1, every larger leap more. */
export function leapCost(from, to) {
  const size = Math.abs(to - from);
  if (size === 0) return 1;
  return size - 1;
}

/** Every { upper, middle } spacing over a cantus note within the widest spacings, lowest first. */
export function spacingsOver(lower) {
  const chords = [];
  for (let low = 0; low <= WIDEST; low += 1) {
    for (let high = 0; high <= WIDEST; high += 1) {
      if (low + high > WIDEST_OUTER) continue;
      chords.push({ upper: lower + low + high, middle: lower + low, lower });
    }
  }
  return chords;
}
