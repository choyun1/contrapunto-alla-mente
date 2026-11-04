// The three-voice page: split an outer shift for the middle voice, then show
// the three pair charts for a chosen split. All the theory comes from
// src/taneyev/three-voices.js and rules.js; this file only builds the page.

import { renderChart, wireNotation, sign } from './chart-card.js';
import { renderThreeVoiceExample } from './three-voice-notation.js';
import { splitShift, pairShifts, isEasySplit, isEasyShift, fixedConsonances, middleEntry } from '../src/taneyev/three-voices.js';
import { pitchName, MIDDLE_C } from '../src/common/diatonic.js';
import { addSoundPicker } from '../src/notation/playback.js';

// Entry pitches offered for the lower voice: every natural from C2 to C5.
const LOWEST_CHOICES = { from: MIDDLE_C - 14, to: MIDDLE_C + 7, default: MIDDLE_C - 4 }; // default F3

const totalInput = document.getElementById('total');
const lowestSelect = document.getElementById('lowest');
const splitsBox = document.getElementById('splits');
const chartsBox = document.getElementById('pair-charts');

/** Returns a shift with a marker when it is easy, e.g. "−7 ✓". */
const shiftCell = (jv) => (isEasyShift(jv) ? `${sign(jv)} ✓` : sign(jv));

/** Returns the canon cell: the middle voice's entry pitch, or a dash for direct shifts. */
function canonCell(total, lowerStep, split) {
  if (total >= 0) return '–';
  return pitchName(middleEntry(lowerStep, split));
}

/** Returns one table row for a split. */
function splitRow(total, lowerStep, split, index) {
  const { upperMiddle, middleLower, upperLower } = pairShifts(split);
  return `<tr class="${isEasySplit(split) ? 'easy' : ''}" data-index="${index}">
    <td>${shiftCell(upperMiddle)}</td>
    <td>${shiftCell(middleLower)}</td>
    <td>${sign(upperMiddle)} + ${sign(middleLower)} = ${sign(upperLower)}</td>
    <td>${canonCell(total, lowerStep, split)}</td>
    <td>${fixedConsonances(upperMiddle).join(', ') || 'none'}</td>
    <td>${fixedConsonances(middleLower).join(', ') || 'none'}</td>
    <td><button type="button">Charts</button></td></tr>`;
}

/** Returns the whole table of splits. */
function splitsTable(total, lowerStep, splits) {
  const rows = splits.map((s, k) => splitRow(total, lowerStep, s, k)).join('');
  return `<table><thead><tr>
    <th scope="col">Upper–middle</th>
    <th scope="col">Middle–lower</th>
    <th scope="col">Sum</th>
    <th scope="col">Middle enters (canon)</th>
    <th scope="col">Fixed cons. upper–middle</th>
    <th scope="col">Fixed cons. middle–lower</th>
    <th></th></tr></thead><tbody>${rows}</tbody></table>`;
}

/** Returns the note under the table explaining the canon column. */
function canonNote(total, lowerStep) {
  if (total >= 0) return 'The canon column applies to inverse (negative) outer shifts only.';
  const upper = pitchName(lowerStep + Math.abs(total));
  return `Canon column: if all three voices enter with the same tune, the lower voice on ${pitchName(lowerStep)} and the upper on ${upper}, each pair’s shift is its entry interval, inverted. Fixed consonances are the intervals 0–9 that stay consonant under that pair’s shift.`;
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
  renderThreeVoiceExample(document.getElementById('demo'), split);
  splitsBox.querySelectorAll('tr.picked').forEach((tr) => tr.classList.remove('picked'));
  splitsBox.querySelector(`tr[data-index="${index}"]`).classList.add('picked');
}

/** Rebuilds the table for the current inputs and shows the first easy split's charts. */
function update() {
  const total = parseInt(totalInput.value, 10);
  if (!Number.isInteger(total) || Math.abs(total) > 21) return;
  const lowerStep = Number(lowestSelect.value);
  const splits = splitShift(total);
  splitsBox.innerHTML = splitsTable(total, lowerStep, splits);
  document.getElementById('canon-note').textContent = canonNote(total, lowerStep);
  splitsBox.querySelectorAll('tbody tr').forEach((tr) => {
    const index = Number(tr.dataset.index);
    tr.querySelector('button').addEventListener('click', () => {
      showSplit(splits[index], index);
      document.getElementById('demo').parentElement.scrollIntoView({ behavior: 'smooth' });
    });
  });
  const firstEasy = Math.max(0, splits.findIndex(isEasySplit));
  showSplit(splits[firstEasy], firstEasy);
}

for (let step = LOWEST_CHOICES.from; step <= LOWEST_CHOICES.to; step += 1) {
  const selected = step === LOWEST_CHOICES.default ? ' selected' : '';
  lowestSelect.insertAdjacentHTML('beforeend', `<option value="${step}"${selected}>${pitchName(step)}</option>`);
}
document.getElementById('outer').addEventListener('submit', (e) => {
  e.preventDefault();
  update();
});
lowestSelect.addEventListener('change', update);
update();

addSoundPicker(document.querySelector('main > header'));
