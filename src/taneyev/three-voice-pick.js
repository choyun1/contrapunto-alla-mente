// Which four-bar example the three-voice page shows for a split: strict first
// species when one exists (three-voice-examples.js), otherwise mixed species
// with suspensions and passing tones (three-voice-species.js).

import { MIDDLE_C } from '../common/diatonic.js';
import { threeVoiceExample } from './three-voice-examples.js';
import { speciesExample } from './three-voice-species.js';
import { splitShift } from './three-voices.js';
import { allShifts } from './shifts.js';

/** Starting notes offered for the lower voice: every natural from C2 to C5, F3 by default. */
export const STARTING_NOTES = { from: MIDDLE_C - 14, to: MIDDLE_C + 7, default: MIDDLE_C - 4 };

/** The kinds of example, in the order they are tried. */
export const KIND = { FIRST: 'first', MIXED: 'mixed' };

/**
 * The example for a split with the cantus starting on `start`, as
 * { kind, example }, or null when neither search finds one.
 */
export function exampleForSplit(split, { start }) {
  const first = threeVoiceExample(split, { start });
  if (first) return { kind: KIND.FIRST, example: first };
  const mixed = speciesExample(split, { start });
  if (mixed) return { kind: KIND.MIXED, example: mixed };
  return null;
}

/**
 * Every split of every total Jv that has an example from `start`, as
 * { first: [[total, upper, lower], …], mixed: […] } in number order.
 * This is the slow search (15–30 s); scripts/build-survey.js runs it once
 * per starting note and commits the result as data/three-voice-survey.json.
 */
export function surveyFrom(start) {
  const survey = { [KIND.FIRST]: [], [KIND.MIXED]: [] };
  for (const total of allShifts()) {
    for (const split of splitShift(total)) {
      const found = exampleForSplit(split, { start });
      if (found) survey[found.kind].push([total, split.upper, split.lower]);
    }
  }
  return survey;
}
