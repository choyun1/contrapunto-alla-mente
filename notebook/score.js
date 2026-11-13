// The notebook page's scores: an example's abc as drawn, with the imaginary
// cantus added as its own staff. The file's own abc is what is heard. No DOM here, so
// the tests can use it too. The imaginary cantus itself comes from the rules
// core, src/taneyev/imaginary-cantus.js.
// Intervals are zero-indexed (5th 4, octave 7, 12th 11).

import { readVoices, unitLength, withVoice } from '../src/notation/abc-read.js';
import { abcPitch } from '../src/notation/abc.js';
import { clefsForVoice } from '../src/notation/clefs.js';
import { imaginaryCantus } from '../src/taneyev/imaginary-cantus.js';

/** The id and staff name of the imaginary cantus voice. */
export const ICF = { id: 'ICF', name: 'I.C.F.' };

/** The first pitch a bar sounds, or null for a bar of rests. */
const firstStep = (bar) => bar.find((note) => note.step !== null)?.step ?? null;

/**
 * The imaginary cantus, one whole note per bar: the cantus moved against the
 * canon (`entry` steps the other way, `delay` bars earlier). A bar where the
 * proposta is silent, or past the cantus's end, gets null.
 */
export function imaginaryBars(abc, { lead, entry, delay }) {
  const voices = readVoices(abc);
  const cantus = voices.CF.map(firstStep);
  return imaginaryCantus(cantus, entry, delay).map((step, bar) => {
    const proposta = voices[lead][bar];
    return proposta && firstStep(proposta) !== null ? step : null;
  });
}

/** abc music for whole notes, one per bar, with a whole-bar rest for null. */
function wholeNotes(steps, unit) {
  const whole = String(1 / unit);
  return steps.map((step) => (step === null ? `z${whole}` : `${abcPitch(step)}${whole}`)).join(' | ');
}

/** The example as drawn: its abc, plus the imaginary cantus as the bottom staff when asked for. */
export function drawnAbc(abc, example) {
  if (!example.icf) return abc;
  const steps = imaginaryBars(abc, example.canon);
  const sounding = steps.filter((step) => step !== null);
  const clef = clefsForVoice(sounding)[0] ?? 'bass';
  const header = `V:${ICF.id} clef=${clef} name="${ICF.name}"`;
  return withVoice(abc, header, `[V:${ICF.id}] ${wholeNotes(steps, unitLength(abc))} |]`);
}
