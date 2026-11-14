// Bathe's canon table page (bathe.html): the table as Bathe printed it, the
// same table as Taneyev shifts, and the grid that turns one into the other.
// Display only: every number comes from src/taneyev/bathe.js and rules.js.
// Bathe counts 1-indexed (unison 1, 5th 5), as printed; Taneyev's numbers are
// zero-indexed (unison 0, 5th 4, octave 7), and each table says which it uses.

import { PLACES, COURSES, MISPRINT, batheTable, batheGuide } from '../src/taneyev/bathe.js';
import { chart, intervalName } from '../src/taneyev/rules.js';
import { slug, sign } from '../taneyev/chart-card.js';
import { MOVES, drawMove } from './bathe-examples.js';
import { mountFold } from './bathe-fold.js';
import { mountChords } from './bathe-chords.js';
import { mountWheel } from './bathe-wheel.js';

const $ = (id) => document.getElementById(id);

/** The column heads shared by Bathe's two grids: place up, with the place down under it. */
const placeHead = () => PLACES.map(({ up, down }) => `<th class="c">${up}<br><small>${down} down</small></th>`).join('');

/** A row head: course up, with the course down beside it. */
const courseHead = ({ up, down }) => `<th class="c">${up} <small>(${down} down)</small></th>`;

/** One number in a printed cell, as a button that shows its move chord (bathe-chords.js). */
const numberButton = (leader, place) =>
  `<button type="button" class="bn" data-place="${place}" data-leader="${leader}">${leader}</button>`;

/** One printed cell, with the misprint starred. */
function printedCell(numbers, course, place) {
  const misprint = course === MISPRINT.course && place === MISPRINT.place;
  const star = misprint ? '<sup title="Printed 3 6; the editors’ correction">*</sup>' : '';
  const buttons = numbers.map((leader) => numberButton(leader, place)).join(' ');
  return `<td class="c" data-place="${place}" data-cell="${numbers.join(' ')}">${buttons}${star}</td>`;
}

/** Bathe's table as he printed it (with the misprint corrected): 1-indexed. */
function batheHtml() {
  const table = batheTable();
  const rows = COURSES.map((course, row) => {
    const cells = PLACES.map(({ up: place }, col) => printedCell(table[row][col], course.up, place));
    return `<tr>${courseHead(course)}${cells.join('')}</tr>`;
  });
  return `<div class="scroll"><table class="spans bathe"><thead><tr><th>Course ↓ / place →</th>${placeHead()}</tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>`;
}

/** The grid of Jv per cell: place − course, zero-indexed, each a link to its row below. */
function jvGridHtml() {
  const rows = COURSES.map((course) => {
    const cells = PLACES.map(({ up: place }) => {
      const jv = batheGuide(place, course.up);
      return `<td class="c"><a href="#bathe-jv${jv}">${sign(jv)}</a></td>`;
    });
    return `<tr>${courseHead(course)}${cells.join('')}</tr>`;
  });
  return `<div class="scroll"><table class="spans bathe"><thead><tr><th>Course ↓ / place →</th>${placeHead()}</tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>`;
}

/** The leader's intervals above the cantus within an octave, m = 0 to 6 (zero-indexed), as Bathe's cells count them. */
const COLUMNS = [0, 1, 2, 3, 4, 5, 6];

/** One row of the Taneyev form: Jv, then for each m its derivative n = m + Jv and whether both are consonant. */
function taneyevRow(jv) {
  const marks = chart(jv, { width: 6 });
  const cells = COLUMNS.map((m) => {
    const { kind } = marks[m];
    return `<td class="c"><span class="sw k-${kind}" title="${intervalName(m)} becomes ${intervalName(m + jv)}">${m} → ${m + jv}</span></td>`;
  });
  const fits = COLUMNS.filter((m) => marks[m].kind === 'fixed-consonance').map((m) => m + 1).join(' ');
  return `<tr id="bathe-jv${jv}"><th class="c"><a href="../taneyev/charts.html#${slug(jv)}">${sign(jv)}</a></th>${cells.join('')}<td class="c">${fits}</td></tr>`;
}

/** The whole table as Taneyev shifts: one row per Jv from 0 to +6. */
function taneyevHtml() {
  const head = COLUMNS.map((m) => `<th class="c">${m}</th>`).join('');
  const rows = [0, 1, 2, 3, 4, 5, 6].map(taneyevRow);
  return `<div class="scroll"><table class="spans bathe"><thead><tr><th>J<sub>v</sub></th>${head}<th>Bathe’s cell</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>`;
}

$('bathe-table').innerHTML = batheHtml();
$('bathe-grid').innerHTML = jvGridHtml();
$('bathe-taneyev').innerHTML = taneyevHtml();
mountChords($('bathe-table'), $('bathe-chord'));

/** Fills the move picker, a 3rd up first, and draws the cards for the chosen move. */
function mountExamples() {
  const pick = $('bathe-move');
  pick.innerHTML = MOVES.map((m, i) => `<option value="${i}">${m.name}</option>`).join('');
  pick.value = String(MOVES.findIndex((m) => m.steps === 2));
  const draw = () => drawMove($('bathe-exs'), MOVES[Number(pick.value)].steps);
  pick.addEventListener('change', draw);
  draw();
}

mountExamples();
mountFold($('bathe-fold'));
mountWheel($('bathe-wheel'));
