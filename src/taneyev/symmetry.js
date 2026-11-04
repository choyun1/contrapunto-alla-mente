// Taneyev's shifts as symmetries: which rigid motion carries each interval.
//
// Intervals are zero-indexed, as in rules.js: unison 0, 3rd 2, octave 7,
// 10th 9, 12th 11. A shift adds Jv (n = m + Jv). Folded into one octave, the
// seven steps sit on the corners of a heptagon, and every shift acts on them
// as one of the heptagon's 14 symmetries (the dihedral group D7):
//
//   - voices stay in order (n ≥ 0): a rotation, n → n + Jv;
//   - voices cross (n < 0): a reflection, n → k − n with k = −Jv, because the
//     interval you hear is |n| (§90: a crossed interval is read the other way up).
//
// In 3D the reflection is a half-turn of a seven-sided coin about a level
// axis, which is how taneyev/shift-model.js draws it.
//
// Derived from the rules core, not quoted from Taneyev: the group-theory
// reading is ours (see the "math behind Taneyev" notes), the rules are §§90, 128.

import { simple, isConsonant } from './rules.js';

/** The consonances as steps of the heptagon: unison, 3rd, 5th, 6th. */
export const CONSONANT_STEPS = [0, 2, 4, 5];

/** Folds any whole number onto the heptagon's corners, 0–6. */
const mod7 = (x) => ((x % 7) + 7) % 7;

/** Do the voices of interval m cross under shift jv? (n = m + jv below zero, §90.) */
export const crosses = (m, jv) => m + jv < 0;

/** The motion that carries interval m: 'stay' (Jv = 0), 'rotate' or 'flip'. */
export function motion(m, jv) {
  if (jv === 0) return 'stay';
  return crosses(m, jv) ? 'flip' : 'rotate';
}

/** The corner (0–6) where interval m lands: the simple interval you hear after the shift. */
export const landing = (m, jv) => simple(m + jv);

/**
 * The heptagon corner the mirror passes through, for an inverse shift (jv < 0).
 * The mirror n → k − n fixes the step n with 2n = k (mod 7), and 4 is the
 * inverse of 2 mod 7, so that step is 4k mod 7. Returns null when jv ≥ 0.
 */
export function mirrorStep(jv) {
  if (jv >= 0) return null;
  return mod7(4 * -jv);
}

/** The rotation of the heptagon for a shift with voices in order, as the shortest turn (−3 to 3 steps). */
export const rotationSteps = (jv) => mod7(jv + 3) - 3;

/** How many of the four simple consonances stay consonant under shift jv. */
export const consonancesKept = (jv) => CONSONANT_STEPS.filter((m) => isConsonant(m + jv)).length;

/**
 * The affine maps n → a·n + b on the seven steps that keep the consonances
 * consonant, as [a, b] pairs. Only two: the identity and n → 2 − n, the
 * inversion at the 10th (Jv = −9, and 9 is 2 mod 7).
 */
export function consonanceSymmetries() {
  const maps = [];
  for (let a = 1; a < 7; a += 1) {
    for (let b = 0; b < 7; b += 1) {
      const image = CONSONANT_STEPS.map((n) => mod7(a * n + b));
      if (image.every((n) => CONSONANT_STEPS.includes(n))) maps.push([a, b]);
    }
  }
  return maps;
}

// ---------- The group itself: D7 as turns and flips ----------
//
// Each of the 14 symmetries is { kind: 'turn', step: a } (n → n + a) or
// { kind: 'flip', step: k } (n → k − n), with steps mod 7. On the charts page
// a turn is a shift with the voices in order and a flip is an inversion.

/** The symmetry a shift acts as, modulo the octave: a turn for Jv ≥ 0, a flip at k = −Jv otherwise. */
export function element(jv) {
  if (jv >= 0) return { kind: 'turn', step: mod7(jv) };
  return { kind: 'flip', step: mod7(-jv) };
}

/** Where a symmetry sends step n (0–6). */
export function act(e, n) {
  return e.kind === 'turn' ? mod7(n + e.step) : mod7(e.step - n);
}

/**
 * The symmetry "b after a": the Cayley table of D7 in four rules.
 * Two turns add; a turn and a flip make a flip; two flips make a turn.
 */
export function compose(b, a) {
  if (b.kind === 'turn' && a.kind === 'turn') return { kind: 'turn', step: mod7(b.step + a.step) };
  if (b.kind === 'turn') return { kind: 'flip', step: mod7(b.step + a.step) };
  if (a.kind === 'turn') return { kind: 'flip', step: mod7(b.step - a.step) };
  return { kind: 'turn', step: mod7(b.step - a.step) };
}

/** All 14 symmetries: the seven turns, then the seven flips. */
export const ALL_ELEMENTS = [0, 1, 2, 3, 4, 5, 6].map((step) => ({ kind: 'turn', step }))
  .concat([0, 1, 2, 3, 4, 5, 6].map((step) => ({ kind: 'flip', step })));
