// Generated two-voice examples that show a consonance chart in notation.
//
// Voice II stays on middle C and only voice I moves, so Jv is voice I's own
// shift (v_I = Jv, v_II = 0; video 2, 04:00). Holding C in voice II also keeps
// every dyad free of tritones in C major. Intervals are zero-indexed.

import { MIDDLE_C } from '../common/diatonic.js';
import { chart, parallelSurvives, isConsonant, isPerfect, intervalName } from './rules.js';

/**
 * One dyad per original interval m: the original and its derivative.
 * Returns [{ m, n, kind, original: {voiceI, voiceII}, derivative: {voiceI, voiceII} }].
 */
export function intervalStrip(jv) {
  return chart(jv).map((column) => ({
    m: column.m,
    n: column.m + jv,
    kind: column.kind,
    original: { voiceI: MIDDLE_C + column.m, voiceII: MIDDLE_C },
    derivative: { voiceI: MIDDLE_C + column.m + jv, voiceII: MIDDLE_C },
  }));
}

const CHAIN_LENGTH = 4;

/**
 * A rising chain of parallel intervals of size m (voice II: C D E F), and the
 * same chain after the shift. Taneyev measures by size, not quality (§69), so
 * the qualities here are just what C major gives.
 * Returns { m, n, survives, verdict, original: [...dyads], derivative: [...dyads] }.
 */
export function parallelChain(m, jv) {
  const n = m + jv;
  const voiceII = Array.from({ length: CHAIN_LENGTH }, (_, k) => MIDDLE_C + k);
  const original = voiceII.map((step) => ({ voiceI: step + m, voiceII: step }));
  const derivative = voiceII.map((step) => ({ voiceI: step + n, voiceII: step }));
  return { m, n, survives: parallelSurvives(m, jv), verdict: chainVerdict(n), original, derivative };
}

/** Plain-language result for a parallel chain that becomes interval n. */
function chainVerdict(n) {
  const name = intervalName(Math.abs(n));
  if (isPerfect(n)) return `parallel ${name}s: forbidden`;
  if (isConsonant(n)) return `parallel ${name}s: fine`;
  return `parallel ${name}s: dissonant`;
}
