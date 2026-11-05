// Builds abc notation (https://abcnotation.com) for two- and three-voice examples.
//
// Each voice gets its own staff, labeled I (upper voice of the original) and
// II (lower voice), as in Taneyev. Pitches are diatonic steps from
// src/common/diatonic.js; every measure holds one dyad, a whole note unless the
// measure gives another `length` (e.g. '1/2' for a half-bar rest). A voice may
// instead hold a list of notes for the bar, { step, length, tie } each, for
// half notes and ties (see barNotes).

import { letterOf, octaveOf } from '../common/diatonic.js';
import { clefsForVoice } from './clefs.js';

/** One pitch in abc spelling: C4 → 'C', C5 → 'c', C6 → "c'", C3 → 'C,'. */
export function abcPitch(step) {
  const letter = letterOf(step);
  const octave = octaveOf(step);
  if (octave >= 5) return letter.toLowerCase() + "'".repeat(octave - 5);
  return letter + ','.repeat(4 - octave);
}

/** abc for one note: a pitch, or a rest for null. Length is in whole notes. */
const abcNote = (step, length = '1') => (step === null ? `z${length}` : `${abcPitch(step)}${length}`);

/**
 * abc for one voice in one bar. `value` is a step (or null) lasting the bar,
 * or a list of { step, length, tie } notes, where tie joins a note to the next
 * one, across the bar line too: [{ step: 30, length: '1/2', tie: true }].
 */
function barNotes(value, length) {
  if (!Array.isArray(value)) return abcNote(value, length);
  return value.map((note) => `${abcNote(note.step, note.length)}${note.tie ? '-' : ''}`).join(' ');
}

/** The first pitch a voice sounds in a bar, or null: a list of notes stands for its first pitch. */
function firstStep(value) {
  if (!Array.isArray(value)) return value;
  return value.find((note) => note.step !== null)?.step ?? null;
}

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

/** The clef each measure of one voice is drawn in, as voicesTune draws it (key: e.g. 'voiceI'). */
export function clefsOf(measures, key) {
  return clefsForVoice(fillRests(measures.map((m) => firstStep(m[key]))));
}

/** Middle pitch of a voice, used to decide which staff goes on top. */
function median(steps) {
  const sorted = [...steps].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Measures per printed line. We break lines ourselves (see voiceLines). */
export const MEASURES_PER_LINE = 8;

/** Is a measure silent in every voice (no pitch anywhere)? */
const isRestBar = (measure) => !Object.values(measure).some((value) => typeof firstStep(value) === 'number');

/**
 * Index of the first measure on each printed line. A line holds
 * MEASURES_PER_LINE whole-note measures of music; rests between an original
 * and its shifted version, and shorter measures, ride along without counting,
 * so a 4 + rest + 4 example stays on one line.
 */
function lineStarts(measures) {
  const starts = [0];
  let whole = 0;
  measures.forEach((measure, k) => {
    const isWhole = (measure.length === undefined || measure.length === '1') && !isRestBar(measure);
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
      parts.push(`${clefChange}${text}${barNotes(measure[voice], measure.length)} ${bar}`);
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
  return voicesTune(measures, [
    { id: 'I', key: 'voiceI', textKey: 'textI', name: names[0] },
    { id: 'II', key: 'voiceII', textKey: 'textII', name: names[1] },
  ]);
}

/**
 * A tune with any number of voices, one staff each.
 * voices: [{ id, key, textKey, name }], where `key` names each measure's pitch
 * for that voice and `textKey` its text. With sortByPitch, higher-sounding
 * voices get higher staves (voices that sit level keep the order given);
 * without it, the staves keep the order given.
 */
export function voicesTune(measures, voices, { sortByPitch = true } = {}) {
  const starts = lineStarts(measures);
  const staves = voices.map((voice) => {
    const steps = fillRests(measures.map((m) => firstStep(m[voice.key])));
    const clefs = clefsOf(measures, voice.key);
    return {
      ...voice,
      middle: median(steps),
      clefs,
      lines: voiceLines(measures, voice.key, voice.textKey, clefs, starts),
      startClefs: starts.map((k) => clefs[k]),
    };
  });
  const sorted = sortByPitch ? [...staves].sort((a, b) => b.middle - a.middle) : staves;
  const order = sorted.map((staff) => `(${staff.id})`);
  return [
    'X:1',
    'M:none',
    'L:1',
    'K:C',
    `%%score ${order.join(' ')}`,
    ...staves.map((staff) => `V:${staff.id} clef=${staff.clefs[0]} name="${staff.name}"`),
    ...interleave(staves, starts.length),
  ].join('\n');
}

/**
 * Alternates the voices line by line, so each system holds all of them. Each
 * line's voice marker restates its clef, because abcjs forgets an inline
 * clef change when it starts a new line.
 */
function interleave(staves, lineCount) {
  const out = [];
  for (let k = 0; k < lineCount; k += 1) {
    for (const staff of staves) out.push(`[V:${staff.id} clef=${staff.startClefs[k]}]`, staff.lines[k]);
  }
  return out;
}

/**
 * A one-chord tune: the steps sounded together as a whole note, with an
 * optional label above, in one clef (treble unless given). Used for the
 * canon page's allowed-move chords.
 */
export function chordTune(steps, { label, clef = 'treble' } = {}) {
  const text = label === undefined ? '' : `"^${label}"`;
  const notes = steps.map(abcPitch).join('');
  return ['X:1', 'M:none', 'L:1', 'K:C', `V:1 clef=${clef}`, `${text}[${notes}]1 |]`].join('\n');
}
