// Reads the small part of abc notation (https://abcnotation.com) that the
// notebook's hand-written examples use, so they can be tested and so a voice
// can be added before drawing.
//
// The examples are written one line per voice, `[V:P] z2 A B | c3 d/c/ | ...`,
// with an `L:` unit length and a `K:` key. Read here: pitches A–G and a–g
// with commas and apostrophes, accidentals ^ = _, rests `z`, lengths such as
// 2, 3/2, / and //, ties `-` and bar lines; annotations in quotes are skipped.
// Nothing else.
//
// Pitches come back twice: as diatonic steps (src/common/diatonic.js: C4 = 28),
// which is what interval numbers count, and as semitones from C0 (C4 = 48),
// with the key signature and accidentals applied, so a tritone can be told
// from a perfect 4th or 5th. Lengths are in whole notes (a quarter is 0.25).
// As in abc, an accidental holds for that pitch until the bar line, and a
// tied note keeps it across the bar line.

import { MIDDLE_C, semitonesOf } from '../common/diatonic.js';

const LETTERS = 'CDEFGAB';

/** One note or rest of the music text: accidentals, letter, octave marks, length, tie. */
const NOTE = /([_=^]*)([A-Ga-gz])([,']*)([\d/]*)(-?)/y;

/** Sharps (positive) or flats (negative) in the signature of each major key and its relative minor. */
const FIFTHS = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5,
  Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, Dm: -1, Gm: -2, Cm: -3, Fm: -4,
};

/** The order sharps are added to a key signature; flats go the other way. */
const SHARP_ORDER = 'FCGDAEB';

/** The key signature of the `K:` line as semitones per letter: K:D → { F: 1, C: 1 }. */
export function keySignature(abc) {
  const name = /^K:\s*([A-G][#b]?m?)/m.exec(abc)?.[1] ?? 'C';
  const fifths = FIFTHS[name] ?? 0;
  const letters = fifths >= 0 ? SHARP_ORDER.slice(0, fifths) : [...SHARP_ORDER].reverse().join('').slice(0, -fifths);
  return Object.fromEntries([...letters].map((letter) => [letter, Math.sign(fifths)]));
}

/** Semitones an accidental sign sets: ^ +1, ^^ +2, _ −1, __ −2, = 0. */
const ALTERATION = { '^': 1, '^^': 2, _: -1, __: -2, '=': 0 };

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
 * One voice's music as bars of notes: [[{ step, semitones, length, tie }, ...], ...].
 * A rest has step and semitones null. With `withPositions`, each note also
 * has `at`, where its text starts in `music`. Lengths are in whole notes, given the
 * unit length; `key` is the signature from keySignature (none by default).
 */
export function readBars(music, unit, key = {}, withPositions = false) {
  const bars = [[]];
  let inBar = {}; // accidentals written so far in this bar, by step
  let previous = null;
  let at = 0;
  while (at < music.length) {
    const char = music[at];
    if (char === '|') {
      // a bar line: '|', '||' or the final '|]'
      at += music.slice(at).match(/^\|[|\]]?/)[0].length;
      bars.push([]);
      inBar = {};
      continue;
    }
    if (char === '"') {
      // an annotation or chord symbol, such as "^free": text, not notes
      at = music.indexOf('"', at + 1) + 1 || music.length;
      continue;
    }
    NOTE.lastIndex = at;
    const match = NOTE.exec(music);
    if (!match) { at += 1; continue; } // a space or anything not read
    const [, sign, letter, marks, length, tie] = match;
    const note = { step: null, semitones: null, length: lengthOf(length) * unit, tie: tie === '-' };
    if (withPositions) note.at = at;
    if (letter !== 'z') {
      note.step = stepOf(letter, marks);
      if (sign) inBar[note.step] = ALTERATION[sign];
      note.semitones = semitonesOf(note.step) + alterationOf(note.step, letter, inBar, key, previous);
    }
    bars.at(-1).push(note);
    previous = note;
    at = NOTE.lastIndex;
  }
  return bars.filter((bar) => bar.length > 0);
}

/**
 * The semitones a note is raised or lowered: a tie from the same pitch keeps
 * the tied note's, then this bar's accidental for the step, then the key.
 */
function alterationOf(step, letter, inBar, key, previous) {
  if (previous?.tie && previous.step === step && !(step in inBar)) {
    return previous.semitones - semitonesOf(step);
  }
  if (step in inBar) return inBar[step];
  return key[letter.toUpperCase()] ?? 0;
}

/** The voice ids in the order the header declares them, e.g. ['R', 'P', 'CF']. */
export function voiceIds(abc) {
  return [...abc.matchAll(/^V:\s*(\S+)/gm)].map((match) => match[1]);
}

/** Every voice's music text, keyed by voice id, its lines joined: { P: 'z2 A B | c3 d/c/ |]', ... }. */
export function voiceMusic(abc) {
  const music = {};
  for (const match of abc.matchAll(/^\[V:\s*([^\]\s]+)\]\s*(.*)$/gm)) {
    music[match[1]] = music[match[1]] === undefined ? match[2] : `${music[match[1]]} ${match[2]}`;
  }
  return music;
}

/** Every voice's bars, keyed by voice id: { P: [[...], ...], R: [...] }. */
export function readVoices(abc) {
  const unit = unitLength(abc);
  const key = keySignature(abc);
  const music = voiceMusic(abc);
  return Object.fromEntries(Object.entries(music).map(([id, text]) => [id, readBars(text, unit, key)]));
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
