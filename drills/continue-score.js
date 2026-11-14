// The score for the Continue the proposta drill: the notebook's opening with
// your notes in, the risposta copying them, and the CF. Display only; the
// voices come from src/taneyev/canon-continue.js and every verdict from its
// checks. Times are in whole notes, a bar of 4/4 each.

import { readVoices, unitLength, voiceIds } from '../src/notation/abc-read.js';
import { timelineAbc } from '../src/notation/abc-timeline.js';
import { beamedAbc } from '../src/notation/beams.js';
import { block, showWithAudio } from '../src/notation/playback.js';
import { canonVoices, writtenNotes, SLOT, VOICE } from '../src/taneyev/canon-continue.js';

/** How many bars the score shows: to the end of R's copy of the canon, or the notebook's last bar. */
export function barsShown(abc, drill) {
  const fileBars = Object.values(readVoices(abc))[0].length;
  return Math.min(fileBars, drill.end + drill.delay);
}

/** The header lines of the notebook's abc (X, M, L, K) and the V: lines of the drill's voices, in its order. */
function headerOf(abc, ids) {
  return abc.split('\n').filter((line) => {
    if (/^[XMLK]:/.test(line)) return true;
    const voice = /^V:\s*(\S+)/.exec(line)?.[1];
    return voice !== undefined && ids.includes(voice);
  });
}

/** The drill's voices in the notebook's staff order: P, R and the CF when there is one. */
export const staffOrder = (abc) => voiceIds(abc).filter((id) => Object.values(VOICE).includes(id));

/**
 * The abc for the score with `steps` written: the notes still to write are
 * invisible rests, so the bars keep their width.
 */
export function drillAbc(abc, drill, steps) {
  const ids = staffOrder(abc);
  const voices = canonVoices(drill, steps);
  const bars = barsShown(abc, drill);
  const unit = unitLength(abc);
  const music = ids.map((id) => `[V:${id}] ${timelineAbc(voices[id], { unit, key: drill.key, bars, gaps: 'hidden' })}`);
  return beamedAbc(`${[...headerOf(abc, ids), ...music].join('\n')}\n`);
}

/**
 * For each sounding note of P on the score, in order, the index of the note
 * you wrote that it belongs to (a held note belongs to the one it is tied
 * from), or null for the given opening.
 */
function propostaOwners(drill, steps) {
  const owners = drill.given.filter((note) => note.step !== null).map(() => null);
  let written = -1;
  for (const note of writtenNotes(drill, steps)) {
    if (note.slot === SLOT.WRITE) written += 1;
    if (note.step !== null) owners.push(written);
  }
  return owners;
}

/** The note elements abcjs drew on one staff, rests left out, in order. */
function staffNotes(tune, staff) {
  return tune.lines.flatMap((line) => line.staff?.[staff]?.voices[0] ?? [])
    .filter((element) => element.el_type === 'note' && !element.rest);
}

/** Adds a class to every SVG piece of a drawn note. */
const mark = (element, name) => element.abselem?.elemset.forEach((piece) => piece.classList?.add(name));

/**
 * Draws the score into `parent` with a Play button (string trio), coloring
 * each of your notes by its verdict: `kinds[k]` is a class for the k-th note
 * you wrote ('cont-miss', 'cont-check', 'cont-pending', 'cont-ok').
 */
export function drawScore(parent, abc, drill, steps, kinds) {
  parent.innerHTML = '';
  const wrap = block(parent, 'The canon so far', 'Black: the notebook’s opening. Colored: your notes. R copies them a delay later.');
  const drawn = drillAbc(abc, drill, steps);
  const tune = showWithAudio(wrap, drawn, drawn);
  const ids = staffOrder(abc);
  const owners = propostaOwners(drill, steps);
  staffNotes(tune, ids.indexOf(VOICE.P)).forEach((element, k) => {
    if (owners[k] !== null && owners[k] !== undefined) mark(element, kinds[owners[k]]);
  });
}
