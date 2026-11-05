// Places a generated two-voice example in comfortable singing range.
//
// Both voices move together by whole octaves, so every interval stays exactly
// as it was. Pitches are diatonic steps (src/common/diatonic.js); a voice set
// to null is resting and is ignored.

import { MIDDLE_C } from '../common/diatonic.js';

/** Highest note an example should use: G5, the top of the treble staff. */
export const HIGHEST = MIDDLE_C + 11;

/** Lowest note an example should use: F2, the bottom of the bass staff. */
export const LOWEST = MIDDLE_C - 11;

/** Every pitch the example sounds, skipping rests. */
const pitchesOf = (measures) => measures
  .flatMap((m) => [m.voiceI, m.voiceII])
  .filter((step) => step !== null && step !== undefined);

/** How many steps the pitches stick out of the range after a shift. */
function overshoot(pitches, shift) {
  let total = 0;
  for (const step of pitches) {
    total += Math.max(0, step + shift - HIGHEST) + Math.max(0, LOWEST - (step + shift));
  }
  return total;
}

/** How far the middle of the pitches sits from middle C after a shift. */
function offCenter(pitches, shift) {
  const middle = (Math.min(...pitches) + Math.max(...pitches)) / 2;
  return Math.abs(middle + shift - MIDDLE_C);
}

/**
 * The octave shift (a multiple of 7 steps) that keeps the most of the
 * example between LOWEST and HIGHEST; ties go to the one closest to middle C.
 */
export function vocalShift(measures) {
  return octaveShiftFor(pitchesOf(measures));
}

/** The same octave shift for a plain list of pitches, with any number of voices. */
export function octaveShiftFor(pitches) {
  if (pitches.length === 0) return 0;
  let best = 0;
  for (const shift of [-21, -14, -7, 0, 7, 14, 21]) {
    const better = overshoot(pitches, shift) < overshoot(pitches, best)
      || (overshoot(pitches, shift) === overshoot(pitches, best)
        && offCenter(pitches, shift) < offCenter(pitches, best));
    if (better) best = shift;
  }
  return best;
}

/** Moves both voices by the vocalShift. Returns new measures. */
export function intoVocalRange(measures) {
  const shift = vocalShift(measures);
  const move = (step) => (step === null || step === undefined ? step : step + shift);
  return measures.map((m) => ({ ...m, voiceI: move(m.voiceI), voiceII: move(m.voiceII) }));
}
