// Continue the proposta: checks the notes you add to the opening of a florid
// canon, one at a time. Rules core for drills/continue.js.
//
// A drill is the opening of one of Cho's notebook canons: the proposta's
// first bars are given, and you write the rest of the strict canon in the
// notebook's own rhythm. Every note you add has two jobs (IC p. 13: "the
// melodic interval must follow the rules @ distance of two measures"):
//
//   now      it sounds against the risposta already fixed under it (a copy of
//            the proposta one delay ago) and against the CF, if there is one;
//   later    one delay on, the risposta copies it, moved by the interval of
//            entrance, and the copy sounds against the CF there.
//
// So each note is checked in two windows: its own, against R and CF, and its
// copy's, against the CF only. (What the proposta plays against that copy is
// checked when you write it.) The checks are the florid ones the Notebook
// page uses: florid.js for dissonance (passing, neighbor and suspension are
// fine; anything else is not), parallels.js for consecutive perfects, plus the
// melodic leaps and the voices keeping their sides.
//
// A dissonance on your newest note may still turn out to pass or resolve, so
// until the next note is written it is "pending", not a mistake.
//
// Times are in whole notes (a bar of 4/4 is 1). Steps are diatonic (C4 = 28);
// intervals are zero-indexed (unison 0, 2nd 1, 5th 4, octave 7, 12th 11), as
// everywhere in this project. `key` is a signature from abc-read.js.

import { semitonesInKey } from '../common/diatonic.js';
import { intervalName, simple } from './rules.js';
import { dissonances, isAltered, isStrongBeat, KIND } from './florid.js';
import { parallels } from './parallels.js';

const EPS = 1e-9;

/** The voices of a drill: proposta, risposta, cantus firmus. */
export const VOICE = { P: 'P', R: 'R', CF: 'CF' };

/**
 * Melodic leaps the proposta may make, by simple size in steps: repeat, 2nd,
 * 3rd, 4th, 5th, 6th and the octave; never a 7th, a leap past the octave, or
 * an augmented or diminished interval (Fux, first species; Taneyev's
 * examples).
 */
const ALLOWED_LEAPS = [0, 1, 2, 3, 4, 5, 7];

/** What one note of the proposta's continuation is: a note you write, a held (tied) note, or a rest. */
export const SLOT = { WRITE: 'write', HELD: 'held', REST: 'rest' };

/**
 * `note` moved to `step`, spelled in the key: { ...note, step, semitones }.
 * When the step is the one the notebook wrote there, the notebook's own
 * spelling is kept, so its ficta (a B♮ or C♯ outside the key) still count.
 */
function pitched(note, step, key) {
  if (step === null) return { ...note, step, semitones: null };
  const semitones = step === note.step ? note.semitones : semitonesInKey(step, key);
  return { ...note, step, semitones };
}

/**
 * The continuation's notes in order, each marked SLOT.WRITE, SLOT.HELD (tied
 * from the note before, so it keeps that pitch) or SLOT.REST.
 */
export function continuationSlots(notes) {
  return notes.map((note, k) => {
    const before = notes[k - 1];
    if (note.step === null) return { ...note, slot: SLOT.REST };
    if (before?.tie && before.step === note.step) return { ...note, slot: SLOT.HELD };
    return { ...note, slot: SLOT.WRITE };
  });
}

/** The proposta's continuation with your notes in it, up to the last one you wrote. */
export function writtenNotes(drill, steps) {
  const notes = [];
  let written = 0;
  for (const note of drill.slots) {
    if (note.slot === SLOT.WRITE) {
      if (written >= steps.length) break;
      notes.push(pitched(note, steps[written], drill.key));
      written += 1;
    } else if (note.slot === SLOT.HELD) {
      const tiedFrom = notes.at(-1);
      notes.push({ ...note, step: tiedFrom.step, semitones: tiedFrom.semitones });
    } else {
      notes.push(pitched(note, null, drill.key));
    }
  }
  return notes;
}

