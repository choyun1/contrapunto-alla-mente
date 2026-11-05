// The three-voice page: split the total shift (upper against lower) for the
// middle voice, then show the example and three pair charts for a chosen split. All the theory comes from
// src/taneyev/three-voices.js and rules.js; this file only builds the page.

import { renderChart, wireNotation, sign } from './chart-card.js';
import { renderThreeVoiceExample } from './three-voice-notation.js';
import { splitShift, pairShifts, isEasySplit, isEasyShift, fixedConsonances } from '../src/taneyev/three-voices.js';
import { exampleForSplit, KIND, STARTING_NOTES } from '../src/taneyev/three-voice-pick.js';
import { shiftTitle } from '../src/taneyev/shifts.js';
import { mountJvPicker } from '../src/ui/jv-picker.js';
import { mountSurvey } from './split-survey.js';
import { pitchName } from '../src/common/diatonic.js';


const START = -11; // the total shift shown first: inversion at the 12th
const lowestSelect = document.getElementById('lowest');
const splitsBox = document.getElementById('splits');
const chartsBox = document.getElementById('pair-charts');

/** Returns a shift with a marker when it is easy, e.g. "−7 ✓". */
const shiftCell = (jv) => (isEasyShift(jv) ? `${sign(jv)} ✓` : sign(jv));

/** Examples already found, keyed by split and starting note: the search can take a moment. */
const found = new Map();

/** The example for a split on the chosen starting note (see three-voice-pick.js), searched once. */
function lookup(split) {
  const start = Number(lowestSelect.value);
  const key = `${split.upper} ${split.lower} ${start}`;
  if (!found.has(key)) found.set(key, exampleForSplit(split, { start }));
  return found.get(key);
}

/** The filter name for a search result: 'first', 'mixed' or 'none' (see the buttons in three-voices.html). */
function kindOf(result) {
  if (!result) return 'none';
  return result.kind === KIND.FIRST ? 'first' : 'mixed';
}

/** What the Example column says for a search result. */
function exampleCell(result) {
  if (!result) return 'none';
  if (result.kind === KIND.FIRST) return 'first species';
  return '<span class="mixed-tag">mixed species</span>';
}

/** Returns one table row for a split. */
function splitRow(split, index) {
  const { upperMiddle, middleLower } = pairShifts(split);
  return `<tr class="${isEasySplit(split) ? 'easy' : ''}" data-index="${index}" tabindex="0" title="Show this split">
    <td>${shiftCell(upperMiddle)}</td>
    <td>${shiftCell(middleLower)}</td>
    <td>${fixedConsonances(upperMiddle).join(', ') || 'none'}</td>
    <td>${fixedConsonances(middleLower).join(', ') || 'none'}</td>
    <td class="example-kind">…</td></tr>`;
}

