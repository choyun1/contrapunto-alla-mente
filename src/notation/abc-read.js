// Reads the small part of abc notation (https://abcnotation.com) that the
// notebook's hand-written examples use, so they can be tested and so a voice
// can be added before drawing.
//
// The examples are written one line per voice, `[V:P] z2 A B | c3 d/c/ | ...`,
// with an `L:` unit length. Read here: pitches A–G and a–g with commas and
// apostrophes, accidentals (skipped: steps are diatonic), rests `z`, lengths
// such as 2, 3/2, / and //, ties `-` and bar lines. Nothing else.
//
// Pitches come back as diatonic steps (src/common/diatonic.js: C4 = 28) and
// lengths in whole notes (a quarter is 0.25).

import { MIDDLE_C } from '../common/diatonic.js';

const LETTERS = 'CDEFGAB';

/** One note or rest of the music text: accidentals, letter, octave marks, length, tie. */
const NOTE = /([_=^]*)([A-Ga-gz])([,']*)([\d/]*)(-?)/y;

/** The `L:` unit length in whole notes (1/4 when the header has none). */
export function unitLength(abc) {
  const match = /^L:\s*(\d+)\/(\d+)/m.exec(abc);
  return match ? Number(match[1]) / Number(match[2]) : 1 / 4;
}

/** A length written after a note (`2`, `3/2`, `/`, `//`, `/4`), in units. */
function lengthOf(text) {
  if (text === '') return 1;
  if (/^\/+$/.test(text)) return 1 / 2 ** text.length;
  const [top, bottom] = text.split('/');
  const numerator = top === '' ? 1 : Number(top);
  if (bottom === undefined) return numerator;
  return numerator / (bottom === '' ? 2 : Number(bottom));
}

/** The diatonic step of a letter with its octave marks: C → 28, c → 35, C, → 21, c' → 42. */
function stepOf(letter, marks) {
  const base = MIDDLE_C + LETTERS.indexOf(letter.toUpperCase()) + (letter === letter.toLowerCase() ? 7 : 0);
  const up = marks.split("'").length - 1;
  const down = marks.split(',').length - 1;
  return base + 7 * (up - down);
}

/**
 * One voice's music as bars of notes: [[{ step, length, tie }, ...], ...].
 * A rest has step null. Lengths are in whole notes, given the unit length.
 */
export function readBars(music, unit) {
  const bars = [[]];
  let at = 0;
  while (at < music.length) {
    const char = music[at];
    if (char === '|') {
      // a bar line: '|', '||' or the final '|]'
      at += music.slice(at).match(/^\|[|\]]?/)[0].length;
      bars.push([]);
      continue;
    }
    NOTE.lastIndex = at;
    const match = NOTE.exec(music);
    if (!match) { at += 1; continue; } // a space or anything not read
    const [, , letter, marks, length, tie] = match;
    bars.at(-1).push({
      step: letter === 'z' ? null : stepOf(letter, marks),
      length: lengthOf(length) * unit,
      tie: tie === '-',
    });
    at = NOTE.lastIndex;
  }
  return bars.filter((bar) => bar.length > 0);
}

/** The voice ids in the order the header declares them, e.g. ['R', 'P', 'CF']. */
export function voiceIds(abc) {
  return [...abc.matchAll(/^V:\s*(\S+)/gm)].map((match) => match[1]);
}

/** Every voice's bars, keyed by voice id: { P: [[...], ...], R: [...] }. */
export function readVoices(abc) {
  const unit = unitLength(abc);
  const music = {};
  for (const match of abc.matchAll(/^\[V:\s*([^\]\s]+)\]\s*(.*)$/gm)) {
    music[match[1]] = `${music[match[1]] ?? ''} ${match[2]}`;
  }
  return Object.fromEntries(Object.entries(music).map(([id, text]) => [id, readBars(text, unit)]));
}

/**
 * The abc with one more voice after the others: a `V:` header line after the
 * last one, and its music line at the end.
 */
export function withVoice(abc, header, music) {
  const lines = abc.trimEnd().split('\n');
  const lastHeader = lines.findLastIndex((line) => /^V:/.test(line));
  lines.splice(lastHeader + 1, 0, header);
  return `${lines.join('\n')}\n${music}\n`;
}
