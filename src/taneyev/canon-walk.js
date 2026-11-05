// Random two-voice canons in first species, for the Follow the leader drill.
//
// A proposta is built one note at a time, by moves of a 5th or less. Each
// line so far must pass isValidCanon (canon-examples.js): every note
// consonant with the risposta and on its own side of it, no consecutive
// perfects, no similar motion into one, no tritones. It must also not be
// dull (see isDull). A dead end steps back and tries another note.
//
// Intervals are zero-indexed (3rd 2, 5th 4, octave 7); pitches are diatonic
// steps (src/common/diatonic.js). The delay is counted in notes.
//
// This is a prompt for the drill, not a composer: the lines are correct but
// plain. Derived from the rules core, not quoted from Taneyev.

import { isValidCanon } from './canon-examples.js';

/**
 * How likely each melodic move is to be tried first, by size in steps:
 * steps most, then 3rds; repeated notes rarely.
 */
const MOVE_WEIGHT = { 0: 0.3, 1: 4, 2: 2, 3: 1, 4: 1 };

/** Every melodic move the proposta may make, in steps. */
const MOVES = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

/** Tries before giving up on one canon: enough for every interval tested. */
const MAX_TRIES = 5000;

/** The candidate next notes, before shuffling: steps of the proposta. */
const candidates = (last) => MOVES.map((move) => last + move);

/**
 * Is the line's ending too plain for a drill? Taste, not Taneyev:
 *   - the same note three times running;
 *   - two notes rocking back and forth (C D C D);
 *   - the same interval between the voices three times running.
 */
function isDull(line, entry, delay) {
  const [a, b, c, d] = line.slice(-4).reverse(); // a is the newest note
  if (a === b && b === c) return true;
  if (d !== undefined && a === c && b === d) return true;
  const between = (k) => line[k - delay] + entry - line[k];
  const k = line.length - 1;
  if (k - 2 < delay) return false;
  return between(k) === between(k - 1) && between(k - 1) === between(k - 2);
}

/**
 * The candidates in a random order that favors small moves: each is given a
 * random key scaled by its weight, and the largest keys go first.
 */
function shuffled(steps, last, random) {
  return steps
    .map((step) => ({ step, key: random() * MOVE_WEIGHT[Math.abs(step - last)] }))
    .sort((a, b) => b.key - a.key)
    .map((item) => item.step);
}

/** Is a step inside the proposta's range { low, high }? */
const inRange = (step, range) => step >= range.low && step <= range.high;

/**
 * A random proposta of `length` notes starting on `start`, for a canon at
 * `entry` after `delay` notes, staying within `range` ({ low, high } steps).
 * `random` returns numbers in [0, 1), like Math.random (tests pass a seeded one).
 * Returns an array of steps, or null if no canon was found.
 */
export function randomProposta({ start, entry, delay, length, range, random = Math.random }) {
  let tries = 0;
  const line = [start];
  const options = [[]]; // options[k]: the notes still to try at position k + 1
  options[0] = shuffled(candidates(start), start, random);
  while (line.length < length) {
    tries += 1;
    if (tries > MAX_TRIES) return null;
    const untried = options[line.length - 1];
    if (untried.length === 0) {
      if (line.length === 1) return null;
      line.pop(); // dead end: step back
      continue;
    }
    const next = untried.shift();
    const longer = [...line, next];
    if (!inRange(next, range) || isDull(longer, entry, delay) || !isValidCanon(longer, entry, delay)) continue;
    line.push(next);
    options[line.length - 1] = shuffled(candidates(next), next, random);
  }
  return line;
}

/** The risposta for a proposta: each note `delay` notes later, moved by `entry`; null before it enters. */
export function rispostaFor(proposta, entry, delay) {
  return proposta.map((_, k) => (k < delay ? null : proposta[k - delay] + entry));
}
