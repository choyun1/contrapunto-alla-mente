// Builds abc notation (https://abcnotation.com) for two-voice examples.
//
// Each voice gets its own staff, labelled I (upper voice of the original) and
// II (lower voice), as in Taneyev. Pitches are diatonic steps from
// src/common/diatonic.js; every measure holds one dyad, a whole note unless the
// measure gives another `length` (e.g. '1/2' for a half-bar rest).

import { letterOf, octaveOf } from '../common/diatonic.js';
import { clefsForVoice } from './clefs.js';

/** One pitch in abc spelling: C4 → 'C', C5 → 'c', C6 → "c'", C3 → 'C,'. */
export function abcPitch(step) {
  const letter = letterOf(step);
  const octave = octaveOf(step);
  if (octave >= 5) return letter.toLowerCase() + "'".repeat(octave - 5);
  return letter + ','.repeat(4 - octave);
}

/** abc for one bar's note: a pitch, or a rest for null. Length is in whole notes. */
const abcNote = (step, length = '1') => (step === null ? `z${length}` : `${abcPitch(step)}${length}`);

/**
 * A voice with each rest replaced by the next real pitch (or the last one),
 * so clefs and staff order can be worked out from pitches alone.
 */
function fillRests(steps) {
  const filled = [...steps];
  for (let k = filled.length - 2; k >= 0; k--) {
    if (filled[k] === null) filled[k] = filled[k + 1];
  }
  for (let k = 1; k < filled.length; k++) {
    if (filled[k] === null) filled[k] = filled[k - 1];
  }
  return filled;
}

/** Middle pitch of a voice, used to decide which staff goes on top. */
function median(steps) {
  const sorted = [...steps].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Measures per printed line. We break lines ourselves (see voiceLines). */
export const MEASURES_PER_LINE = 8;

/**
 * Index of the first measure on each printed line. A line holds
 * MEASURES_PER_LINE whole-note measures; shorter ones (a half-bar rest)
 * ride along without counting, so they never push a bar onto a new line.
 */
function lineStarts(measures) {
  const starts = [0];
  let whole = 0;
  measures.forEach((measure, k) => {
    const isWhole = measure.length === undefined || measure.length === '1';
    if (isWhole && whole === MEASURES_PER_LINE) {
      starts.push(k);
      whole = 0;
    }
    if (isWhole) whole += 1;
  });
  return starts;
}

/**
 * abc text for one voice, one string per printed line: notes, optional text
 * above, bars between. Clef changes inside a line are inline fields; the clef
 * at the start of each line goes on its voice marker (see interleave).
 */
function voiceLines(measures, voice, textKey, clefs, starts) {
  const lines = starts.map((start, line) => {
    const end = starts[line + 1] ?? measures.length;
    const parts = [];
    for (let k = start; k < end; k++) {
      const measure = measures[k];
      const clefChange = k > start && clefs[k] !== clefs[k - 1] ? `[K:clef=${clefs[k]}] ` : '';
      const text = measure[textKey] === undefined ? '' : `"^${measure[textKey]}"`;
      const bar = measure.doubleBarAfter ? '||' : '|';
      parts.push(`${clefChange}${text}${abcNote(measure[voice], measure.length)} ${bar}`);
    }
    return parts.join(' ');
  });
  lines[lines.length - 1] = lines.at(-1).replace(/\|\|?$/, '|]');
  return lines;
}

/**
 * A two-voice tune.
 * measures: [{ voiceI, voiceII, textI?, textII?, doubleBarAfter?, length? }]
 * A voice set to null rests for that bar. `names` labels the staves
 * (default I and II, as in Taneyev).
 * textI is printed above voice I, textII above voice II.
 * The higher-sounding voice gets the top staff, so after an inverse shift
 * voice II is drawn above voice I.
 */
export function twoVoiceTune(measures, { names = ['I', 'II'] } = {}) {
  const stepsI = fillRests(measures.map((m) => m.voiceI));
  const stepsII = fillRests(measures.map((m) => m.voiceII));
  const clefsI = clefsForVoice(stepsI);
  const clefsII = clefsForVoice(stepsII);
  const staffOrder = median(stepsI) >= median(stepsII) ? '(I) (II)' : '(II) (I)';
  const starts = lineStarts(measures);
  return [
    'X:1',
    'M:none',
    'L:1',
    'K:C',
    `%%score ${staffOrder}`,
    `V:I clef=${clefsI[0]} name="${names[0]}"`,
    `V:II clef=${clefsII[0]} name="${names[1]}"`,
    ...interleave(
      voiceLines(measures, 'voiceI', 'textI', clefsI, starts), starts.map((k) => clefsI[k]),
      voiceLines(measures, 'voiceII', 'textII', clefsII, starts), starts.map((k) => clefsII[k]),
    ),
  ].join('\n');
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
