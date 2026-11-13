// Dissonance in florid (mixed-value) counterpoint: finds every dissonance
// between two voices and says what kind it is. Rules core.
//
// Strict style admits a dissonance in three shapes only (Fux, second to
// fifth species; the rules themselves are in dissonance.js):
//
//   suspension  held over from a consonant preparation, dissonant on a
//               strong beat, then a step down to a consonance;
//   passing     a step in and a step on, the same way;
//   neighbor    a step away and back, on a weak beat only.
//
// Anything else is reported as "check": a dissonance approached or left by
// leap, or an augmented or diminished interval (a tritone above all) that the
// diatonic count alone would call a 4th or 5th.
//
// Beats: the examples are in 4/4 with bars a whole note long. Beat 1 is
// strong and beat 3 is the secondary strong beat; everything else is weak.
// Intervals are zero-indexed diatonic steps, as everywhere in this project
// (unison 0, 2nd 1, 4th 3, 7th 6, 9th 8); the labels such as "9–8" use the
// usual one-based names, because that is how suspensions are named.
//
// A voice is a list of notes { start, length, step, semitones, tie }: start
// and length in whole notes, step diatonic (src/common/diatonic.js) and
// semitones from C0 with accidentals applied (src/notation/abc-read.js).
//
// Sources: Fux, Gradus ad Parnassus, second to fifth species; Taneyev,
// Convertible Counterpoint §§81–82 (suspensions) and dissonance.js here.

import { isConsonant, simple } from './rules.js';
import { isPassingTone, maySuspend, resolutionOf } from './dissonance.js';

/** The semitone sizes each simple interval may have and stay diatonic (2nd 1 or 2, 3rd 3 or 4, ...). */
const SIZES = [[0], [1, 2], [3, 4], [5], [7], [8, 9], [10, 11]];

/** The kinds of dissonance this reports. */
export const KIND = { SUSPENSION: 'suspension', PASSING: 'passing', NEIGHBOR: 'neighbor', CHECK: 'check' };

/** Is time t (in whole notes) on beat 1 or beat 3 of a 4/4 bar? */
export const isStrongBeat = (t) => Math.abs((t * 2) - Math.round(t * 2)) < 1e-9;

/** Is the interval from `lower` to `upper` augmented or diminished: the wrong size in semitones for its steps? */
export function isAltered(lower, upper) {
  const steps = simple(upper.step - lower.step);
  const semitones = (((upper.semitones - lower.semitones) % 12) + 12) % 12;
  return !SIZES[steps].includes(semitones);
}

/**
 * Is the pair dissonant? 2nds, 7ths and altered intervals always; a 4th only
 * against the lowest sounding voice (between upper voices it is consonant,
 * Movable Counterpoint 4, 10:23).
 */
export function isDissonantPair(lower, upper, lowerIsBass) {
  if (isAltered(lower, upper)) return true;
  const steps = simple(upper.step - lower.step);
  if (steps === 3) return lowerIsBass;
  return !isConsonant(steps);
}

/** The note of a voice sounding at time t, with its index, or null. */
function noteAt(voice, t) {
  const index = voice.findIndex((note) => t >= note.start - 1e-9 && t < note.start + note.length - 1e-9);
  return index < 0 || voice[index].step === null ? null : { ...voice[index], index };
}

/** The first note of the tie chain that holds `index`: where a held note was struck. */
function struck(voice, index) {
  let first = index;
  while (first > 0 && voice[first - 1].tie && voice[first - 1].step === voice[first].step) first -= 1;
  return voice[first];
}

/** The note after the tie chain that holds `index`, or undefined. */
function after(voice, index) {
  let last = index;
  while (voice[last]?.tie && voice[last + 1]?.step === voice[last].step) last += 1;
  return voice[last + 1];
}

/** The conventional one-based name of an interval in steps: 9 for a 9th, otherwise 2 to 8 by its simple size. */
function name(steps) {
  if (steps >= 7 && simple(steps) === 1) return 9;
  return simple(steps) === 0 && steps > 0 ? 8 : simple(steps) + 1;
}

/** Is two notes' interval consonant, given which one is the bass? */
const consonant = (a, b, bassIsLower) => {
  const [lower, upper] = a.step <= b.step ? [a, b] : [b, a];
  return !isDissonantPair(lower, upper, bassIsLower);
};

