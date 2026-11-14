// Diatonic pitch arithmetic, counted in steps: C major, and other keys at the end.
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

/** Semitones above C of each letter in C major. */
const SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/** Semitones from C0 to a step, e.g. 48 for middle C. */
export const semitonesOf = (step) => octaveOf(step) * 12 + SEMITONES[((step % 7) + 7) % 7];

/** Is the distance between two steps a tritone (augmented 4th or diminished 5th)? */
export const isTritone = (a, b) => Math.abs(semitonesOf(a) - semitonesOf(b)) % 12 === 6;

// Keys other than C major. A key is the signature from abc-read.js's
// keySignature: semitones per letter, e.g. { B: -1 } for F major. Steps stay
// diatonic; only the sound and the spelling change.

/** Semitones from C0 to a step in a key, e.g. 58 for B4 in F major (B♭). */
export const semitonesInKey = (step, key = {}) => semitonesOf(step) + (key[letterOf(step)] ?? 0);

/** Accidental signs by semitones raised: −1 ♭, +1 ♯. */
const SIGNS = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };

/** A step's letter in a key, with the key's accidental, e.g. 'B♭' in F major. */
export const letterInKey = (step, key = {}) => `${letterOf(step)}${SIGNS[key[letterOf(step)] ?? 0]}`;

/** A step's scientific name in a key, e.g. 'B♭4' in F major. */
export const nameInKey = (step, key = {}) => `${letterInKey(step, key)}${octaveOf(step)}`;

/** The pitch class (0–11) of a semitone count. */
const pitchClass = (semitones) => ((semitones % 12) + 12) % 12;

/**
 * Black keys outside the key, as raised (+1) or lowered (−1) letters: the
 * usual ficta, C♯ E♭ F♯ G♯ B♭ (raised leading tones, lowered B and E).
 */
const FICTA = { 1: 1, 3: -1, 6: 1, 8: 1, 10: -1 };

/**
 * A played pitch (semitones from C0) spelled in a key: { step, semitones }.
 * A note of the key takes its own letter (B♭ in F major); a white key outside
 * the key is a natural (B♮ in F major); a black key outside it is spelled as
 * FICTA says (C♯ in D minor).
 */
export function spellInKey(semitones, key = {}) {
  const octaveBase = Math.floor(semitones / 12) * 7;
  for (let step = octaveBase - 1; step <= octaveBase + 7; step += 1) {
    if (semitonesInKey(step, key) === semitones) return { step, semitones };
  }
  for (let step = octaveBase; step < octaveBase + 7; step += 1) {
    if (semitonesOf(step) === semitones) return { step, semitones };
  }
  const alter = FICTA[pitchClass(semitones)];
  const step = octaveBase + [0, 1, 2, 3, 4, 5, 6].find((k) => semitonesOf(octaveBase + k) === semitones - alter);
  return { step, semitones };
}

/** A spelled note's name, e.g. 'F♯4' for { step: F4, semitones: 54 }. */
export function spelledName({ step, semitones }) {
  const alter = semitones - semitonesOf(step);
  return `${letterOf(step)}${SIGNS[alter] ?? ''}${octaveOf(step)}`;
}
