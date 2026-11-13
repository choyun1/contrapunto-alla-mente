// The canon over a cantus firmus page: the bar-by-bar guide table (steps 2–3)
// and the list of setups that work. Display only: the guide intervals come
// from src/taneyev/imaginary-cantus.js and the setups from
// src/taneyev/canon-over-cantus.js.
// Intervals are zero-indexed (step 1, 3rd 2, octave 7, 12th 11).

import { guideTable, parallelDissonantGuides, propostaChoices, GUIDE } from '../src/taneyev/imaginary-cantus.js';
import { orderName } from '../src/taneyev/canon-voices.js';
import { intervalName } from '../src/taneyev/rules.js';
import { pitchName } from '../src/common/diatonic.js';
import { sign } from './names.js';
import { batheSpot } from '../src/taneyev/bathe.js';
import { SIDE } from '../src/taneyev/imaginary-cantus.js';

/** How each kind of guide interval is shown in the table. */
const GUIDE_CELL = {
  [GUIDE.SIMPLE]: '<span class="sw k-fixed-consonance">simple</span>',
  [GUIDE.CONSONANT]: '<span class="sw k-variable-consonance">consonant</span>',
  [GUIDE.DISSONANT]: '<span class="sw k-variable-dissonance">hard</span>',
};

/** The guide interval in words, e.g. "10th, imaginary below". */
function guideName(guide) {
  if (guide === 0) return 'unison';
  return `${intervalName(Math.abs(guide))}, imaginary ${guide > 0 ? 'below' : 'above'}`;
}

/** A setup in words, e.g. "R / CF / P, 12th, 3 bars later". */
export function setupName({ order, size, delay }) {
  const bars = delay === 1 ? '1 bar' : `${delay} bars`;
  return `${orderName(order)}, ${intervalName(size)}, ${bars} later`;
}

/** Does Bathe's table (bathe.html) cover this setup? Only with the cantus below both canon voices. */
const batheFits = (setup) => setup.side === SIDE.ABOVE && setup.rispostaSide === SIDE.ABOVE;

/** The Bathe cell for a bar, "place 5, course 2" linked to its Jv row, or '' when the table does not apply. */
function batheCell(setup, row) {
  if (!batheFits(setup)) return '';
  if (row.guide === null) return '<td>—</td>';
  const later = setup.cantus[row.bar + setup.delay];
  const { place, course } = batheSpot(setup.entry, later - row.cantus);
  const jv = (((row.guide % 7) + 7) % 7);
  return `<td><a href="bathe.html#bathe-jv${jv}">place ${place}, course ${course}</a></td>`;
}

/** One table row for a bar with no imaginary cantus (its proposta note is never copied). */
function freeRow(row, choices, bathe) {
  return `<tr><td class="c">${row.bar + 1}</td><td>${pitchName(row.cantus)}</td><td>—</td>
    <td colspan="3">not imitated: free, against the cantus only</td><td>${choices}</td>${bathe}</tr>`;
}

/** One table row: the guide interval, Jv, how hard it is, and the notes that fit. */
function guideRow(row, choices, bathe) {
  const fits = choices || '<span class="no">none: needs a suspension or a 4th</span>';
  return `<tr><td class="c">${row.bar + 1}</td><td>${pitchName(row.cantus)}</td><td>${pitchName(row.imaginary)}</td>
    <td>${guideName(row.guide)}</td><td class="c">${sign(row.jv)}</td><td class="c">${GUIDE_CELL[row.kind]}</td>
    <td>${fits}</td>${bathe}</tr>`;
}

/** A warning when the guide intervals run in parallel 2nds or 7ths, or ''. */
function stuckWarning(rows) {
  const stuck = parallelDissonantGuides(rows);
  if (!stuck.length) return '';
  const bars = stuck.map((k) => `${k}–${k + 1}`).join(', ');
  return `<p class="no">Parallel dissonant guide intervals in bars ${bars}. The proposta will soon run into parallel 5ths here: try another interval or distance of entrance.</p>`;
}

/** HTML for the bar-by-bar table, with any warning above it. */
export function guideTableHtml(setup) {
  const rows = guideTable(setup);
  const body = rows.map((row) => {
    const choices = propostaChoices(setup, row.bar).map(pitchName).join(' ');
    const bathe = batheCell(setup, row);
    return row.guide === null ? freeRow(row, choices, bathe) : guideRow(row, choices, bathe);
  });
  const batheHead = batheFits(setup) ? '<th><a href="bathe.html">Bathe’s table</a></th>' : '';
  return `${stuckWarning(rows)}<div class="scroll"><table class="spans"><thead><tr><th>Bar</th><th>Cantus</th>
    <th>Imaginary</th><th>Guide interval</th><th>J<sub>v</sub></th><th>Guide</th><th>Proposta may sing</th>${batheHead}</tr></thead>
    <tbody>${body.join('')}</tbody></table></div>`;
}

/** HTML buttons for setups, each carrying its order, size and delay as data. */
export function setupButtonsHtml(setups) {
  if (!setups.length) {
    return '<p class="note">No order, interval up to a 15th or delay up to three bars has a whole-note framework over this cantus. It will need suspensions.</p>';
  }
  const buttons = setups.map((s) => `<button type="button" data-order="${s.order.join(' ')}" data-size="${s.size}" data-delay="${s.delay}">${setupName(s)}</button>`);
  return `<p class="note">These setups have one:</p><div class="setups">${buttons.join('')}</div>`;
}
