// Consecutive perfect intervals between two florid voices: parallel unisons,
// octaves and 5ths (simple or compound) from one attack to the next while
// both voices move. The rule is Fux's, as in src/taneyev/motion.js
// (isForbiddenMove): a perfect consonance may not follow another of the same
// size when both voices move, even in contrary motion. Here it is applied to
// the notebook's florid lines (timelines from notebook/score.js), every time a
// note starts in either voice. Steps are zero-indexed: 0 unison, 4 5th, 7 octave.

import { isPerfect } from './rules.js';

const EPS = 1e-9;

/** The note of a voice sounding at time t, or null for a rest or before it starts. */
function soundingAt(voice, t) {
  const note = voice.find((n) => t >= n.start - EPS && t < n.start + n.length - EPS);
  return note && note.step !== null ? note : null;
}

/** Is the interval between two notes a true perfect one: a unison, octave or 5th in both steps and semitones? */
function truePerfect(lower, upper) {
  const steps = upper.step - lower.step;
  const semitones = ((upper.semitones - lower.semitones) % 12 + 12) % 12;
  if (!isPerfect(steps)) return false;
  return steps % 7 === 0 ? semitones === 0 : semitones === 7;
}

/** Every time a note starts in either of two voices, in order. */
function attacks(a, b) {
  const times = new Set([...a, ...b].filter((n) => n.step !== null).map((n) => n.start));
  return [...times].sort((x, y) => x - y);
}

/** The pair of notes two voices sound at time t, lower first, or null if either rests. */
function dyadAt(a, b, t) {
  const x = soundingAt(a, t);
  const y = soundingAt(b, t);
  if (!x || !y) return null;
  return x.step <= y.step ? { lower: x, upper: y } : { lower: y, upper: x };
}

/**
 * Parallel perfect intervals between voices `a` and `b` (timelines):
 * [{ start, steps }], `start` the time of the second interval in whole notes
 * and `steps` its size (7 for an octave, 11 for a 12th).
 */
export function parallelsBetween(a, b) {
  const found = [];
  let previous = null;
  for (const t of attacks(a, b)) {
    const dyad = dyadAt(a, b, t);
    if (previous && dyad) {
      const bothMove = dyad.lower.step !== previous.lower.step && dyad.upper.step !== previous.upper.step;
      const steps = dyad.upper.step - dyad.lower.step;
      const before = previous.upper.step - previous.lower.step;
      const same = steps % 7 === before % 7;
      if (bothMove && same && truePerfect(dyad.lower, dyad.upper) && truePerfect(previous.lower, previous.upper)) {
        found.push({ start: t, steps });
      }
    }
    previous = dyad;
  }
  return found;
}

/** Parallel perfect intervals between every pair of voices: [{ start, steps, voices: [upper, lower] }]. */
export function parallels(voices) {
  const ids = Object.keys(voices);
  const found = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      for (const p of parallelsBetween(voices[ids[i]], voices[ids[j]])) found.push({ ...p, voices: [ids[i], ids[j]] });
    }
  }
  return found.sort((x, y) => x.start - y.start);
}
