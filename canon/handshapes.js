// Renders the canon handshapes page. All the theory is in
// src/taneyev/canon-hands.js; this file only builds the page.
// Intervals are zero-indexed (3rd 2, 5th 4, octave 7); pitches are diatonic steps.

import {
  handMoves, stackedChord, chordSymbol, rispostaNote, sameNamesBelow,
} from '../src/taneyev/canon-hands.js';
import { intervalName } from '../src/taneyev/rules.js';
import { parsePitch, pitchName, letterOf, MIDDLE_C } from '../src/common/diatonic.js';
import { chordTune } from '../src/notation/abc.js';
import { drawSmall } from '../src/notation/playback.js';
import { mountJvPicker } from '../src/ui/jv-picker.js';
import { keyboard } from '../src/ui/keyboard.js';
import { withArticle, entryName, handName } from './names.js';

const START_ENTRY = 4; // canon at the 5th above
const CHORD_WIDTH = 90;

/** Plain words for a span, e.g. "up a 3rd", "down a step", "repeat". */
function spanName(span) {
  if (span === 0) return 'repeat';
  const size = Math.abs(span) === 1 ? 'step' : intervalName(Math.abs(span));
  return `${span > 0 ? 'up' : 'down'} ${withArticle(size)}`;
}

/** Treble or bass, whichever suits the notes. */
const clefFor = (steps) => (Math.min(...steps) < MIDDLE_C - 3 ? 'bass' : 'treble');

/** The allowed notes lit on the keyboard (no finger numbers on the keys). */
const litMoves = (moves) => new Map(moves.map((m) => [m.step, 'kb-on']));

/** The keyboard for one canon from `from`, with P on the old note and R on the risposta's. */
function canonKeyboard(from, entry) {
  const moves = handMoves(from, entry);
  const risposta = rispostaNote(from, entry);
  const steps = [...moves.map((m) => m.step), from, risposta];
  const tags = [{ step: risposta, text: 'R', kind: 'r' }];
  if (from !== risposta) tags.push({ step: from, text: 'P', kind: 'p' });
  return keyboard(Math.min(...steps) - 1, Math.max(...steps) + 1, tags, { lit: litMoves(moves) });
}

/** Draws the hand chord and the stacked chord for one canon into `box`. */
function drawChords(box, from, entry) {
  const hand = handMoves(from, entry).map((m) => m.step);
  const stacked = stackedChord(from, entry);
  box.innerHTML = `<figure><div class="chord-score"></div><figcaption>Under the hand</figcaption></figure>
    <figure><div class="chord-score"></div><figcaption>Stacked in thirds: <b>${chordSymbol(stacked)}</b></figcaption></figure>`;
  const [handBox, stackBox] = box.querySelectorAll('.chord-score');
  drawSmall(handBox, chordTune(hand, { clef: clefFor(hand) }), CHORD_WIDTH);
  drawSmall(stackBox, chordTune(stacked, { clef: clefFor(stacked) }), CHORD_WIDTH);
}

/** HTML rows listing each move: note, move, interval between the voices. */
function movesTable(from, entry) {
  const rows = handMoves(from, entry).map((m) => `<tr><td>${pitchName(m.step)}</td><td>${spanName(m.span)}</td>
    <td>${intervalName(Math.abs(m.n))}</td><td>${m.finger}</td>
    <td><span class="sw ${m.perfect ? 'k-variable-consonance' : 'k-fixed-consonance'}">${m.perfect ? 'perfect' : 'free'}</span></td></tr>`);
  return `<table class="spans"><thead><tr><th>Note</th><th>Proposta moves</th><th>Between the voices</th>
    <th>Finger</th><th>Verdict</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

/** Shows the chosen canon from the chosen note. */
function showCanon() {
  const entry = Number(document.getElementById('entry-pick-select').value);
  const from = Number(document.getElementById('from').value);
  const risposta = rispostaNote(from, entry);
  document.getElementById('canon-title').textContent = `Canon at the ${entryName(entry)}`;
  document.getElementById('canon-how').textContent = `The proposta played ${pitchName(from)} one delay ago, so the risposta now sings `
    + `${pitchName(risposta)}. Thumb on ${pitchName(risposta)}, ${handName(entry)}.`;
  document.getElementById('canon-keys').innerHTML = canonKeyboard(from, entry);
  drawChords(document.getElementById('canon-chords'), from, entry);
  document.getElementById('canon-moves').innerHTML = movesTable(from, entry);
}

/** The three shapes with the risposta on C4: proposta above, below, and the unison. */
function showShapes() {
  const c4 = parsePitch('C4');
  const shapes = [
    { id: 'shape-above', from: c4 + 7, entry: -7 },
    { id: 'shape-below', from: c4 - 7, entry: 7 },
    { id: 'shape-unison', from: c4, entry: 0 },
  ];
  for (const { id, from, entry } of shapes) {
    const figure = document.getElementById(id);
    const moves = handMoves(from, entry);
    const steps = moves.map((m) => m.step);
    figure.querySelector('.kb').innerHTML = keyboard(Math.min(...steps) - 1, Math.max(...steps) + 1,
      [{ step: c4, text: 'R', kind: 'r' }], { lit: litMoves(moves) });
    drawChords(figure.querySelector('.chords'), from, entry);
  }
}

/** The table of canons that share note names, from C. */
function showPairs() {
  const rows = [1, 2, 3, 4, 5, 6, 7].map((size) => {
    const names = handMoves(0, size).map((m) => letterOf(m.step));
    const sortedNames = [...new Set(names)].sort((a, b) => 'CDEFGAB'.indexOf(a) - 'CDEFGAB'.indexOf(b));
    return `<tr><td>${intervalName(size)}</td><td>${intervalName(sameNamesBelow(size))}</td><td>${sortedNames.join(' ')}</td></tr>`;
  });
  document.querySelector('#pairs tbody').innerHTML = rows.join('');
}

/** Fills the starting-note dropdown, C3 to C5. */
function fillFromSelect() {
  const select = document.getElementById('from');
  for (let step = parsePitch('C3'); step <= parsePitch('C5'); step += 1) select.add(new Option(pitchName(step), step));
  select.value = String(parsePitch('C4'));
  select.addEventListener('change', showCanon);
}

const picker = mountJvPicker(document.getElementById('entry-pick'), {
  label: 'Interval of entrance J<sub>v</sub>',
  title: (entry) => `Canon at the ${entryName(entry)}`,
  onPick: (entry) => {
    picker.set(entry);
    showCanon();
  },
});
fillFromSelect();
picker.set(START_ENTRY);
showCanon();
showShapes();
showPairs();
