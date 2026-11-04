// Diatonic pitch arithmetic in C major, counted in steps.
//
// A pitch is a step number: C4 (middle C) = 28, D4 = 29, ... B4 = 34, C5 = 35.
// Steps line up with Taneyev's zero-indexed intervals: two pitches `i` steps
// apart form interval i (0 = unison, 7 = octave).

export const MIDDLE_C = 28;

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Octave number of a step (C4–B4 is octave 4). */
export const octaveOf = (step) => Math.floor(step / 7);

/** Letter name of a step, e.g. 'E'. */
export const letterOf = (step) => LETTERS[((step % 7) + 7) % 7];

/** Scientific pitch name, e.g. 'E4'. */
export const pitchName = (step) => `${letterOf(step)}${octaveOf(step)}`;

/**
 * Step number of a scientific pitch name such as 'E4' or 'g3' (case ignored).
 * Returns null for anything else. Accidentals are not read: steps are diatonic.
 */
export function parsePitch(name) {
  const match = /^([A-Ga-g])(-?\d)$/.exec(name.trim());
  if (!match) return null;
  const letter = LETTERS.indexOf(match[1].toUpperCase());
  return Number(match[2]) * 7 + letter;
}

/**
 * Do two steps form a tritone in C major? Only F and B do: F up to B is an
 * augmented 4th (size 3), B up to F a diminished 5th (size 4), plus compounds.
 */
export function isTritone(a, b) {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  const size = (high - low) % 7;
  if (letterOf(low) === 'F' && letterOf(high) === 'B') return size === 3;
  if (letterOf(low) === 'B' && letterOf(high) === 'F') return size === 4;
  return false;
}
