// Canon over a cantus firmus: checks a proposta bar by bar, in whole notes.
//
// Every check returns a list of problems in words (empty when the bar is
// fine), so the page can show them and the search in canon-over-cantus.js can
// throw out any bar that has one. A proposta may have empty bars (null) while
// it is being written; those bars, and the risposta notes copied from them,
// are skipped.
//
// Intervals are zero-indexed (unison 0, 4th 3, 5th 4, octave 7, 10th 9).
// Pitches are diatonic steps (common/diatonic.js).
//
// Sources: two-voice rules from rules.js and canon.js (Fux, first species);
// the 4th between upper voices from three-voices.js (video 4, 10:23); hidden
// perfects only between the outer voices (Fux, three-voice first species).

import { isTritone } from '../common/diatonic.js';
import { intervalName, simple } from './rules.js';
import { consecutivePerfects, similarIntoPerfect } from './canon.js';
import { isChordConsonance } from './three-voices.js';
import { LABEL, VOICE } from './canon-voices.js';

/** Melodic moves the proposta may make, in steps: repeat, 2nd–5th, octave (Fux). */
export const ALLOWED_MOVES = [0, 1, 2, 3, 4, 7];

/**
 * Widest gap between two neighboring voices of the order: a 10th (9). Wider
 * spacing sounds thin and is what pushes a voice onto ledger lines.
 */
export const WIDEST_SPACING = 9;

/** The three voices of bar k: { risposta, cantus, proposta }, null where silent. */
export function chordAt(proposta, { cantus, entry, delay }, bar) {
  const copied = proposta[bar - delay];
  const isCopied = copied !== undefined && copied !== null;
  return {
    risposta: isCopied ? copied + entry : null,
    cantus: cantus[bar],
    proposta: proposta[bar] ?? null,
  };
}

/** Every pair of voices that both sound in a chord, as [name, name]. */
function soundingPairs(chord) {
  const names = Object.values(VOICE).filter((name) => chord[name] !== null);
  const pairs = [];
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) pairs.push([names[i], names[j]]);
  }
  return pairs;
}

/** A pair of voices in words, e.g. "P and CF". */
const pairName = (a, b) => `${LABEL[a]} and ${LABEL[b]}`;

/**
 * Problems with one chord's intervals: every pair consonant, no tritone, no
 * two voices on the same note. A 4th passes between two voices that are both
 * above the lowest-sounding one (isChordConsonance).
 */
export function chordProblems(chord) {
  const sounding = Object.values(chord).filter((step) => step !== null);
  const lowest = Math.min(...sounding);
  const problems = [];
  for (const [a, b] of soundingPairs(chord)) {
    const size = Math.abs(chord[a] - chord[b]);
    const bothAboveLowest = Math.min(chord[a], chord[b]) > lowest;
    if (size === 0) problems.push(`${pairName(a, b)} on the same note`);
    else if (isTritone(chord[a], chord[b])) problems.push(`tritone between ${pairName(a, b)}`);
    else if (!isChordConsonance(size, bothAboveLowest)) problems.push(`${intervalName(size)} between ${pairName(a, b)}`);
  }
  return problems;
}

/**
 * Problems with where the voices sit: each sounding voice must be above the
 * next one down in the chosen order, at most WIDEST_SPACING away. At the
 * unison the proposta and risposta may cross, so that pair is not checked.
 */
export function orderProblems(chord, { order, entry }) {
  const sounding = order.filter((name) => chord[name] !== null);
  const problems = [];
  for (let k = 1; k < sounding.length; k += 1) {
    const upper = sounding[k - 1];
    const lower = sounding[k];
    const isCanonPair = [upper, lower].includes(VOICE.RISPOSTA) && [upper, lower].includes(VOICE.PROPOSTA);
    if (entry === 0 && isCanonPair) continue;
    const gap = chord[upper] - chord[lower];
    if (gap <= 0) problems.push(`${LABEL[upper]} is not above ${LABEL[lower]}`);
    else if (gap > WIDEST_SPACING) problems.push(`${pairName(upper, lower)} more than a 10th apart`);
  }
  return problems;
}

/** The highest- and lowest-sounding voices of a chord, as [name, name]. */
function outerPair(chord) {
  const names = Object.values(VOICE).filter((name) => chord[name] !== null);
  names.sort((a, b) => chord[b] - chord[a]);
  return [names[0], names.at(-1)];
}

/** A perfect consonance by its simple name: "unison", "octave" or "5th". */
function perfectName(interval) {
  if (interval === 0) return 'unison';
  return simple(interval) === 0 ? 'octave' : '5th';
}

/**
 * Problems moving from one chord to the next. For every pair: two perfect
 * consonances of the same size while both voices move (canon.js). For the
 * outer pair only: similar motion into a perfect consonance (a hidden 5th or
 * octave).
 */
export function motionProblems(before, after) {
  const [top, bottom] = outerPair(after);
  const problems = [];
  for (const [a, b] of soundingPairs(after)) {
    if (before[a] === null || before[b] === null) continue;
    const first = before[a] - before[b];
    const second = after[a] - after[b];
    const moveA = after[a] - before[a];
    const moveB = after[b] - before[b];
    const isOuter = [a, b].includes(top) && [a, b].includes(bottom);
    if (consecutivePerfects(first, second, moveA !== 0 && moveB !== 0)) {
      problems.push(`consecutive ${perfectName(second)}s between ${pairName(a, b)}`);
    } else if (isOuter && similarIntoPerfect(moveA, moveB, second)) {
      problems.push(`hidden ${perfectName(second)} between ${pairName(a, b)}`);
    }
  }
  return problems;
}

/** Problems with one melodic move of the proposta (the risposta copies it). */
export function moveProblems(from, to) {
  if (from === null || to === null) return [];
  const leap = Math.abs(to - from);
  if (isTritone(from, to)) return ['P leaps a tritone'];
  if (!ALLOWED_MOVES.includes(leap)) return [`P leaps a ${intervalName(leap)}`];
  return [];
}

/** Every problem in bar k of a canon, or [] when it passes. */
export function barProblems(proposta, setup, bar) {
  const chord = chordAt(proposta, setup, bar);
  const problems = [...chordProblems(chord), ...orderProblems(chord, setup)];
  if (bar > 0) {
    problems.push(...moveProblems(proposta[bar - 1] ?? null, chord.proposta));
    problems.push(...motionProblems(chordAt(proposta, setup, bar - 1), chord));
  }
  return problems;
}

/** The problems in every bar, as a list of lists (one per bar of the cantus). */
export const checkCanon = (proposta, setup) => setup.cantus.map((_, bar) => barProblems(proposta, setup, bar));