/** How many notes of the continuation are yours to write. */
export const countWrite = (drill) => drill.slots.filter((note) => note.slot === SLOT.WRITE).length;

/** The note of `voice` that starts at time t, or a rest of `length` there when it has none. */
function noteStartingAt(voice, t, length) {
  return voice.find((note) => Math.abs(note.start - t) < EPS) ?? { start: t, length, step: null, semitones: null, tie: false };
}

/**
 * The risposta's copy of proposta notes: `delay` whole notes later, `entry`
 * steps away, spelled in the key, or as the notebook's R spells it where the
 * copy lands on the note written there (`rispostaGiven`).
 */
export function rispostaCopy(notes, { entry, delay, key, rispostaGiven = [] }) {
  return notes.map((note) => {
    const start = note.start + delay;
    const written = { ...noteStartingAt(rispostaGiven, start, note.length), length: note.length, tie: note.tie };
    return pitched(written, note.step === null ? null : note.step + entry, key);
  });
}

/**
 * The canon's voices with your notes in: P is the given opening and what you
 * wrote; R is the notebook's risposta up to where it copies the opening, then
 * the copy of your notes; CF is the cantus as written.
 */
export function canonVoices(drill, steps) {
  const written = writtenNotes(drill, steps);
  const copiesFrom = drill.start + drill.delay;
  const voices = {
    [VOICE.P]: [...drill.given, ...written],
    [VOICE.R]: [...drill.rispostaGiven.filter((note) => note.start < copiesFrom - EPS), ...rispostaCopy(written, drill)],
  };
  if (drill.cantus) voices[VOICE.CF] = drill.cantus;
  return voices;
}

/**
 * The voices as checked: canonVoices, and once every note is written, the
 * notebook's bar after the canon (`drill.after`) added to P and R, so the
 * last notes can be heard passing or resolving into it.
 */
export function voicesWith(drill, steps) {
  const voices = canonVoices(drill, steps);
  if (steps.length < countWrite(drill)) return voices;
  return { ...voices, [VOICE.P]: [...voices.P, ...drill.after.P], [VOICE.R]: [...voices.R, ...drill.after.R] };
}

/** The start of the k-th note you write, and where its tied notes end: { start, end }. */
export function writeWindow(drill, k) {
  const writes = drill.slots.map((note, index) => ({ note, index })).filter(({ note }) => note.slot === SLOT.WRITE);
  const { note, index } = writes[k];
  let end = note.start + note.length;
  for (let next = index + 1; drill.slots[next]?.slot === SLOT.HELD; next += 1) {
    end = drill.slots[next].start + drill.slots[next].length;
  }
  return { start: note.start, end };
}

/** Is time t in [from, to)? */
const within = (t, from, to) => t >= from - EPS && t < to - EPS;

/** Is a found problem (dissonance or parallel, with `start` and `voices`) one that the k-th note you write is part of? */
function involves(found, drill, window) {
  const inOwn = within(found.start, window.start, window.end) && found.voices.includes(VOICE.P);
  const copyFrom = window.start + drill.delay;
  const inCopy = within(found.start, copyFrom, window.end + drill.delay)
    && found.voices.includes(VOICE.R) && found.voices.includes(VOICE.CF);
  return inOwn || inCopy;
}

/** A pair of voices in words, e.g. "P and R" (the R in the copy's window is your note's copy). */
const pairName = ([a, b]) => `${a} and ${b}`;

/** The problem in words for one dissonance that is not passing, neighbor or suspension. */
function dissonanceText(found) {
  if (found.tritone) return `tritone between ${pairName(found.voices)}`;
  return `${intervalName(simple(found.steps))} between ${pairName(found.voices)}, not passing or resolving`;
}

/** A perfect consonance by its simple name: "unison", "octave" or "5th". */
function perfectName(steps) {
  if (steps === 0) return 'unison';
  return simple(steps) === 0 ? 'octave' : '5th';
}

