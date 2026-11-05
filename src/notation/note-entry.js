// Keyboard note entry in the style of MuseScore: type a letter name to write
// that note in the nearest octave, move it by step or octave with the arrow
// keys, move the cursor with left and right. Pure functions, no DOM and no
// theory, so they run in Node for the tests.
// Pitches are diatonic steps (C4 = 28; see src/common/diatonic.js).

import { letterOf } from '../common/diatonic.js';

/**
 * The step with this letter name (A–G) nearest to `near`. Every letter turns
 * up once within three steps either way, so the answer is never a tie:
 * after D4, typing F gives F4 (up a 3rd) and typing A gives A3 (down a 4th).
 */
export function nearestWithLetter(letter, near) {
  for (let distance = 0; distance <= 3; distance += 1) {
    if (letterOf(near + distance) === letter) return near + distance;
    if (letterOf(near - distance) === letter) return near - distance;
  }
  return null;
}

/** What each key does. `by` is in steps for STEP and in bars for MOVE. */
export const COMMAND = { LETTER: 'letter', STEP: 'step', MOVE: 'move', ERASE: 'erase', SWITCH: 'switch' };

/**
 * The command for a key press, or null for keys the score doesn't use.
 * `press` is { key, ctrlKey, metaKey, altKey } as on a KeyboardEvent.
 * Ctrl (or Cmd on a Mac) with up or down moves by an octave, as in MuseScore;
 * Alt with up or down switches to the other staff being written. Tab is left
 * alone so the keyboard can still leave the score.
 */
export function keyCommand({ key, ctrlKey = false, metaKey = false, altKey = false }) {
  const octave = ctrlKey || metaKey;
  if (/^[a-gA-G]$/.test(key) && !octave && !altKey) return { type: COMMAND.LETTER, letter: key.toUpperCase() };
  if (altKey && (key === 'ArrowUp' || key === 'ArrowDown')) return { type: COMMAND.SWITCH };
  if (key === 'ArrowUp') return { type: COMMAND.STEP, by: octave ? 7 : 1 };
  if (key === 'ArrowDown') return { type: COMMAND.STEP, by: octave ? -7 : -1 };
  if (key === 'ArrowRight') return { type: COMMAND.MOVE, by: 1 };
  if (key === 'ArrowLeft') return { type: COMMAND.MOVE, by: -1 };
  if (key === 'Backspace' || key === 'Delete') return { type: COMMAND.ERASE };
  return null;
}
