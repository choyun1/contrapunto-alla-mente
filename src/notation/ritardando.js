// A playback-only ritardando: a slight, gradual slowing through one bar,
// heard but not drawn (Cho, 2026-11-14, IC p. 19). It works by adding inline
// tempo fields, [Q:1/4=N], to the abc that is played (never to the one that
// is drawn). abcjs applies an inline tempo to every voice from that point on,
// so one field per beat, in whichever voice has a note on that beat, is
// enough; the bars after it stay at the slowest tempo, for the final chord.
//
// An example asks for one with `ritardando: 8`, the bar to slow through,
// counted from 1, in common time (four quarter-note beats). This holds no
// music theory.
//
// Note: breaths (breaths.js) are placed by written time, so a breath inside
// or after the ritardando would land in the wrong place; put them before it.

import { keySignature, readBars, unitLength } from './abc-read.js';

/** The tempo at the end of the ritardando, as a share of the starting tempo. */
export const SLOWEST = 0.85;

/** Beats in a bar of common time. */
const BEATS = 4;

/** A quarter-note beat, in whole notes. */
const BEAT = 1 / 4;

/** The tempo for each beat of the ritardando, slowing a little more each beat: 90 → [87, 83, 80, 77]. */
export function ritardandoTempos(qpm, slowest = SLOWEST) {
  const tempos = [];
  for (let beat = 1; beat <= BEATS; beat += 1) {
    tempos.push(Math.round(qpm * (1 - ((1 - slowest) * beat) / BEATS)));
  }
  return tempos;
}

/**
 * Where to put each beat's tempo field: for every beat of `bar` (from 1),
 * the first note that starts on it, or failing that the first that starts
 * within it, in any voice, as { line, at } (the line's index in the abc and
 * the text position in that line). A beat where nothing starts is left out.
 */
function beatPlaces(lines, bar) {
  const unit = unitLength(lines.join('\n'));
  const key = keySignature(lines.join('\n'));
  const places = new Map(); // beat → { line, at, time }
  lines.forEach((text, line) => {
    const head = /^\[V:[^\]]*\]\s*/.exec(text);
    if (!head) return;
    const notes = readBars(text.slice(head[0].length), unit, key, true)[bar - 1] ?? [];
    let time = 0;
    for (const note of notes) {
      const beat = Math.floor(time / BEAT + 1e-9);
      const earlier = places.has(beat) && places.get(beat).time <= time;
      if (beat < BEATS && !earlier) places.set(beat, { line, at: head[0].length + note.at, time });
      time += note.length;
    }
  });
  return places;
}

/** The abc with a ritardando through `bar` (from 1), starting from `qpm` quarters a minute. */
export function withRitardando(abc, bar, qpm, slowest = SLOWEST) {
  const lines = abc.split('\n');
  const tempos = ritardandoTempos(qpm, slowest);
  const places = [...beatPlaces(lines, bar).entries()];
  // insert from the end of each line backwards, so earlier positions stay right
  places.sort((a, b) => b[1].at - a[1].at);
  for (const [beat, { line, at }] of places) {
    const text = lines[line];
    lines[line] = `${text.slice(0, at)}[Q:1/4=${tempos[beat]}] ${text.slice(at)}`;
  }
  return lines.join('\n');
}
