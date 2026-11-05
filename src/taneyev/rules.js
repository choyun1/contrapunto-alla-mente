// Taneyev's vertical-shifting counterpoint: the rules core.
//
// Intervals are zero-indexed, as Taneyev numbers them: unison 0, 2nd 1, 3rd 2,
// 4th 3, 5th 4, 6th 5, 7th 6, octave 7, 10th 9, 12th 11, 15th 14.
// A negative interval means voice I (the upper voice of the original) has
// crossed below voice II. The derivative of interval m at index Jv is m + Jv.
//
// Sources: Taneyev, Convertible Counterpoint in the Strict Style (§§81–82, 90,
// 101, 128, 135); Segall, MTO 20.3 (2014); Movable Counterpoint video 2.

/** Marks, from least to most strict. */
export const MARK = {
  FREE: '---', // if suspended, the resolution is consonant and free (dotted line)
  X: 'x', // consonance: no suspension rule of its own
  TIE: '—', // on a downbeat it must be a prepared suspension resolving down by step
  NONE: '(—)', // cannot form a suspension
};
const STRICTNESS = { [MARK.FREE]: 0, [MARK.X]: 1, [MARK.TIE]: 2, [MARK.NONE]: 3 };

const NAMES = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave',
  '9th', '10th', '11th', '12th', '13th', '14th', '15th'];

/** Simple form of an interval (0–6), ignoring octaves and direction. */
export const simple = (i) => Math.abs(i) % 7;

/** Consonant in two-voice strict style. The 4th (3) counts as a dissonance. */
export const isConsonant = (i) => [0, 2, 4, 5].includes(simple(i));

/** Perfect consonances: unison, 5th and their compounds. */
export const isPerfect = (i) => [0, 4].includes(simple(i));

/** English ordinal for a 1-indexed interval number: 16 → "16th", 21 → "21st", 22 → "22nd". */
function ordinal(k) {
  const teen = k % 100 >= 11 && k % 100 <= 13;
  const suffix = teen ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] || 'th';
  return `${k}${suffix}`;
}

/** Name of a zero-indexed interval: 0 → "unison", 11 → "12th", 21 → "22nd". */
export function intervalName(i) {
  const a = Math.abs(i);
  const name = a < NAMES.length ? NAMES[a] : ordinal(a + 1);
  return i < 0 ? `${name} (crossed)` : name;
}

// Jv = 0 marks for simple intervals, [upper voice suspended, lower voice suspended].
// Taneyev §90; matches frame 0055 of video 2.
const BASE = [
  [MARK.X, MARK.X], // 0 unison
  [MARK.NONE, MARK.TIE], // 1 2nd: may not resolve to a unison in the upper voice (§81)
  [MARK.X, MARK.X], // 2 3rd
  [MARK.TIE, MARK.TIE], // 3 4th
  [MARK.X, MARK.FREE], // 4 5th: 5–6 by step in the lower voice (§135)
  [MARK.FREE, MARK.X], // 5 6th: 6–5 by step in the upper voice (§135)
  [MARK.TIE, MARK.NONE], // 6 7th: lower voice may not resolve to an octave (§82)
];

/**
 * Jv = 0 marks for any interval: { above, below }.
 * Compounds take the marks of their simple form, except that a compound 2nd
 * (9th, 16th) may resolve in the upper voice, to an octave (§81).
 * Negative intervals swap above and below, since the voices have crossed (§90).
 */
export function baseMarks(i) {
  const a = Math.abs(i);
  let [above, below] = BASE[simple(a)];
  if (simple(a) === 1 && a > 7) above = MARK.TIE;
  return i < 0 ? { above: below, below: above } : { above, below };
}

const stricter = (a, b) => (STRICTNESS[a] >= STRICTNESS[b] ? a : b);

/**
 * Combined rule for original interval m under one or more shifts (§128).
 * Each voice keeps the strictest mark across the original and every derivative.
 * A variable interval (consonant in some versions, dissonant in others) adds x
 * to a — mark, meaning its resolution must be treated as a dissonance, unless
 * every consonant version carries the dotted line in that voice (§135; Segall n. 16).
 */
export function combine(m, shifts) {
  const versions = [m, ...shifts.map((jv) => m + jv)];
  const marks = versions.map(baseMarks);
  const cons = versions.map(isConsonant);
  const variable = cons.some((c) => c !== cons[0]);
  const rule = {};
  for (const voice of ['above', 'below']) {
    let mark = marks.map((mk) => mk[voice]).reduce(stricter);
    const dottedInAllConsonant = marks.every((mk, k) => !cons[k] || mk[voice] === MARK.FREE);
    if (variable && mark === MARK.TIE && !dottedInAllConsonant) mark = `${MARK.TIE} ${MARK.X}`;
    rule[voice] = mark;
  }
  let kind;
  if (cons.every(Boolean)) kind = 'fixed-consonance';
  else if (!cons.some(Boolean)) kind = 'fixed-dissonance';
  else kind = cons[0] ? 'variable-consonance' : 'variable-dissonance';
  return {
    m,
    derivatives: versions.slice(1),
    above: rule.above,
    below: rule.below,
    kind,
    perfect: versions.some(isPerfect), // no parallel or similar motion into it
  };
}

/** Full chart for one or more shifts: one column per original interval. */
export function chart(shifts, { width } = {}) {
  const list = Array.isArray(shifts) ? shifts : [shifts];
  const top = width ?? Math.max(9, ...list.map(Math.abs));
  return Array.from({ length: top + 1 }, (_, m) => combine(m, list));
}

/**
 * §101: when |Jv| is the size of a 2nd, 3rd, 6th or 7th (simple or compound),
 * imperfect consonances can turn into perfect ones, so Taneyev forbids similar
 * and parallel motion into every consonance.
 */
export const forbidsSimilarMotion = (jv) => [1, 2, 5, 6].includes(simple(jv));

/** Does a chain of parallel intervals of size m stay imperfect after the shift? */
export function parallelSurvives(m, jv) {
  const n = m + jv;
  return isConsonant(m) && !isPerfect(m) && isConsonant(n) && !isPerfect(n);
}