/**
 * Is `held` (in voice `line`, at time t) a suspension against `other`: struck
 * earlier over a consonance, still sounding at t, and then a step down to a
 * consonance? Returns its label, e.g. '9–8', or null. (dissonance.js; §81)
 */
function suspensionLabel(line, held, otherLine, t, bassBelow) {
  const first = struck(line, held.index);
  if (first.start >= t - 1e-9) return null; // struck now: not held over
  const prepared = noteAt(otherLine, first.start);
  if (!prepared || !consonant(first, prepared, bassBelow)) return null;
  const next = after(line, held.index);
  if (!next || next.step !== held.step - 1) return null;
  const against = noteAt(otherLine, next.start);
  if (!against || !consonant(next, against, bassBelow)) return null;
  const now = noteAt(otherLine, t);
  const voice = held.step > now.step ? 'above' : 'below';
  const steps = Math.abs(held.step - now.step);
  if (!maySuspend(steps, 0, voice)) return null; // e.g. a 7th in the lower voice, resolving to an octave (§90)
  return `${name(steps)}–${name(resolutionOf(steps, voice))}`;
}

/** How a struck dissonant note moves: 'passing', 'neighbor' or null. (Fux, second and third species) */
function motionKind(line, note) {
  const before = line[note.index - 1];
  const next = line[note.index + 1];
  if (!before || !next || before.step === null || next.step === null) return null;
  if (isPassingTone(before.step, note.step, next.step)) return KIND.PASSING;
  if (Math.abs(note.step - before.step) === 1 && next.step === before.step) return KIND.NEIGHBOR;
  return null;
}

/** Every time a note starts in any voice, in order. */
function attackTimes(voices) {
  const times = new Set(Object.values(voices).flat().filter((n) => n.step !== null).map((n) => n.start));
  return [...times].sort((a, b) => a - b);
}

/** One dissonance between voices a and b at time t, classified, or null when the pair is consonant. */
function classify(voices, a, b, t, bassId) {
  const x = noteAt(voices[a], t);
  const y = noteAt(voices[b], t);
  if (!x || !y) return null;
  if (x.start < t - 1e-9 && y.start < t - 1e-9) return null; // both held: counted when struck
  const [lowerId, upperId] = x.step <= y.step ? [a, b] : [b, a];
  const lower = lowerId === a ? x : y;
  const upper = lowerId === a ? y : x;
  if (!isDissonantPair(lower, upper, lowerId === bassId)) return null;
  const found = { start: t, voices: [upperId, lowerId], steps: upper.step - lower.step, tritone: isAltered(lower, upper) };
  for (const [id, note, other] of [[a, x, b], [b, y, a]]) {
    const label = suspensionLabel(voices[id], note, voices[other], t, lowerId === bassId);
    if (label) return { ...found, kind: KIND.SUSPENSION, label, suspended: id };
  }
  // a struck note explains the dissonance if it passes or neighbors; when both
  // voices are struck together, either one may be the one that does
  const struckNow = [[a, x], [b, y]].filter(([, note]) => note.start >= t - 1e-9);
  for (const [id, note] of struckNow) {
    const kind = motionKind(voices[id], note);
    const allowed = kind === KIND.PASSING || (kind === KIND.NEIGHBOR && !isStrongBeat(t));
    if (allowed && !found.tritone) return { ...found, kind, moving: id };
  }
  return { ...found, kind: KIND.CHECK };
}

/**
 * Every dissonance in a passage, in time order: [{ start, voices, steps,
 * tritone, kind, label?, suspended? }]. `voices` maps an id to its notes.
 */
export function dissonances(voices) {
  const ids = Object.keys(voices);
  const found = [];
  for (const t of attackTimes(voices)) {
    const sounding = ids.filter((id) => noteAt(voices[id], t));
    const bassId = sounding.reduce((low, id) => (noteAt(voices[id], t).step < noteAt(voices[low], t).step ? id : low), sounding[0]);
    for (let i = 0; i < sounding.length; i++) {
      for (let j = i + 1; j < sounding.length; j++) {
        const result = classify(voices, sounding[i], sounding[j], t, bassId);
        if (result) found.push(result);
      }
    }
  }
  return found;
}

/** The dissonances worth showing: all on strong beats, and any marked "check" on a weak beat. */
export const worthShowing = (list) => list.filter((d) => isStrongBeat(d.start) || d.kind === KIND.CHECK);
