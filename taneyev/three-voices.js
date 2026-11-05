// The three-voice page: split the total shift (upper against lower) for the
// middle voice, then show the example and three pair charts for a chosen split. All the theory comes from
// src/taneyev/three-voices.js and rules.js; this file only builds the page.

import { renderChart, wireNotation, sign } from './chart-card.js';
import { renderThreeVoiceExample } from './three-voice-notation.js';
import { splitShift, pairShifts, isEasySplit, isEasyShift, fixedConsonances } from '../src/taneyev/three-voices.js';
import { exampleForSplit, STARTING_NOTES } from '../src/taneyev/three-voice-pick.js';
import { shiftTitle } from '../src/taneyev/shifts.js';
import { mountJvPicker } from '../src/ui/jv-picker.js';
import { mountSurvey } from './split-survey.js';
import { kindFor } from './survey-data.js';
import { kindTag } from './kind-tag.js';
import { pitchName } from '../src/common/diatonic.js';


const START = -11; // the total shift shown first: inversion at the 12th
const lowestSelect = document.getElementById('lowest');
const splitsBox = document.getElementById('splits');
const chartsBox = document.getElementById('pair-charts');

/** Returns a shift with a marker when it is easy, e.g. "−7 ✓". */
const shiftCell = (jv) => (isEasyShift(jv) ? `${sign(jv)} ✓` : sign(jv));

/** The chosen starting note, as a diatonic step. */
const startStep = () => Number(lowestSelect.value);

/**
 * The example for a split on the chosen starting note. The answer key says
 * whether one exists (survey-data.js), so only a split that has one is searched.
 */
function lookup(split) {
  if (!kindFor(startStep(), split)) return null;
  return exampleForSplit(split, { start: startStep() });
}

/** Returns one table row for a split. */
function splitRow(split, index) {
  const { upperMiddle, middleLower } = pairShifts(split);
  const kind = kindFor(startStep(), split) ?? 'none';
  return `<tr class="${isEasySplit(split) ? 'easy' : ''}" data-index="${index}" data-kind="${kind}" tabindex="0" title="Show this split">
    <td>${shiftCell(upperMiddle)}</td>
    <td>${shiftCell(middleLower)}</td>
    <td>${fixedConsonances(upperMiddle).join(', ') || 'none'}</td>
    <td>${fixedConsonances(middleLower).join(', ') || 'none'}</td>
    <td>${kindTag(kindFor(startStep(), split))}</td></tr>`;
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
  countFilters(splitsBox.querySelector('table'));
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

/** Lists the answer key for the chosen starting note. */
const showSurvey = () => survey.show(startStep(), pitchName(startStep()));

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
  showSurvey();
});
update();
showSurvey();

