// Which note each input means: computer keys and MIDI note numbers, turned
// into diatonic steps (C4 = 28; see src/common/diatonic.js). Pure functions,
// no DOM and no theory, so they run in Node for the tests.
//
// The drills are in C major for now, so only white keys count.

import { parsePitch, semitonesOf } from '../common/diatonic.js';

/**
 * Three rows of the computer keyboard, one octave each, C to B from left to
 * right: the bottom row is the octave below middle C, the home row starts on
 * middle C, the top row on the C above. "i" at the end of the top row is C6.
 */
const ROWS = [
  { keys: 'zxcvbnm', from: 'C3' },
  { keys: 'asdfghj', from: 'C4' },
  { keys: 'qwertyui', from: 'C5' },
];

/** Map of computer key (lower case) to step. */
export const COMPUTER_KEYS = new Map(
  ROWS.flatMap(({ keys, from }) => [...keys].map((key, k) => [key, parsePitch(from) + k])),
);

/** The step a computer key plays, or null. Ignores case. */
export const stepOfKey = (key) => COMPUTER_KEYS.get(key.toLowerCase()) ?? null;

/** Map of step to the computer key that plays it, upper case, for labels on the keys. */
export function keyLabels() {
  return new Map([...COMPUTER_KEYS].map(([key, step]) => [step, key.toUpperCase()]));
}

/** MIDI note number of middle C. MIDI counts semitones; semitonesOf(C4) is 48. */
const MIDI_MIDDLE_C = 60;

/** MIDI note number of a step, e.g. 60 for C4. */
export const midiOfStep = (step) => semitonesOf(step) - semitonesOf(parsePitch('C4')) + MIDI_MIDDLE_C;

/**
 * The step of a MIDI note number, or null for a black key. White keys only,
 * since the drills are in C major.
 */
export function stepOfMidi(note) {
  const fromC4 = note - MIDI_MIDDLE_C;
  const octave = Math.floor(fromC4 / 12);
  const step = parsePitch('C4') + octave * 7;
  for (let letter = 0; letter < 7; letter += 1) {
    if (midiOfStep(step + letter) === note) return step + letter;
  }
  return null;
}
