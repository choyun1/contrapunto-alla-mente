// A short first-species example (note against note, as in Fux's Gradus ad
// Parnassus) that stays correct after a vertical shift by Jv.
//
// Voice II sings a four-note cantus firmus; voice I is found by searching every
// line above it and keeping the smoothest one that obeys the rules below in
// both the original and the derivative. This is an answer key for the charts,
// not a composing tool: the rules are the ones a student checks by hand.
//
// Intervals are zero-indexed (unison 0, 5th 4, octave 7) and measured voice I
// minus voice II. Pitches are diatonic steps in C major (src/common/diatonic.js).

import { MIDDLE_C, isTritone } from '../common/diatonic.js';
import { isConsonant, isPerfect } from './rules.js';
import { motion, moveSurvivesShift } from './motion.js';

const C4 = MIDDLE_C;

/** Cantus firmi to try, in voice II. Each ends with the step D–C (Fux). */
export const CANTI = [
  [C4, C4 + 2, C4 + 1, C4], // C E D C
  [C4, C4 + 3, C4 + 1, C4], // C F D C
  [C4, C4 - 1, C4 + 1, C4], // C B D C
  [C4, C4 + 4, C4 + 1, C4], // C G D C
];

/** Melodic moves a cantus may make, in steps: a 2nd, 3rd, 4th or 5th (Fux). */
const CANTUS_LEAPS = [1, 2, 3, 4];

/**
 * Every four-note cantus from `start`: any singable second note, then a step
 * to the note above or below `start`, then `start` (Fux ends a cantus by step).
 * A wider choice than CANTI, for searches that find nothing over those.
 */
export function fourNoteCanti(start) {
  const singable = (a, b) => CANTUS_LEAPS.includes(Math.abs(a - b)) && !isTritone(a, b);
  const canti = [];
  for (const penultimate of [start + 1, start - 1]) {
    for (let second = start - 4; second <= start + 4; second += 1) {
      if (singable(start, second) && singable(second, penultimate)) canti.push([start, second, penultimate, start]);
    }
  }
  return canti;
}

/** Highest interval voice I may form above the cantus: a 17th (16). */
const WIDEST = 16;

/** Melodic moves voice I may make, in steps: 2nd, 3rd, 4th, 5th, octave (Fux). */
const ALLOWED_LEAPS = [1, 2, 3, 4, 7];

/**
 * Is interval i, between voice I at `upper` and the cantus, usable in a version?
 * It must be consonant, a 5th must be perfect (not B–F), and a unison only
 * belongs at the start or the end (Fux).
 */
function goodVertical(voiceI, voiceII, isEdge) {
  const i = voiceI - voiceII;
  if (!isConsonant(i)) return false;
  if (isTritone(voiceI, voiceII)) return false;
  return isEdge || i !== 0;
}

/** Is a melodic move of voice I singable in both versions? */
function goodMelody(from, to, jv) {
  const leap = Math.abs(to - from);
  if (!ALLOWED_LEAPS.includes(leap)) return false;
  return !isTritone(from, to) && !isTritone(from + jv, to + jv);
}

/** Cost of a melodic move: steps are free, every larger leap costs more. */
const leapCost = (from, to) => Math.abs(to - from) - 1;

/** Extra cost of a move that is legal but less smooth. */
function moveCost(from, to) {
  const kind = motion(from, to);
  return kind === 'similar' ? 1 : 0;
}

/** Every voice I note that may stand over cantus note k. */
function candidates(cantus, k, jv) {
  const edge = k === 0 || k === cantus.length - 1;
  const notes = [];
  for (let m = 0; m <= WIDEST; m += 1) {
    const voiceI = cantus[k] + m;
    const original = goodVertical(voiceI, cantus[k], edge);
    const derivative = goodVertical(voiceI + jv, cantus[k], edge);
    if (original && derivative) notes.push(voiceI);
  }
  return notes;
}

/** Does a finished line close as Fux asks: a perfect consonance reached by step? */
function goodClose(line, cantus) {
  const last = line.length - 1;
  const closesPerfect = isPerfect(line[last] - cantus[last]);
  const closesByStep = Math.abs(line[last] - line[last - 1]) === 1;
  return closesPerfect && closesByStep;
}

/**
 * Cost of opening on an imperfect consonance. Fux opens on a perfect one, but
 * at −12 and −13 no four-bar line can, so an imperfect opening is allowed as a
 * last resort rather than forbidden.
 */
const IMPERFECT_OPENING = 10;

/** Spacing wider than a 10th (9) costs a little: Fux keeps the voices close. */
const WIDE = 9;

/** Cost of a finished line: smoothness, then nudges toward Fux's preferences. */
function lineCost(line, cantus, jv) {
  let cost = 0;
  for (let k = 1; k < line.length; k += 1) {
    const from = { voiceI: line[k - 1], voiceII: cantus[k - 1] };
    const to = { voiceI: line[k], voiceII: cantus[k] };
    cost += leapCost(line[k - 1], line[k]) + moveCost(from, to);
  }
  const last = line.length - 1;
  if (!isPerfect(line[last] + jv - cantus[last])) cost += 2;
  if (!isPerfect(line[0] - cantus[0])) cost += IMPERFECT_OPENING;
  cost += line.filter((note, k) => note - cantus[k] > WIDE).length;
  return cost;
}

/** Every legal voice I line over one cantus, found by trying each note in turn. */
function legalLines(cantus, jv) {
  const lines = [];
  const extend = (line) => {
    const k = line.length;
    if (k === cantus.length) {
      if (goodClose(line, cantus)) lines.push(line);
      return;
    }
    for (const note of candidates(cantus, k, jv)) {
      if (k > 0) {
        const from = { voiceI: line[k - 1], voiceII: cantus[k - 1] };
        const to = { voiceI: note, voiceII: cantus[k] };
        if (!goodMelody(line[k - 1], note, jv) || !moveSurvivesShift(from, to, jv)) continue;
      }
      extend([...line, note]);
    }
  };
  extend([]);
  return lines;
}

/**
 * The smoothest four-bar example for a shift, or null if none of the canti
 * allows one. Returns { cantus, m, n, original, derivative }, where original
 * and derivative are lists of { voiceI, voiceII } dyads.
 */
export function firstSpeciesExample(jv) {
  let best = null;
  for (const cantus of CANTI) {
    for (const line of legalLines(cantus, jv)) {
      const cost = lineCost(line, cantus, jv);
      if (!best || cost < best.cost) best = { cost, cantus, line };
    }
  }
  if (!best) return null;
  const { cantus, line } = best;
  return {
    cantus,
    m: line.map((note, k) => note - cantus[k]),
    n: line.map((note, k) => note + jv - cantus[k]),
    original: line.map((note, k) => ({ voiceI: note, voiceII: cantus[k] })),
    derivative: line.map((note, k) => ({ voiceI: note + jv, voiceII: cantus[k] })),
  };
}
