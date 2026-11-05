// A question to ask yourself while writing at a vertical shift: a one-line
// reminder of what the shift changes, worked out from the chart.
//
// Invertible counterpoint at the 12th asks "what if every 6th were a
// dissonance?": a 6th of the original turns into a 7th of the derivative, so
// it is a variable consonance and must be treated as a dissonance (Movable
// Counterpoint 2, 19:19: "wherever there was a sixth it has now become a
// correctly treated seventh"). The same reading of each chart gives:
//   - a consonance that turns dissonant: what if every <m> were a dissonance?
//   - an imperfect consonance that turns perfect: what if every <m> were perfect?
// Consonances that stay free need no question, so the canon at the unison
// (Jv 0) has none.
//
// Intervals are zero-indexed: 3rd 2, 6th 5, octave 7. Only the originals from
// the unison to the octave are asked about; compounds behave like their
// simple forms here. Derived from rules.js (§§81–82, 128), not quoted from
// Taneyev.

import { chart, isConsonant, isPerfect, intervalName } from './rules.js';

/** Largest original interval asked about: the octave. */
const WIDTH = 7;

/** One question for original interval m, or null if the shift leaves it alone. */
function questionFor(column) {
  const { m, derivatives: [n], kind } = column;
  const turnsInto = intervalName(Math.abs(n));
  if (kind === 'variable-consonance') {
    return {
      m,
      question: `What if every ${intervalName(m)} were a dissonance?`,
      answer: `It turns into a ${turnsInto}, so use it only as a prepared suspension or a passing tone.`,
    };
  }
  const becomesPerfect = isConsonant(m) && !isPerfect(m) && isConsonant(n) && isPerfect(n);
  if (becomesPerfect) {
    return {
      m,
      question: `What if every ${intervalName(m)} were perfect?`,
      answer: `It turns into a${turnsInto === 'octave' ? 'n' : ''} ${turnsInto}, so no parallel ${intervalName(m)}s and no similar motion into one.`,
    };
  }
  return null;
}

/**
 * The questions for one shift, smallest interval first:
 * [{ m, question, answer }]. Empty when the shift changes nothing that matters.
 */
export function selfQuestions(jv) {
  return chart(jv, { width: WIDTH }).map(questionFor).filter(Boolean);
}
