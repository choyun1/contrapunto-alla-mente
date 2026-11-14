// Writes one voice back into abc music text from a timeline of notes, the
// opposite of abc-read.js: [{ start, length, step, semitones, tie }] in whole
// notes, bars a whole note long (4/4). Gaps are filled with rests, or with
// invisible rests (`x`) for notes not written yet, so every bar is full.
// Accidentals are written where a note's semitones differ from what the key
// and the bar so far would give it. No theory here.

import { semitonesInKey } from '../common/diatonic.js';
import { abcPitch } from './abc.js';

const EPS = 1e-9;

/** The abc length text of `length` whole notes in a tune whose unit is `unit`: 1 → '', 2 → '2', 1/2 → '/', 3/2 → '3/2'. */
export function lengthText(length, unit) {
  const units = length / unit;
  if (Math.abs(units - 1) < EPS) return '';
  let bottom = 1;
  while (Math.abs(units * bottom - Math.round(units * bottom)) > EPS) bottom *= 2;
  const top = Math.round(units * bottom);
  if (bottom === 1) return String(top);
  if (top === 1 && bottom === 2) return '/';
  return `${top === 1 ? '' : top}/${bottom}`;
}

/** abc accidental signs by semitones raised from the plain letter. */
const SIGN = { '-2': '__', '-1': '_', 0: '=', 1: '^', 2: '^^' };

/** The voice's notes with rests filling every gap up to `end`, each cut at the bar lines. */
function filled(notes, end, gaps) {
  const out = [];
  let at = 0;
  const pushGap = (to) => {
    while (at < to - EPS) {
      const barEnd = Math.floor(at + EPS) + 1;
      const until = Math.min(to, barEnd);
      out.push({ start: at, length: until - at, step: null, gap: gaps });
      at = until;
    }
  };
  for (const note of notes) {
    if (note.start >= end - EPS) break;
    pushGap(note.start);
    out.push(note);
    at = note.start + note.length;
  }
  pushGap(end);
  return out;
}

/** One note's abc: accidental if needed, pitch, length, tie. `inBar` holds the bar's accidentals so far, by step. */
function noteText(note, unit, key, inBar, tiedOver) {
  const length = lengthText(note.length, unit);
  if (note.step === null) return `${note.gap === 'hidden' ? 'x' : 'z'}${length}`;
  const plain = semitonesInKey(note.step, {}); // the letter with no accidental
  const current = inBar.has(note.step) ? inBar.get(note.step) : semitonesInKey(note.step, key) - plain;
  const wanted = note.semitones - plain;
  let sign = '';
  if (!tiedOver && wanted !== current) {
    sign = SIGN[wanted];
    inBar.set(note.step, wanted);
  }
  return `${sign}${abcPitch(note.step)}${length}${note.tie ? '-' : ''}`;
}

/**
 * The music text for one voice, `bars` bars long: notes, then rests in any
 * gap. `gaps: 'hidden'` writes the gaps as invisible rests (for notes still to
 * be written); otherwise they are ordinary rests. Ends with a final bar line.
 */
export function timelineAbc(notes, { unit, key = {}, bars, gaps = 'rest' }) {
  const parts = [];
  let bar = 0;
  let inBar = new Map();
  let previous = null;
  for (const note of filled(notes, bars, gaps)) {
    const noteBar = Math.floor(note.start + EPS);
    while (bar < noteBar) {
      parts.push('|');
      bar += 1;
      inBar = new Map();
    }
    const tiedOver = previous?.tie && previous.step === note.step;
    parts.push(noteText(note, unit, key, inBar, tiedOver));
    previous = note;
  }
  return `${parts.join(' ')} |]`;
}
