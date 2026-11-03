// Renders the canon proposta table and checker. All the theory is in
// src/taneyev/canon.js; this file only builds the page.
// Intervals and spans are zero-indexed (step 1, 3rd 2, octave 7).

import { spanTable, checkProposta, VERDICT } from '../src/taneyev/canon.js';
import { intervalName } from '../src/taneyev/rules.js';
import { parsePitch, pitchName } from '../src/common/diatonic.js';

// Common intervals of entrance, risposta above first, then below.
const ENTRIES = [0, 7, -7, 4, -4, 3, -3, 11, -11, 2, -2, 5, -5, 9, -9, 14, -14];

/** Display name for an interval of entrance, e.g. "octave above". */
function entryName(entry) {
  if (entry === 0) return 'unison';
  return `${intervalName(Math.abs(entry))} ${entry > 0 ? 'above' : 'below'}`;
}

const fmt = (n) => (n < 0 ? `−${-n}` : String(n));
const sign = (n) => (n > 0 ? `+${n}` : fmt(n));

/** Plain words for a span, e.g. "up a 3rd", "repeat". */
function spanName(span) {
  if (span === 0) return 'repeat the note';
  const size = Math.abs(span) === 1 ? 'step' : intervalName(Math.abs(span));
  const article = /^(octave|8|11)/.test(size) ? 'an' : 'a';
  return `${span > 0 ? 'up' : 'down'} ${article} ${size}`;
}

/** Display name for a canon interval n, saying which voice is on top. */
function canonName(n) {
  const where = n < 0 ? ', risposta below' : '';
  return `${intervalName(Math.abs(n))}${where}`;
}

const VERDICT_CELL = {
  [VERDICT.FREE]: '<span class="sw k-fixed-consonance">free</span>',
  [VERDICT.PERFECT]: '<span class="sw k-variable-consonance"><b>perfect</b></span>',
  [VERDICT.SUSPENSION]: '<span class="sw k-fixed-dissonance">susp.</span>',
};

/** Suspension marks for a row, or nothing when the interval is consonant. */
const marksCell = (row, voice) => (row.verdict === VERDICT.SUSPENSION ? row[voice] : '');

/** HTML for the table of one interval of entrance. */
function renderTable(entry) {
  const rows = spanTable(entry).map((row) => `<tr>
      <td>${spanName(row.span)}</td><td class="c">${sign(row.span)}</td>
      <td class="c">${fmt(row.n)}</td><td>${canonName(row.n)}</td>
      <td class="c">${VERDICT_CELL[row.verdict]}</td>
      <td class="c">${marksCell(row, 'risposta')}</td><td class="c">${marksCell(row, 'proposta')}</td></tr>`);
  const allowed = spanTable(entry)
    .filter((row) => row.verdict !== VERDICT.SUSPENSION)
    .map((row) => spanName(row.span));
  return `<header><h2><span class="jv">J<sub>v</sub> = ${sign(entry)}</span> Canon at the ${entryName(entry)}</h2>
    <p class="formula"><i>n</i> = ${fmt(entry)} − span</p>
    <p class="note">Consonant moves across the delay: ${allowed.join(', ')}.</p></header>
    <div class="scroll"><table class="spans"><thead><tr>
      <th>Proposta moves</th><th>span</th><th><i>n</i></th><th>Between the voices</th><th>Verdict</th>
      <th>Risposta suspended</th><th>Proposta suspended</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>`;
}

/** Shows the table for one interval of entrance. */
function showTable(entry) {
  document.getElementById('table').innerHTML = renderTable(entry);
}

/** HTML report for a proposta, or an error message. */
function renderReport(text, entry, delay) {
  const names = text.split(/[\s,]+/).filter(Boolean);
  const steps = names.map(parsePitch);
  const bad = names.filter((_, k) => steps[k] === null);
  if (bad.length) return `<p class="no">Can’t read: ${bad.join(', ')}. Use names like D4 or g3.</p>`;
  if (steps.length <= delay) return '<p class="note">Add more notes than the delay.</p>';
  const rows = checkProposta(steps, entry, delay).map((r) => {
    const problems = [];
    if (r.verdict === VERDICT.SUSPENSION) problems.push('dissonant: needs a suspension');
    if (r.consecutive) problems.push('consecutive perfects');
    const status = problems.length ? `<span class="no">${problems.join('; ')}</span>` : '<span class="yes">ok</span>';
    return `<tr><td class="c">${r.index + 1}</td><td>${pitchName(steps[r.index - delay])} → ${pitchName(steps[r.index])}</td>
      <td>${spanName(r.span)}</td><td>${canonName(r.n)}</td><td>${status}</td></tr>`;
  });
  return `<div class="scroll"><table class="spans"><thead><tr><th>Note</th><th>Proposta across the delay</th>
    <th>Move</th><th>Between the voices</th><th>Result</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

/** Runs the checker on the form's current values. */
function runCheck() {
  const text = document.getElementById('notes').value;
  const entry = Number(document.getElementById('entry').value);
  const delay = Math.max(1, Number(document.getElementById('delay').value));
  document.getElementById('report').innerHTML = renderReport(text, entry, delay);
}

document.getElementById('links').innerHTML = ENTRIES
  .map((entry) => `<button type="button" data-entry="${entry}" title="${entryName(entry)}">${sign(entry)}</button>`)
  .join(' ');
document.getElementById('links').addEventListener('click', (event) => {
  const entry = event.target.dataset.entry;
  if (entry !== undefined) showTable(Number(entry));
});
document.getElementById('custom').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = document.getElementById('jvin').value;
  if (value !== '') showTable(Number(value));
});
document.getElementById('check').addEventListener('submit', (event) => {
  event.preventDefault();
  runCheck();
});

showTable(7);
runCheck();
