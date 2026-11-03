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

/**
 * abc text for one voice: whole notes, optional text above, bars between.
 * An inline [K:clef=...] marks each clef change (see clefs.js).
 */
function voiceLine(measures, voice, textKey, clefs) {
  const parts = measures.map((measure, k) => {
    const clefChange = k > 0 && clefs[k] !== clefs[k - 1] ? `[K:clef=${clefs[k]}] ` : '';
    const text = measure[textKey] === undefined ? '' : `"^${measure[textKey]}"`;
    const bar = measure.doubleBarAfter ? '||' : '|';
    return `${clefChange}${text}${abcPitch(measure[voice])}1 ${bar}`;
  });
  return `${parts.join(' ').replace(/\|\|?$/, '')}|]`;
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
    'Q:1/1=80', // one whole note every 0.75 seconds on playback
    'K:C',
    `%%score ${staffOrder}`,
    `V:I clef=${clefsI[0]} name="I"`,
    `V:II clef=${clefsII[0]} name="II"`,
    '[V:I]',
    voiceLine(measures, 'voiceI', 'textI', clefsI),
    '[V:II]',
    voiceLine(measures, 'voiceII', 'textII', clefsII),
  ].join('\n');
}
