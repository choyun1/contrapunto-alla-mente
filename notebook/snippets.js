// Small excerpts of the notebook's examples, for the procedure steps: a few
// bars of some voices, with labels over chosen bars, interval numbers over
// or under each note, and the bars to color. No DOM here, so the tests can
// use it too; notebook.js draws and colors them.
//
// A step's `snippet` names an example file and the bars to show:
//   { file, bars: [first, last], voices?, labels?, color?, numbers? }
// bars are counted from 1, as written; `voices` picks staves (all when left
// out); `labels` is { voice: { bar: text } }; `color` is
// [[voice, bar, 'a' | 'b'], ...]; `numbers` is { against, above, below },
// voice ids, for the interval numbers Cho wrote on IC p. 29: each note's
// distance from the cantus in zero-indexed steps (unison 0, 5th 4, octave 7;
// negative below it).

import { voiceIds, voiceMusic } from '../src/notation/abc-read.js';
import { timelines } from './score.js';

/** A bar line in a music line: |, ||, |], |: or :|. */
const BAR_LINE = /:?\|[|\]:]?/;

/** One note or rest, with any annotations written before it. */
const NOTE = /((?:"[^"]*")*)([_=^]*[A-Ga-gz][,']*[\d/]*-?)/g;

/** A voice's music as the text of each bar: 'C2 F2- | F E A2 |]' → ['C2 F2-', 'F E A2']. */
export function barTexts(music) {
  return music.split(BAR_LINE).map((text) => text.trim()).filter((text) => text !== '');
}

/** A bar's text with `before(index)` written ahead of each note or rest, counted from 0. */
function beforeNotes(text, before) {
  let index = -1;
  return text.replace(NOTE, (_, annotations, note) => {
    index += 1;
    return `${annotations}${before(index)}${note}`;
  });
}

/** Each note's interval from the `against` voice sounding with it, in steps, or null for a rest: one list per bar. */
function intervalNumbers(abc, id, against, [first, last]) {
  const voices = timelines(abc);
  const under = (t) => voices[against].find((n) => t >= n.start - 1e-9 && t < n.start + n.length - 1e-9);
  const bars = [];
  for (let bar = first; bar <= last; bar++) {
    const notes = voices[id].filter((n) => n.start >= bar - 1 - 1e-9 && n.start < bar - 1e-9);
    bars.push(notes.map((n) => (n.step === null ? null : n.step - under(n.start).step)));
  }
  return bars;
}

/** The music of one voice in the excerpt, with its labels and numbers written in. */
function excerptOf(abc, id, snippet) {
  const [first, last] = snippet.bars;
  const bars = barTexts(voiceMusic(abc)[id]).slice(first - 1, last);
  const { numbers } = snippet;
  const place = numbers?.above?.includes(id) ? '^' : numbers?.below?.includes(id) ? '_' : null;
  const counted = place ? intervalNumbers(abc, id, numbers.against, snippet.bars) : null;
  return bars.map((text, i) => {
    const bar = first + i;
    let out = text;
    if (counted) {
      out = beforeNotes(out, (n) => (counted[i][n] === null || counted[i][n] === undefined ? '' : `"${place}${String(counted[i][n]).replace("-", "−")}"`));
    }
    const label = snippet.labels?.[id]?.[bar];
    if (label) out = beforeNotes(out, (n) => (n === 0 ? `"^${label}"` : ''));
    return out;
  }).join(' | ');
}

/**
 * The excerpt as abc, and which notes to color: { abc, colors: [{ voice,
 * bar, color }] }, voice counted from 0 (top staff) and bar from 0 within
 * the excerpt, as abcjs numbers them.
 */
export function snippetAbc(abc, snippet) {
  const ids = snippet.voices ?? voiceIds(abc);
  const lines = abc.split('\n');
  const header = lines.filter((line) => /^[A-Z]:/.test(line) && !/^V:/.test(line));
  const voiceLines = ids.map((id) => lines.find((line) => new RegExp(`^V:\\s*${id}\\b`).test(line)));
  const music = ids.map((id) => `[V:${id}] ${excerptOf(abc, id, snippet)} |]`);
  const colors = (snippet.color ?? []).map(([id, bar, color]) => ({ voice: ids.indexOf(id), bar: bar - snippet.bars[0], color }));
  return { abc: [...header, ...voiceLines, ...music, ''].join('\n'), colors };
}