/** The leap from the proposta's note before to this one, as a problem in words, or null. (ALLOWED_LEAPS) */
export function leapProblem(before, note) {
  if (!before || before.step === null) return null;
  const [lower, upper] = before.step <= note.step ? [before, note] : [note, before];
  const leap = upper.step - lower.step;
  if (leap > 7 || !ALLOWED_LEAPS.includes(leap)) return `P leaps a ${intervalName(leap)}`;
  if (leap > 0 && isAltered(lower, upper)) return leap === 3 || leap === 4 ? 'P leaps a tritone' : `P leaps an altered ${intervalName(leap)}`;
  return null;
}

/** Notes of a voice that sound at some time in [from, to). */
const soundingIn = (voice, from, to) => voice.filter((note) => note.step !== null
  && note.start < to - EPS && note.start + note.length > from + EPS);

/**
 * Has the proposta crossed to the wrong side of a voice: below it when it
 * should be above (side +1), or above it when it should be below (side −1)?
 * A unison is not a crossing. Side 0 (the unison canon) never crosses.
 */
function crosses(note, others, side) {
  if (side === 0) return false;
  return others.some((other) => Math.sign(note.step - other.step) === -side);
}

/** Crossings by the note at `window` against R and the CF, in words (SEVERITY.CHECK). */
function sideProblems(drill, voices, note, window) {
  const problems = [];
  const rispostaNow = soundingIn(voices[VOICE.R], window.start, window.end);
  if (crosses(note, rispostaNow, drill.sides.R)) problems.push('P crosses R');
  if (drill.cantus && crosses(note, soundingIn(drill.cantus, window.start, window.end), drill.sides.CF)) {
    problems.push('P crosses the CF');
  }
  return problems;
}

/**
 * How serious a problem is. MISS: against the rules wherever it falls
 * (consecutive perfects, a forbidden leap, a dissonance on beat 1 or 3 that is
 * not a suspension). CHECK: worth a second look, as the Notebook page marks
 * them: a weak-beat dissonance that is not passing or neighbor (it may be a
 * figure the strict rules leave out, such as an escape tone), or the voices
 * crossing for a moment.
 */
export const SEVERITY = { MISS: 'miss', CHECK: 'check' };

/**
 * Checks the k-th note you write (counted from 0), given every note written
 * so far. Returns { misses, checks, pending }, each a list of problems in
 * words (SEVERITY); `pending` holds dissonances on your newest note that may
 * still pass or resolve, which wait for your next note.
 */
export function checkNote(drill, steps, k) {
  const voices = voicesWith(drill, steps);
  const window = writeWindow(drill, k);
  const proposta = voices[VOICE.P];
  const index = proposta.findIndex((note) => Math.abs(note.start - window.start) < EPS);
  const note = proposta[index];
  const before = proposta.slice(0, index).findLast((other) => other.step !== null);
  const isNewest = k === steps.length - 1 && k < countWrite(drill) - 1;
  const result = { misses: [], checks: sideProblems(drill, voices, note, window), pending: [] };
  const leap = leapProblem(before, note);
  if (leap) result.misses.push(leap);
  for (const found of dissonances(voices)) {
    if (found.kind !== KIND.CHECK || !involves(found, drill, window)) continue;
    if (isNewest && !found.tritone) result.pending.push(dissonanceText(found));
    else if (isStrongBeat(found.start)) result.misses.push(dissonanceText(found));
    else result.checks.push(dissonanceText(found));
  }
  for (const found of parallels(voices)) {
    if (involves(found, drill, window)) result.misses.push(`consecutive ${perfectName(found.steps)}s between ${pairName(found.voices)}`);
  }
  return result;
}

/** Every note you wrote, checked: [{ misses, checks, pending }], one per note. */
export const checkAll = (drill, steps) => steps.map((_, k) => checkNote(drill, steps, k));

/** The worst severity in a checked note: SEVERITY.MISS, SEVERITY.CHECK, 'pending' or null when it is clean. */
export function worstOf({ misses, checks, pending }) {
  if (misses.length) return SEVERITY.MISS;
  if (checks.length) return SEVERITY.CHECK;
  return pending.length ? 'pending' : null;
}
