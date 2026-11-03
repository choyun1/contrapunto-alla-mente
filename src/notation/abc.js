// Builds abc notation (https://abcnotation.com) for two-voice examples.
//
// Each voice gets its own staff, labelled I (upper voice of the original) and
// II (lower voice), as in Taneyev. Pitches are diatonic steps from
// src/common/diatonic.js; every measure holds one whole-note dyad.

import { letterOf, octaveOf } from '../common/diatonic.js';

/** One pitch in abc spelling: C4 → 'C', C5 → 'c', C6 → "c'", C3 → 'C,'. */
export function abcPitch(step) {
  const letter = letterOf(step);
  const octave = octaveOf(step);
  if (octave >= 5) return letter.toLowerCase() + "'".repeat(octave - 5);
  return letter + ','.repeat(4 - octave);
}

/** Middle pitch of a voice, used to place its staff and pick its clef. */
function median(steps) {
  const sorted = [...steps].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Treble clef unless most of the voice sits below A3. */
export function clefFor(steps) {
  return median(steps) >= 26 ? 'treble' : 'bass'; // 26 = A3
}

/** Splits measures into sections at each double bar. */
function sections(measures) {
  const result = [[]];
  for (const measure of measures) {
    result.at(-1).push(measure);
    if (measure.doubleBarAfter) result.push([]);
  }
  return result.filter((section) => section.length > 0);
}

/**
 * abc text for one voice: whole notes, optional text above, bars between.
 * Each section after a double bar picks its own clef, so a voice that moves
 * an octave or more after the shift doesn't sit on ledger lines.
 */
function voiceLine(measures, voice, textKey) {
  let clef = clefFor(sections(measures)[0].map((m) => m[voice]));
  const parts = [];
  for (const section of sections(measures)) {
    const sectionClef = clefFor(section.map((m) => m[voice]));
    if (sectionClef !== clef) parts.push(`[K:clef=${sectionClef}]`);
    clef = sectionClef;
    for (const measure of section) {
      const text = measure[textKey] === undefined ? '' : `"^${measure[textKey]}"`;
      const bar = measure.doubleBarAfter ? '||' : '|';
      parts.push(`${text}${abcPitch(measure[voice])}1 ${bar}`);
    }
  }
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
  const clefI = clefFor(sections(measures)[0].map((m) => m.voiceI));
  const clefII = clefFor(sections(measures)[0].map((m) => m.voiceII));
  const staffOrder = median(stepsI) >= median(stepsII) ? '(I) (II)' : '(II) (I)';
  return [
    'X:1',
    'M:none',
    'L:1',
    'Q:1=40', // one whole note every 1.5 seconds on playback
    'K:C',
    `%%score ${staffOrder}`,
    `V:I clef=${clefI} name="I"`,
    `V:II clef=${clefII} name="II"`,
    '[V:I]',
    voiceLine(measures, 'voiceI', 'textI'),
    '[V:II]',
    voiceLine(measures, 'voiceII', 'textII'),
  ].join('\n');
}
