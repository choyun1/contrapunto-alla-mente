// Two-voice canon: which melodic intervals the proposta may use.
//
// Intervals are zero-indexed, as everywhere in this project: unison 0, 2nd 1,
// 3rd 2, octave 7, 12th 11.
//
// The risposta copies the proposta `delay` time units later, moved by the
// interval of entrance. So at any moment the risposta sounds what the proposta
// played one delay ago, and the two voices form
//
//     n = entry − span
//
// where `entry` is the interval of entrance (positive: risposta above) and
// `span` is the proposta's melodic interval from a note to the note one delay
// later (positive: rising). In Taneyev's terms the canon at the unison is the
// original, with m = −span, and the interval of entrance is the vertical
// shift: n = m + Jv with Jv = entry (video 4, 03:57; video 6, 06:05).
//
// Example (Cho's question): canon at the octave above (entry 7) after one
// measure. A step in the proposta from one downbeat to the next (span ±1)
// gives n = 6 or 8, a 7th or a 9th, so it can only stand as a suspension.
//
// The delay decides which notes are paired, not which intervals are allowed:
// after two measures the rule applies to the span from measure k to k + 2.
//
// Derived from the rules core, not quoted from Taneyev. The Doctrine of the
// Canon (1929) treats canon this way, but no § number has been checked yet.

import { isConsonant, isPerfect, baseMarks, simple } from './rules.js';

/** The interval the risposta forms above the proposta (negative: below). */
export const canonInterval = (span, entry) => entry - span;

/**
 * Suspension marks for a dissonant canon interval, by voice.
 * The risposta is voice I, so a negative n means it has crossed below the
 * proposta and baseMarks swaps the marks (§90).
 * Returns { risposta, proposta }.
 */
export function canonMarks(span, entry) {
  const marks = baseMarks(canonInterval(span, entry));
  return { risposta: marks.above, proposta: marks.below };
}

/** How the proposta may use a span: the verdict, from freest to strictest. */
export const VERDICT = {
  FREE: 'free', // imperfect consonance: use it as often as you like
  PERFECT: 'perfect', // perfect consonance: never twice in a row while both voices move
  SUSPENSION: 'suspension', // dissonance: only as a prepared suspension
};

/** The verdict for one span at one interval of entrance. */
export function spanVerdict(span, entry) {
  const n = canonInterval(span, entry);
  if (!isConsonant(n)) return VERDICT.SUSPENSION;
  if (isPerfect(n)) return VERDICT.PERFECT;
  return VERDICT.FREE;
}

/**
 * One row of the table: what a span of the proposta becomes in the canon.
 * Returns { span, n, verdict, risposta, proposta } where risposta and proposta
 * are the suspension marks (meaningful only when the verdict is suspension).
 */
export function spanRule(span, entry) {
  const n = canonInterval(span, entry);
  const marks = canonMarks(span, entry);
  return { span, n, verdict: spanVerdict(span, entry), ...marks };
}

/** The table for one interval of entrance: every span from down `range` to up `range`. */
export function spanTable(entry, { range = 7 } = {}) {
  const rows = [];
  for (let span = -range; span <= range; span += 1) rows.push(spanRule(span, entry));
  return rows;
}

/** The spans that give a consonance, perfect or imperfect. */
export function consonantSpans(entry, { range = 7 } = {}) {
  return spanTable(entry, { range })
    .filter((row) => row.verdict !== VERDICT.SUSPENSION)
    .map((row) => row.span);
}

/**
 * Do two successive canon intervals make forbidden consecutive perfects?
 * Both must be perfect consonances of the same kind (unison/octave or 5th),
 * and both voices must move. That covers parallels and the 5th-to-12th
 * "anti-parallel" (video 4, 20:08).
 */
export function consecutivePerfects(first, second, bothMove) {
  if (!bothMove) return false;
  if (!isConsonant(first) || !isPerfect(first)) return false;
  if (!isConsonant(second) || !isPerfect(second)) return false;
  return simple(first) === simple(second);
}

/**
 * Do both voices move the same way into a perfect consonance (a hidden or
 * direct 5th or octave)? Forbidden in two-voice strict style (Fux, Gradus,
 * first species).
 * `motionA` and `motionB` are each voice's signed melodic step.
 */
export function similarIntoPerfect(motionA, motionB, n) {
  if (!isConsonant(n) || !isPerfect(n)) return false;
  return Math.sign(motionA) !== 0 && Math.sign(motionA) === Math.sign(motionB);
}

/**
 * Checks a proposta written as equal note values, one per time unit.
 * `steps` are diatonic pitch steps (src/common/diatonic.js) and `delay` is the
 * distance of entrance in those units. Every note is treated as a strong beat,
 * as in a whole-note framework.
 * Returns one entry per note from the risposta's entrance on:
 * { index, span, n, verdict, risposta, proposta, consecutive, similar }.
 * `similar` marks similar motion into a perfect consonance that is not
 * already counted as consecutive perfects.
 */
export function checkProposta(steps, entry, delay) {
  const results = [];
  for (let i = delay; i < steps.length; i += 1) {
    const span = steps[i] - steps[i - delay];
    const rule = spanRule(span, entry);
    const previous = results[results.length - 1];
    let consecutive = false;
    let similar = false;
    if (previous) {
      const propostaMotion = steps[i] - steps[i - 1];
      const rispostaMotion = steps[i - delay] - steps[i - delay - 1];
      consecutive = consecutivePerfects(previous.n, rule.n, propostaMotion !== 0 && rispostaMotion !== 0);
      similar = !consecutive && similarIntoPerfect(propostaMotion, rispostaMotion, rule.n);
    }
    results.push({ index: i, ...rule, consecutive, similar });
  }
  return results;
}

/** Does interval n put the risposta on the wrong side of the proposta? */
const crossed = (n, entry) => n !== 0 && entry !== 0 && Math.sign(n) !== Math.sign(entry);

/** Folds a span into the window [low, low + 6], keeping its note name. */
const fold = (span, low) => ((((span - low) % 7) + 7) % 7) + low;

/**
 * The proposta's allowed moves as one stacked chord, in steps from its
 * current note (0). Spans that cross the voices are left out, and octaves are
 * folded together, so the chord names which notes the proposta may reach one
 * delay later.
 *
 * The chord is always the consonance chord (unison, 3rd, 5th, 6th: C E G A on
 * C), moved. With the proposta on top it is transposed down by the interval
 * of entrance; with the proposta below it is first turned upside down, then
 * transposed up. So the two cases mirror each other around the proposta's
 * note (n = Jv − span). Cho's chord chart; to check against Cho's paper notes.
 *
 * Spelled rising from just below the note when the proposta is the lower
 * voice, falling from just above it when it is the upper voice, and around
 * the note at the unison. Returns sorted steps, e.g. [−1, 0, 2, 4] (B C E G)
 * for the risposta a 5th above.
 */
export function moveChord(entry) {
  let low = -3;
  if (entry > 0) low = -2;
  if (entry < 0) low = -4;
  const folded = consonantSpans(entry)
    .filter((span) => !crossed(canonInterval(span, entry), entry))
    .map((span) => fold(span, low));
  return [...new Set(folded)].sort((a, b) => a - b);
}
