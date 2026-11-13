// The canon over a cantus firmus page: William Bathe's table (c. 1596), with
// the cells the current setup uses marked by bar number. Display only: the
// table and its numbers come from src/taneyev/bathe.js.
// Bathe counts 1-indexed (unison 1, 5th 5), as printed; the rest of the page
// is zero-indexed.

import { PLACES, COURSES, MISPRINT, batheTable, batheSpot } from '../src/taneyev/bathe.js';
import { SIDE } from '../src/taneyev/imaginary-cantus.js';

/** Does Bathe's table cover this setup? It needs both canon voices above the cantus. */
export const batheFits = (setup) => setup.side === SIDE.ABOVE && setup.rispostaSide === SIDE.ABOVE;

/** The bars of the setup by the cell they fall in, as a map from "course/place" to bar numbers (from 1). */
function barsByCell(setup) {
  const cells = new Map();
  const { cantus, entry, delay } = setup;
  cantus.forEach((note, bar) => {
    const later = cantus[bar + delay];
    if (later === undefined) return;
    const { place, course } = batheSpot(entry, later - note);
    const key = `${course}/${place}`;
    cells.set(key, [...(cells.get(key) ?? []), bar + 1]);
  });
  return cells;
}

/** One cell: its numbers, the bars that use it, and the misprint's note. */
function cellHtml(numbers, course, place, bars) {
  const misprint = course === MISPRINT.course && place === MISPRINT.place;
  const text = numbers.join(' ') + (misprint ? '<sup title="Printed 3 6; the editors’ correction">*</sup>' : '');
  if (!bars) return `<td class="c">${text}</td>`;
  return `<td class="c bathe-on" title="bars ${bars.join(', ')}">${text}<br><small>bar ${bars.join(', ')}</small></td>`;
}

/** A line under the table saying whether, and how, it covers this setup. */
function fitNote(setup) {
  if (batheFits(setup)) {
    return '<p class="note">Marked: the cells your setup uses, by bar. Each bar’s place is the interval of entrance and its course is the cantus’s move over the delay.</p>';
  }
  return '<p class="note">Bathe’s table covers only canons with the cantus below both voices (“the plaine Song or ground being sung beneth them”), so nothing is marked for this order. Choose CF at the bottom to see it used.</p>';
}

/** HTML for the whole table, with the current setup's cells marked when it fits. */
export function batheTableHtml(setup) {
  const used = batheFits(setup) ? barsByCell(setup) : new Map();
  const table = batheTable();
  const head = PLACES.map(({ up, down }) => `<th class="c">${up}<br><small>${down} down</small></th>`).join('');
  const rows = COURSES.map(({ up: course, down }, row) => {
    const cells = PLACES.map(({ up: place }, col) => cellHtml(table[row][col], course, place, used.get(`${course}/${place}`)));
    return `<tr><th class="c">${course} <small>(${down} down)</small></th>${cells.join('')}</tr>`;
  });
  return `<div class="scroll"><table class="spans bathe"><thead><tr><th>Course ↓ / place →</th>${head}</tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>${fitNote(setup)}`;
}
