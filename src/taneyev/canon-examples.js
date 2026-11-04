// Generated two-voice canons in first species, one per interval of entrance.
//
// Each example is BARS whole notes long. The proposta starts alone; the
// risposta enters one bar later, moved by the interval of entrance, and is
// cut off at the last bar. Intervals are zero-indexed (octave 7).
//
// The examples are found by search, not written by hand: every proposta of
// BARS notes is tried, the ones that break a rule are thrown out, and the
// smoothest of the rest is kept. All the rules come from canon.js.

import { checkProposta, VERDICT } from './canon.js';
import { isPerfect, isConsonant } from './rules.js';
import { isTritone, parsePitch } from '../common/diatonic.js';

/** Intervals of entrance in the same order as the consonance charts page. */
export const EXAMPLE_ENTRIES = [0, -7, -14, -11, -9, -4, -2, 3, 5, -12, -13];

/** Length of each example in bars (whole notes). */
export const BARS = 4;

/** Distance of entrance in bars. */
const DELAY = 1;

/** Melodic moves the proposta may make, steps first so ties favour them. */
const MOVES = [1, -1, 2, -2, 3, -3, 4, -4];

/**
 * Repeated notes are tried only when no canon exists without them. Some
 * canons need them, such as the 3rd below, where every other consonant move
 * rises.
 */
const MOVES_WITH_REPEATS = [...MOVES, 0];

/**
 * First note of the proposta: D, as in Fux's Dorian examples. D4 by default;
 * D5 when the risposta enters a 6th or more below, D3 when it enters an octave
 * or more above, so both voices stay in singing range.
 */
function startNote(entry) {
  if (entry <= -5) return parsePitch('D5');
  if (entry >= 7) return parsePitch('D3');
  return parsePitch('D4');
}

/** How far the proposta may wander from its first note, in steps (a 5th). */
const RANGE = 4;

/** Every proposta of BARS notes from a start note within RANGE, as arrays of steps. */
function allPropostas(start, moves) {
  let lines = [[start]];
  for (let bar = 1; bar < BARS; bar += 1) {
    lines = lines.flatMap((line) => moves.map((move) => [...line, line.at(-1) + move]));
  }
  return lines.filter((line) => line.every((step) => Math.abs(step - start) <= RANGE));
}

/** The risposta's note in each bar, or null while it has not entered. */
function rispostaOf(proposta, entry) {
  return proposta.map((_, bar) => (bar < DELAY ? null : proposta[bar - DELAY] + entry));
}

/** Does the risposta stay on its own side of the proposta? (At the unison it can't.) */
function keepsSide(n, entry) {
  if (entry === 0) return true;
  return n !== 0 && Math.sign(n) === Math.sign(entry);
}

/** Is a proposta usable as a first-species canon at this interval of entrance? */
function isValid(proposta, entry) {
  const melodicTritone = proposta.slice(1).some((step, k) => isTritone(step, proposta[k]));
  if (melodicTritone) return false;
  const risposta = rispostaOf(proposta, entry);
  return checkProposta(proposta, entry, DELAY).every((r) => r.verdict !== VERDICT.SUSPENSION
    && !r.consecutive && !r.similar && keepsSide(r.n, entry)
    && !isTritone(proposta[r.index], risposta[r.index]));
}

/** Cost of one melodic move: steps are cheap, larger leaps cost more. */
const MOVE_COST = { 0: 3, 1: 1, 2: 2, 3: 4, 4: 5 }; // 0 is a repeated note

/** Extra cost for melodic habits Fux avoids in a short line. */
function contourPenalty(proposta) {
  let penalty = 0;
  for (let k = 2; k < proposta.length; k += 1) {
    const before = proposta[k - 1] - proposta[k - 2];
    const after = proposta[k] - proposta[k - 1];
    if (proposta[k] === proposta[k - 2]) penalty += 2; // back-and-forth, like D C D
    if (Math.abs(before) > 1 && Math.abs(after) > 1 && Math.sign(before) === Math.sign(after)) penalty += 3; // two leaps the same way
  }
  return penalty;
}

/** Extra cost when the same interval sounds three times running. */
function sameIntervalPenalty(results) {
  let penalty = 0;
  for (let k = 2; k < results.length; k += 1) {
    if (results[k].n === results[k - 1].n && results[k].n === results[k - 2].n) penalty += 3;
  }
  return penalty;
}

/**
 * Lower is better: the cost of the moves and the contour, plus a penalty when
 * the canon does not begin and end on a perfect consonance as Fux asks.
 */
function roughness(proposta, entry) {
  const results = checkProposta(proposta, entry, DELAY);
  const moves = proposta.slice(1).reduce((sum, step, k) => sum + MOVE_COST[Math.abs(step - proposta[k])], 0);
  const perfect = (n) => isConsonant(n) && isPerfect(n);
  const edges = (perfect(results[0].n) ? 0 : 3) + (perfect(results.at(-1).n) ? 0 : 3);
  return moves + contourPenalty(proposta) + sameIntervalPenalty(results) + edges;
}

/** The smoothest valid proposta using the given moves, or null if none. */
function smoothest(entry, moves) {
  let best = null;
  let bestScore = Infinity;
  for (const proposta of allPropostas(startNote(entry), moves)) {
    if (!isValid(proposta, entry)) continue;
    const score = roughness(proposta, entry);
    if (score < bestScore) {
      best = proposta;
      bestScore = score;
    }
  }
  return best;
}

/**
 * The smoothest valid canon for one interval of entrance, or null if none.
 * Returns { entry, proposta: [steps], risposta: [steps or null], intervals: [n or null] }.
 */
export function canonExample(entry) {
  const proposta = smoothest(entry, MOVES) ?? smoothest(entry, MOVES_WITH_REPEATS);
  if (!proposta) return null;
  const risposta = rispostaOf(proposta, entry);
  const intervals = proposta.map((step, bar) => (risposta[bar] === null ? null : risposta[bar] - step));
  return { entry, proposta, risposta, intervals };
}

/**
 * The canon at one interval both ways round: first with the proposta in the
 * upper voice (risposta below), then in the lower voice (risposta above), so
 * each voice takes a turn leading. At the unison there is only one way.
 * Returns a list of canonExample results (null where none exists).
 */
export function examplesBothWays(entry) {
  const size = Math.abs(entry);
  if (size === 0) return [canonExample(0)];
  return [canonExample(-size), canonExample(size)];
}
