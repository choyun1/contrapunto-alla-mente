// Which four-bar example the three-voice page shows for a split: strict first
// species when one exists (three-voice-examples.js), otherwise mixed species
// with suspensions and passing tones (three-voice-species.js).

import { threeVoiceExample } from './three-voice-examples.js';
import { speciesExample } from './three-voice-species.js';

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
