// The notebook page's scores: an example's abc as drawn, with the imaginary
// cantus added as its own staff. The file's own abc is what is heard. No DOM here, so
// the tests can use it too. The imaginary cantus itself comes from the rules
// core, src/taneyev/imaginary-cantus.js.
// Intervals are zero-indexed (5th 4, octave 7, 12th 11).

import { readVoices, unitLength, withVoice } from '../src/notation/abc-read.js';
import { abcPitch } from '../src/notation/abc.js';
import { clefsForVoice } from '../src/notation/clefs.js';
import { imaginaryCantus } from '../src/taneyev/imaginary-cantus.js';
import { dissonances, worthShowing } from '../src/taneyev/florid.js';

/** The id and staff name of the imaginary cantus voice. */
export const ICF = { id: 'ICF', name: 'I.C.F.' };

/** The first pitch a bar sounds, or null for a bar of rests. */
const firstStep = (bar) => bar.find((note) => note.step !== null)?.step ?? null;

/**
 * The delay in force at bar `bar` (counted from 0): that of the span holding
 * it, or of the last span before it (a cadence or free passage keeps the
 * delay of the canon it ends), or else of the first span.
 */
export function delayAt(canon, bar) {
  const started = canon.spans.filter(([first]) => first <= bar + 1);
  const span = started.at(-1) ?? canon.spans[0];
  return span[2] ?? canon.delay;
}

/**
 * The imaginary cantus, one whole note per bar: the cantus moved against the
 * canon (`entry` steps the other way, one delay earlier, with the delay in
 * force at that bar). A bar where the proposta is silent, or past the
 * cantus's end, gets null.
 */
export function imaginaryBars(abc, canon) {
  const voices = readVoices(abc);
  const cantus = voices.CF.map(firstStep);
  return cantus.map((_, bar) => {
    const proposta = voices[canon.lead][bar];
    if (!proposta || firstStep(proposta) === null) return null;
    return imaginaryCantus(cantus, canon.entry, delayAt(canon, bar))[bar];
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

/** Each voice of an abc tune as one list of notes with start times, as florid.js reads them. */
export function timelines(abc) {
  const voices = readVoices(abc);
  return Object.fromEntries(Object.entries(voices).map(([id, bars]) => {
    let start = 0;
    const notes = bars.flat().map((note) => {
      const timed = { ...note, start };
      start += note.length;
      return timed;
    });
    return [id, notes];
  }));
}

/** The dissonances to list under an example: every one on a strong beat, and any to check on a weak beat. */
export const dissonancesOf = (abc) => worthShowing(dissonances(timelines(abc)));
