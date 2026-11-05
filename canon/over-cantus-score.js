// The canon over a cantus firmus page: the editable score. One staff per voice
// in the chosen order, plus the imaginary cantus (I.C.F.) in gray at the
// bottom, which is drawn but not played. Bars with a problem are drawn red,
// and the note under the entry cursor in the accent color.
// Display only: the risposta and imaginary cantus come from
// src/taneyev/canon-check.js and src/taneyev/imaginary-cantus.js.
// Intervals are zero-indexed (octave 7, 12th 11).

import { chordAt } from '../src/taneyev/canon-check.js';
import { imaginaryCantus, guideTable } from '../src/taneyev/imaginary-cantus.js';
import { LABEL } from '../src/taneyev/canon-voices.js';
import { voicesTune, clefsOf } from '../src/notation/abc.js';
import { CLEFS } from '../src/notation/clefs.js';
import { block, showEditable } from '../src/notation/playback.js';
import { fmt } from './names.js';

/** The key and label of the imaginary cantus staff. */
const IMAGINARY = { id: 'I', key: 'imaginary', name: '(I.C.F.)' };

/** The sounding staves in the chosen order, top to bottom. Jv is written over the proposta. */
const soundingVoices = (order) => order.map((key) => ({
  id: LABEL[key],
  key,
  name: LABEL[key],
  textKey: key === 'proposta' ? 'text' : undefined,
}));

/** Every staff of the drawn score: the sounding voices, then the imaginary cantus. */
export const drawnVoices = (order) => [...soundingVoices(order), IMAGINARY];

/** One measure per bar: each voice's pitch (null for a rest) and the proposta's Jv as text. */
function measuresFor(proposta, setup) {
  const imaginary = imaginaryCantus(setup.cantus, setup.entry, setup.delay);
  const rows = guideTable(setup);
  return setup.cantus.map((_, bar) => ({
    ...chordAt(proposta, setup, bar),
    imaginary: imaginary[bar],
    text: rows[bar].jv === null ? undefined : fmt(rows[bar].jv),
  }));
}

/** Draws bars with problems in red, leaving the imaginary cantus gray. */
function markProblems(wrap, problems, imaginaryIndex) {
  problems.forEach((list, bar) => {
    if (!list.length) return;
    wrap.querySelectorAll(`.abcjs-note.abcjs-mm${bar}`).forEach((note) => {
      if (!note.classList.contains(`abcjs-v${imaginaryIndex}`)) note.style.color = 'var(--no)';
    });
  });
}

/** HTML list of the problems, bar by bar, or a line saying every bar passes. */
function problemsHtml(proposta, problems) {
  const empty = proposta.filter((note) => note === null).length;
  const items = problems
    .map((list, bar) => (list.length ? `<li>Bar ${bar + 1}: ${list.join('; ')}.</li>` : ''))
    .filter(Boolean);
  if (items.length) return `<ol class="problems no">${items.join('')}</ol>`;
  if (empty) return `<p class="note">No problems so far; ${empty} bar${empty === 1 ? '' : 's'} of the proposta still to write.</p>`;
  return '<p class="yes">Every bar keeps the rules.</p>';
}

/** Draws the note or rest under the cursor in the accent color. */
function markCursor(wrap, cursor, voices) {
  const voice = voices.findIndex((v) => v.key === cursor.voice);
  wrap.querySelectorAll(`.abcjs-v${voice}.abcjs-mm${cursor.bar}`).forEach((element) => {
    if (/abcjs-(note|rest)(?: |$)/.test(element.getAttribute('class'))) element.style.color = 'var(--accent)';
  });
}

/**
 * The pitch a click asks for: the bottom line of the bar's clef, plus the
 * steps above it the click landed (staff-click.js).
 */
function pitchAt(spot, measures, key) {
  const clef = clefsOf(measures, key)[spot.bar];
  return CLEFS[clef].bottom + spot.stepsAboveBottom;
}

/**
 * Draws the editable score into `parent`. A click on a staff calls
 * `onPlace(bar, voiceKey, pitch)`, e.g. (3, 'proposta', 30) for E4 in bar 4.
 */
export function renderScore(parent, { proposta, setup, problems, cursor, title, caption }, onPlace) {
  parent.replaceChildren();
  const voices = drawnVoices(setup.order);
  const measures = measuresFor(proposta, setup);
  const wrap = block(parent, title, caption);
  const drawn = voicesTune(measures, voices, { sortByPitch: false });
  const heard = voicesTune(measures, soundingVoices(setup.order), { sortByPitch: false });
  showEditable(wrap, drawn, heard, (spot) => {
    const key = voices[spot.voice]?.key;
    if (key) onPlace(spot.bar, key, pitchAt(spot, measures, key));
  });
  wrap.querySelector('.score').classList.add('cf-score');
  markProblems(wrap, problems, voices.length - 1);
  markCursor(wrap, cursor, voices);
  wrap.insertAdjacentHTML('beforeend', problemsHtml(proposta, problems));
}
