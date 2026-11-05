// The three-voice page: split the total shift (upper against lower) for the
// middle voice, then show the example and three pair charts for a chosen split. All the theory comes from
// src/taneyev/three-voices.js and rules.js; this file only builds the page.

import { renderChart, wireNotation, sign } from './chart-card.js';
import { renderThreeVoiceExample } from './three-voice-notation.js';
import { splitShift, pairShifts, isEasySplit, isEasyShift, fixedConsonances } from '../src/taneyev/three-voices.js';
import { pitchName, MIDDLE_C } from '../src/common/diatonic.js';

// Entry pitches offered for the lower voice: every natural from C2 to C5.
const LOWEST_CHOICES = { from: MIDDLE_C - 14, to: MIDDLE_C + 7, default: MIDDLE_C - 4 }; // default F3

const totalInput = document.getElementById('total');
const lowestSelect = document.getElementById('lowest');
const splitsBox = document.getElementById('splits');
const chartsBox = document.getElementById('pair-charts');

/** Returns a shift with a marker when it is easy, e.g. "−7 ✓". */
const shiftCell = (jv) => (isEasyShift(jv) ? `${sign(jv)} ✓` : sign(jv));

/** Returns one table row for a split. */
function splitRow(split, index) {
  const { upperMiddle, middleLower } = pairShifts(split);
  return `<tr class="${isEasySplit(split) ? 'easy' : ''}" data-index="${index}" tabindex="0" title="Show this split">
    <td>${shiftCell(upperMiddle)}</td>
    <td>${shiftCell(middleLower)}</td>
    <td>${fixedConsonances(upperMiddle).join(', ') || 'none'}</td>
    <td>${fixedConsonances(middleLower).join(', ') || 'none'}</td></tr>`;
}

/** Returns the whole table of splits. */
function splitsTable(splits) {
  const rows = splits.map((s, k) => splitRow(s, k)).join('');
  return `<table><thead><tr>
    <th scope="col">Upper–middle</th>
    <th scope="col">Middle–lower</th>
    <th scope="col">Fixed cons. upper–middle</th>
    <th scope="col">Fixed cons. middle–lower</th></tr></thead><tbody>${rows}</tbody></table>`;
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
  renderThreeVoiceExample(document.getElementById('demo'), split, Number(lowestSelect.value));
  splitsBox.querySelectorAll('tr.picked').forEach((tr) => tr.classList.remove('picked'));
  splitsBox.querySelector(`tr[data-index="${index}"]`).classList.add('picked');
}

/** Rebuilds the table for the current inputs and shows the first easy split's charts. */
function update() {
  const total = parseInt(totalInput.value, 10);
  if (!Number.isInteger(total) || Math.abs(total) > 21) return;
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