/** Returns the whole table of splits. */
function splitsTable(splits) {
  const rows = splits.map((s, k) => splitRow(s, k)).join('');
  return `<table><thead><tr>
    <th scope="col">Upper–middle</th>
    <th scope="col">Middle–lower</th>
    <th scope="col">Fixed cons. upper–middle</th>
    <th scope="col">Fixed cons. middle–lower</th>
    <th scope="col">Example</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/** Shows the three pair charts for one split and marks its row. */
function showSplit(split, index) {
  const { upperMiddle, middleLower, upperLower } = pairShifts(split);
  chartsBox.innerHTML = [
    renderChart(upperMiddle, 'Upper and middle voices', 'Write the upper voice against the middle by this chart.', { id: 'pair-upper-middle' }),
    renderChart(middleLower, 'Middle and lower voices', 'Write the middle voice against the lower by this chart.', { id: 'pair-middle-lower' }),
    renderChart(upperLower, 'Upper and lower voices', 'The outer pair, at the total shift.', { id: 'pair-upper-lower' }),
  ].join('');
  wireNotation(chartsBox);
  renderThreeVoiceExample(document.getElementById('demo'), split, lookup(split));
  splitsBox.querySelectorAll('tr.picked').forEach((tr) => tr.classList.remove('picked'));
  splitsBox.querySelector(`tr[data-index="${index}"]`).classList.add('picked');
}

/**
 * Fills the Example column one row at a time, yielding between rows so the
 * page stays responsive while the searches run. A newer table stops an older fill.
 */
function fillExampleColumn(splits, table) {
  let k = 0;
  const next = () => {
    if (k >= splits.length || !table.isConnected) return;
    const row = table.querySelector(`tr[data-index="${k}"]`);
    const result = lookup(splits[k]);
    row.querySelector('.example-kind').innerHTML = exampleCell(result);
    row.dataset.kind = kindOf(result);
    k += 1;
    countFilters(table);
    setTimeout(next, 0);
  };
  setTimeout(next, 0);
}

/** Labels each filter button with how many rows it shows, e.g. "Mixed species (2)". */
function countFilters(table) {
  document.querySelectorAll('.split-filter button').forEach((button) => {
    const name = button.textContent.replace(/ \(\d+\)$/, '');
    const { filter } = button.dataset;
    const rows = filter === 'all' ? table.querySelectorAll('tbody tr') : table.querySelectorAll(`tbody tr[data-kind="${filter}"]`);
    button.textContent = `${name} (${rows.length})`;
  });
}

/** Shows only the rows of one kind, or all of them. */
function setFilter(filter) {
  splitsBox.dataset.filter = filter;
  document.querySelectorAll('.split-filter button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  });
}

let total = START;

/** Rebuilds the table for the current total and starting note and shows the first easy split's charts. */
function update() {
  const splits = splitShift(total);
  splitsBox.innerHTML = splitsTable(splits);
  splitsBox.querySelectorAll('tbody tr').forEach((tr) => {
    const index = Number(tr.dataset.index);
    const pick = () => {
      showSplit(splits[index], index);
      document.getElementById('demo').parentElement.scrollIntoView({ behavior: 'smooth' });
    };
    tr.addEventListener('click', pick);
    tr.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); // stops Space from scrolling the page
      pick();
    });
  });
  const firstEasy = Math.max(0, splits.findIndex(isEasySplit));
  showSplit(splits[firstEasy], firstEasy);
  const table = splitsBox.querySelector('table');
  countFilters(table);
  fillExampleColumn(splits, table);
}

for (let step = STARTING_NOTES.from; step <= STARTING_NOTES.to; step += 1) {
  const selected = step === STARTING_NOTES.default ? ' selected' : '';
  lowestSelect.insertAdjacentHTML('beforeend', `<option value="${step}"${selected}>${pitchName(step)}</option>`);
}
/** Shows one split of one total, from the list at the bottom, and scrolls to its example. */
function goTo(jv, split) {
  total = jv;
  picker.set(jv);
  setFilter('all');
  update();
  const splits = splitShift(jv);
  const index = splits.findIndex((s) => s.upper === split.upper && s.lower === split.lower);
  showSplit(splits[index], index);
  document.getElementById('demo').parentElement.scrollIntoView({ behavior: 'smooth' });
}

const survey = mountSurvey(document.getElementById('survey'), { onPick: goTo });

/** Starts the list at the bottom over for the chosen starting note. */
const restartSurvey = () => survey.restart(Number(lowestSelect.value), pitchName(Number(lowestSelect.value)));

const picker = mountJvPicker(document.getElementById('total-pick'), {
  label: 'Total J<sub>v</sub>',
  title: shiftTitle,
  onPick: (jv) => {
    total = jv;
    picker.set(jv);
    update();
  },
});
picker.set(START);
document.querySelectorAll('.split-filter button').forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});
document.getElementById('start-pick').addEventListener('submit', (e) => e.preventDefault());
lowestSelect.addEventListener('change', () => {
  update();
  restartSurvey();
});
update();
restartSurvey();

