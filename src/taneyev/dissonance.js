// Dissonance under a vertical shift: suspensions and passing tones. Rules core.
//
// Strict style allows a dissonance only as a suspension (Fux's fourth species)
// or a passing tone (second species). A suspension is a note tied over the bar line from a consonant upbeat (the
// preparation), dissonant on the downbeat, that steps down to a consonance on
// the next upbeat (the resolution). Under a shift the same downbeat can be
// consonant in one version and dissonant in the other, so it has to be written
// as a suspension in both. Taneyev's marks say whether that is possible
// (rules.js, combine):
//
//   (—)    cannot form a suspension in that voice;
//   —      must be a suspension: prepared, tied, resolving down by step;
//   — x    variable interval: resolve it as a dissonance even where it is
//          consonant (§135; Segall n. 16);
//   x, --- consonant in every version: no suspension rule.
//
// Intervals are zero-indexed and measured voice I minus voice II, as in
// rules.js. 'above' is voice I suspended, 'below' is voice II suspended; when
// the voices cross, baseMarks already swaps the marks (§90).
//
// A passing tone needs no mark: it falls on the weak beat, between two notes a
// step either side in one direction, so it stays a passing tone in every
// version of a shift (the shift moves the whole line, not single notes).
//
// Sources: Taneyev, Convertible Counterpoint (§§81–82, 90, 128, 135);
// Fux, Gradus ad Parnassus, second and fourth species.

import { MARK, combine } from './rules.js';

/** The combined mark for interval m, suspended in `voice` ('above' or 'below'), under one shift. */
export const suspensionMark = (m, jv, voice) => combine(m, [jv])[voice];

/** May interval m be suspended in `voice` under shift jv: is its mark anything but (—)? (§90, §128) */
export const maySuspend = (m, jv, voice) => suspensionMark(m, jv, voice) !== MARK.NONE;

/**
 * The interval a suspension resolves to: the suspended voice steps down, so the
 * interval shrinks by a step when voice I is suspended ('above': 7th → 6th, 6 → 5)
 * and grows when voice II is ('below': 2nd → 3rd, 1 → 2). Fux, fourth species.
 */
export const resolutionOf = (m, voice) => (voice === 'above' ? m - 1 : m + 1);

/** Is `note` a passing tone between `before` and `after`: a step in, a step on, the same way? (Fux, second species) */
export function isPassingTone(before, note, after) {
  const stepIn = note - before;
  const stepOut = after - note;
  return Math.abs(stepIn) === 1 && stepIn === stepOut;
}
