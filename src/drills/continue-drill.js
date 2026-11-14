// Sets up a Continue the proposta drill from one of Cho's notebook canons:
// which bars of the proposta are given, and which notes are yours to write.
// Reading and slicing only; the checks are in src/taneyev/canon-continue.js.
//
// `canon` is an example's canon field (notebook/examples.js): lead P, follow
// R, `entry` in steps (zero-indexed, negative when R is below) and `delay` in
// bars. Only the first span is drilled: its last bar is where the strict
// canon stops. Times are in whole notes, one bar of 4/4 each.

import { readVoices, keySignature } from '../notation/abc-read.js';
import { continuationSlots, SLOT } from '../taneyev/canon-continue.js';

const EPS = 1e-9;

/** A voice's bars as one list of notes with start times: [{ start, length, step, semitones, tie }]. */
export function timeline(bars) {
  const notes = [];
  let start = 0;
  for (const note of bars.flat()) {
    notes.push({ ...note, start });
    start += note.length;
  }
  return notes;
}

/** Notes of a timeline that start in [from, to). */
const startingIn = (notes, from, to) => notes.filter((note) => note.start >= from - EPS && note.start < to - EPS);

/** The average step of a voice's notes in [from, to), rests left out. */
function averageStep(notes, from, to) {
  const steps = startingIn(notes, from, to).map((note) => note.step).filter((step) => step !== null);
  return steps.reduce((sum, step) => sum + step, 0) / steps.length;
}

/**
 * Which side of each voice the proposta keeps: +1 above, −1 below, 0 either
 * (R at the unison). R's side comes from the interval of entrance; the CF's
 * from where the notebook's proposta sits on average.
 */
function sidesOf(proposta, cantus, entry, from, to) {
  const sides = { R: -Math.sign(entry) };
  if (cantus) sides.CF = Math.sign(averageStep(proposta, from, to) - averageStep(cantus, from, to));
  return sides;
}

/** How many bars of the proposta may be given: from the delay (R has just come in) to two bars before the span ends. */
export function givenChoices(canon) {
  const [first, last] = canon.spans[0];
  const choices = [];
  for (let given = canon.delay; first - 1 + given <= last - 2; given += 1) choices.push(given);
  return choices;
}

/**
 * The drill for one example with `given` bars of the proposta shown:
 * { key, entry, delay, begin, start, end, given, slots, rispostaGiven, after,
 * cantus, sides, original }. `slots` are the continuation's notes
 * (continuationSlots); `after` the notebook's P and R in the bar after the
 * canon, which the last notes lead into; `original` the notebook's own steps
 * for the notes you write, to compare at the end.
 */
export function drillFrom(abc, canon, given) {
  const voices = readVoices(abc);
  const proposta = timeline(voices[canon.lead]);
  const cantus = voices.CF ? timeline(voices.CF) : null;
  const [first, last] = canon.spans[0];
  const begin = first - 1;
  const start = begin + given;
  const end = last;
  const slots = continuationSlots(startingIn(proposta, start, end));
  const risposta = timeline(voices[canon.follow]);
  return {
    key: keySignature(abc),
    entry: canon.entry,
    delay: canon.delay,
    begin,
    start,
    end,
    given: startingIn(proposta, 0, start),
    slots,
    rispostaGiven: risposta,
    after: {
      P: startingIn(proposta, end, end + 1),
      R: startingIn(risposta, end + canon.delay, end + canon.delay + 1),
    },
    cantus: cantus && startingIn(cantus, 0, end + canon.delay),
    sides: sidesOf(proposta, cantus, canon.entry, begin, end),
    original: slots.filter((note) => note.slot === 'write').map((note) => note.step),
  };
}

/** Note lengths you may choose in your own rhythm, in whole notes: whole to 16th, plain and dotted. */
export const LENGTHS = [1, 0.75, 0.5, 0.375, 0.25, 0.1875, 0.125, 0.0625];

/** Where your own rhythm has got to: the end of the last entry, from the drill's start. */
export const reached = (drill, entries) => entries.reduce((at, entry) => at + entry.length, drill.start);

/** Whole notes left to fill before the strict canon ends. */
export const roomLeft = (drill, entries) => drill.end - reached(drill, entries);

/**
 * One entry of your own rhythm as continuation notes from `start`: a rest,
 * or a note you write, cut at each bar line into a written note and held
 * (tied) notes, as the notebook would write it.
 */
function entrySlots(entry, start) {
  const slots = [];
  let at = start;
  const end = start + entry.length;
  while (at < end - EPS) {
    const until = Math.min(end, Math.floor(at + EPS) + 1);
    const first = slots.length === 0;
    const slot = entry.played === null ? SLOT.REST : (first ? SLOT.WRITE : SLOT.HELD);
    slots.push({ start: at, length: until - at, step: null, semitones: null, tie: entry.played !== null && until < end - EPS, slot });
    at = until;
  }
  return slots;
}

/**
 * The drill in your own rhythm: `entries` are what you wrote, each
 * { length, played } (played null for a rest; otherwise as writtenNotes takes
 * it). Returns { drill, steps }: the drill with its slots replaced by your
 * rhythm, open while bars are left to fill, and the played notes in order,
 * ready for the checks in canon-continue.js.
 */
export function inOwnRhythm(drill, entries) {
  const slots = [];
  let at = drill.start;
  for (const entry of entries) {
    slots.push(...entrySlots(entry, at));
    at += entry.length;
  }
  const steps = entries.filter((entry) => entry.played !== null).map((entry) => entry.played);
  return { drill: { ...drill, slots, open: at < drill.end - EPS }, steps };
}
