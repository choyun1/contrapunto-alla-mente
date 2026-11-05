// Canon over a cantus firmus: the imaginary cantus firmus.
//
// Intervals are zero-indexed, as everywhere in this project: unison 0, 2nd 1,
// 3rd 2, octave 7, 12th 11. Pitches are diatonic steps (common/diatonic.js).
//
// The problem: write a proposta whose risposta (the same tune, `entry` steps
// higher and `delay` bars later) also fits the cantus firmus. The trick
// (Taneyev's imaginary voices; Movable Counterpoint 4, 04:23–06:25):
//
//   1. Copy the cantus, moved the opposite way: `entry` steps down and `delay`
//      bars earlier. This hidden copy is the imaginary cantus firmus.
//   2. Whatever the proposta forms against the imaginary cantus in bar k, the
//      risposta forms against the real cantus in bar k + delay, because both
//      pairs are the same pair moved by the canon. So a proposta note that is
//      consonant with the cantus AND with the imaginary cantus is safe for
//      both voices of the canon.
//   3. The interval between the two copies of the cantus (the "guide
//      interval") is the vertical shift Jv that bar must be written in. A
//      unison guide is simple counterpoint; an octave, 10th or 12th is
//      textbook invertible counterpoint; a 2nd or 7th leaves almost no notes.
//
// The guide interval is just the cantus in canon with itself, so it comes
// from canon.js: guide = entry − span, where span is the cantus's own move
// across the delay.
//
// Sources: Movable Counterpoint 3 (imaginary voices, 03:40) and 4 (canon
// against a cantus firmus, 02:40–09:06); Segall's open-access article on the
// same method, cited in video 4 (01:22). Not yet checked against a § of
// Taneyev's Doctrine of the Canon.

import { canonInterval } from './canon.js';
import { isConsonant, simple } from './rules.js';
import { isTritone } from '../common/diatonic.js';

/**
 * Where the proposta sits relative to the cantus. It fixes the sign of Jv:
 * Taneyev measures every interval from the upper voice of the original pair.
 */
export const SIDE = { ABOVE: 'above', BELOW: 'below' };

/**
 * The imaginary cantus firmus: the cantus moved `entry` steps down and
 * `delay` bars earlier. Bar k holds cantus[k + delay] − entry, or null once
 * the cantus has run out (the proposta's last notes are never imitated).
 */
export function imaginaryCantus(cantus, entry, delay) {
  return cantus.map((_, bar) => {
    const later = cantus[bar + delay];
    return later === undefined ? null : later - entry;
  });
}

/**
 * The guide interval in bar k: the cantus above the imaginary cantus, in
 * steps (negative when the imaginary cantus is above). Null past the end.
 * Equal to the canon interval of the cantus with itself (canon.js).
 */
export function guideInterval(cantus, entry, delay, bar) {
  const later = cantus[bar + delay];
  if (later === undefined) return null;
  const span = later - cantus[bar];
  return canonInterval(span, entry);
}

/**
 * The vertical shift Jv for the proposta in one bar, from the guide interval.
 * The original pair is proposta + cantus and the derivative is proposta +
 * imaginary cantus. With the proposta above, it is voice I and the lower voice
 * drops by the guide, so Jv = guide. With the proposta below, the cantus is
 * voice I and is replaced by a copy `guide` steps lower, so Jv = −guide
 * (video 4, 09:06: an octave becomes a 3rd, 7 + −9 = −2).
 */
export function shiftFor(guide, side) {
  if (guide === null) return null;
  return side === SIDE.ABOVE ? guide : 0 - guide; // 0 − guide, not −guide, so no −0
}

/** How hard a bar's guide interval makes it, from easiest to hardest. */
export const GUIDE = {
  SIMPLE: 'simple', // unison: the two copies agree, so plain counterpoint
  CONSONANT: 'consonant', // 3rd, 5th, 6th, octave and compounds: the textbook shifts
  DISSONANT: 'dissonant', // 2nd, 4th, 7th and compounds: few notes fit
};

/** The difficulty of one guide interval (video 4, 06:25). */
export function guideKind(guide) {
  if (guide === 0) return GUIDE.SIMPLE;
  return isConsonant(guide) ? GUIDE.CONSONANT : GUIDE.DISSONANT;
}

/**
 * One row per bar: { bar, cantus, imaginary, guide, jv, kind }.
 * The last `delay` bars have no imaginary cantus, so guide, jv and kind are null.
 */
export function guideTable({ cantus, entry, delay, side }) {
  const imaginary = imaginaryCantus(cantus, entry, delay);
  return cantus.map((note, bar) => {
    const guide = guideInterval(cantus, entry, delay, bar);
    return {
      bar,
      cantus: note,
      imaginary: imaginary[bar],
      guide,
      jv: shiftFor(guide, side),
      kind: guide === null ? null : guideKind(guide),
    };
  });
}

/**
 * Bars where the guide intervals run in parallel 2nds, 7ths or 9ths: the
 * proposta can form a 5th with one copy and a 6th with the other, but soon
 * runs into parallel 5ths. If these show up, choose another interval or
 * distance of entrance (Taneyev's diagram; video 4, 06:25–07:45).
 * Returns the index of the second bar of each pair.
 */
export function parallelDissonantGuides(rows) {
  const stuck = [];
  for (let k = 1; k < rows.length; k += 1) {
    const a = rows[k - 1].guide;
    const b = rows[k].guide;
    if (a === null || b === null) continue;
    const isSecondOrSeventh = [1, 6].includes(simple(a));
    if (isSecondOrSeventh && a === b) stuck.push(k);
  }
  return stuck;
}

/** Is `note` a usable vertical against `other` in two-voice strict style? */
const fitsAgainst = (note, other) => isConsonant(note - other) && !isTritone(note, other);

/**
 * Is `note` usable against the imaginary cantus? As against the real one,
 * but with `allowFourth` a perfect 4th also passes: in the derivative that 4th
 * sounds between the risposta and the cantus, and if both are above the
 * proposta it acts as a consonance (video 4, 10:23). The full chord a bar
 * later has to confirm it.
 */
function fitsImaginary(note, imaginary, allowFourth) {
  if (imaginary === null) return true;
  if (fitsAgainst(note, imaginary)) return true;
  return allowFourth && simple(note - imaginary) === 3 && !isTritone(note, imaginary);
}

/**
 * Proposta notes for one bar (step 3 of the method): on the proposta's side of
 * the cantus, at most `widest` steps away (default a 10th, 9), consonant with
 * the cantus and with the imaginary cantus. Returns steps, nearest first.
 * By default a 4th against the imaginary cantus is left out, since it needs a
 * bass under it in the risposta's bar; pass allowFourth to keep it.
 */
export function propostaChoices({ cantus, entry, delay, side }, bar, { widest = 9, allowFourth = false } = {}) {
  const imaginary = imaginaryCantus(cantus, entry, delay)[bar];
  const direction = side === SIDE.ABOVE ? 1 : -1;
  const choices = [];
  for (let distance = 1; distance <= widest; distance += 1) {
    const note = cantus[bar] + direction * distance;
    if (!fitsAgainst(note, cantus[bar])) continue;
    if (fitsImaginary(note, imaginary, allowFourth)) choices.push(note);
  }
  return choices;
}
