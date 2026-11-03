// Builds abc notation (https://abcnotation.com) for two-voice examples.
//
// Each voice gets its own staff, labelled I (upper voice of the original) and
// II (lower voice), as in Taneyev. Pitches are diatonic steps from
// src/common/diatonic.js; every measure holds one whole-note dyad.

import { letterOf, octaveOf } from '../common/diatonic.js';
import { clefsForVoice } from './clefs.js';

/** One pitch in abc spelling: C4 → 'C', C5 → 'c', C6 → "c'", C3 → 'C,'. */
export function abcPitch(step) {
  const letter = letterOf(step);
  const octave = octaveOf(step);
  if (octave >= 5) return letter.toLowerCase() + "'".repeat(octave - 5);
  return letter + ','.repeat(4 - octave);
}

/** Middle pitch of a voice, used to decide which staff goes on top. */
function median(steps) {
  const sorted = [...steps].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Measures per printed line. We break lines ourselves (see voiceLines). */
export const MEASURES_PER_LINE = 8;

/**
 * abc text for one voice, one string per printed line: whole notes, optional
 * text above, bars between. Clef changes inside a line are inline fields;
 * the clef at the start of each line goes on its voice marker (see interleave).
 */
function voiceLines(measures, voice, textKey, clefs) {
  const lines = [];
  for (let start = 0; start < measures.length; start += MEASURES_PER_LINE) {
    const parts = [];
    for (let k = start; k < Math.min(start + MEASURES_PER_LINE, measures.length); k++) {
      const measure = measures[k];
      const clefChange = k > start && clefs[k] !== clefs[k - 1] ? `[K:clef=${clefs[k]}] ` : '';
      const text = measure[textKey] === undefined ? '' : `"^${measure[textKey]}"`;
      const bar = measure.doubleBarAfter ? '||' : '|';
      parts.push(`${clefChange}${text}${abcPitch(measure[voice])}1 ${bar}`);
    }
    lines.push(parts.join(' '));
  }
  lines[lines.length - 1] = lines.at(-1).replace(/\|\|?$/, '|]');
  return lines;
}

/**
 * A two-voice tune.
 * measures: [{ voiceI, voiceII, textI?, textII?, doubleBarAfter? }]
 * textI is printed above voice I, textII above voice II.
 * The higher-sounding voice gets the top staff, so after an inverse shift
 * voice II is drawn above voice I.
 */
export function twoVoiceTune(measures) {
  const stepsI = measures.map((m) => m.voiceI);
  const stepsII = measures.map((m) => m.voiceII);
  const clefsI = clefsForVoice(stepsI);
  const clefsII = clefsForVoice(stepsII);
  const staffOrder = median(stepsI) >= median(stepsII) ? '(I) (II)' : '(II) (I)';
  return [
    'X:1',
    'M:none',
    'L:1',
    'K:C',
    `%%score ${staffOrder}`,
    `V:I clef=${clefsI[0]} name="I"`,
    `V:II clef=${clefsII[0]} name="II"`,
    ...interleave(
      voiceLines(measures, 'voiceI', 'textI', clefsI), lineStartClefs(clefsI),
      voiceLines(measures, 'voiceII', 'textII', clefsII), lineStartClefs(clefsII),
    ),
  ].join('\n');
}

/** The clef in force at the start of each printed line. */
function lineStartClefs(clefs) {
  return clefs.filter((_, k) => k % MEASURES_PER_LINE === 0);
}

/**
 * Alternates the two voices line by line, so each system holds both. Each
 * line's voice marker restates its clef, because abcjs forgets an inline
 * clef change when it starts a new line.
 */
function interleave(linesI, startClefsI, linesII, startClefsII) {
  return linesI.flatMap((line, k) => [
    `[V:I clef=${startClefsI[k]}]`, line,
    `[V:II clef=${startClefsII[k]}]`, linesII[k],
  ]);
}
