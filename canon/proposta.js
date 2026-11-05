// Renders the canon proposta table and checker. All the theory is in
// src/taneyev/canon.js; this file only builds the page.
// Intervals and spans are zero-indexed (step 1, 3rd 2, octave 7).

import { spanTable, checkProposta, moveChord, VERDICT } from '../src/taneyev/canon.js';
import { intervalName } from '../src/taneyev/rules.js';
import { examplesBothWays, EXAMPLE_ENTRIES } from '../src/taneyev/canon-examples.js';
import { parsePitch, pitchName, letterOf, MIDDLE_C } from '../src/common/diatonic.js';
import { twoVoiceTune, chordTune } from '../src/notation/abc.js';
import { intoVocalRange } from '../src/notation/range.js';
import { block, show, drawSmall } from '../src/notation/playback.js';
import { fmt, sign, withArticle, entryName } from './names.js';

/** Plain words for a span, e.g. "up a 3rd", "repeat". */
function spanName(span) {
  if (span === 0) return 'repeat the note';
  const size = Math.abs(span) === 1 ? 'step' : intervalName(Math.abs(span));
  return `${span > 0 ? 'up' : 'down'} ${withArticle(size)}`;
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
    <div class="examples"></div>
    <div class="scroll"><table class="spans"><thead><tr>
      <th>Proposta moves</th><th>span</th><th><i>n</i></th><th>Between the voices</th><th>Verdict</th>
      <th>Risposta suspended</th><th>Proposta suspended</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>`;
}

/** Which voice leads, in words, e.g. "Proposta in the upper voice". */
const leaderName = (entry) => (entry < 0 ? 'Proposta in the upper voice' : 'Proposta in the lower voice');

/** Draws one generated first-species canon. */
function renderExample(parent, example) {
  const { entry, proposta, risposta, intervals } = example;
  const measures = proposta.map((step, bar) => ({
    voiceI: step,
    voiceII: risposta[bar],
    textI: intervals[bar] === null ? undefined : `${bar === 1 ? 'n = ' : ''}${fmt(intervals[bar])}`,
  }));
  const moves = proposta.slice(1).map((step, k) => spanName(step - proposta[k]));
  const sounding = intervals.filter((n) => n !== null).map((n) => intervalName(Math.abs(n)));
  const caption = `Proposta (P): ${moves.join(', ')}. Between the voices: ${sounding.join(', ')}. `
    + `The number over each bar is n = ${fmt(entry)} − span, zero-indexed.`;
  const title = entry === 0
    ? 'First species, risposta (R) one bar later at the unison'
    : `${leaderName(entry)}: risposta (R) one bar later at the ${entryName(entry)} (J<sub>v</sub> = ${sign(entry)})`;
  const wrap = block(parent, title, caption);
  show(wrap, twoVoiceTune(intoVocalRange(measures), { names: ['P', 'R'] }));
  renderMoveChord(wrap, entry);
}

/**
 * Adds the allowed-move chord under an example: from C, every note the
 * proposta may reach one delay later, stacked (Cho's compact chart).
 */
function renderMoveChord(wrap, entry) {
  // Around C5 when the proposta is on top, C4 otherwise, so both sit on the treble staff.
  const start = entry < 0 ? MIDDLE_C + 7 : MIDDLE_C;
  const steps = moveChord(entry).map((span) => start + span);
  const names = steps.map(letterOf).join(', ');
  const box = document.createElement('div');
  box.className = 'move-chord';
  box.innerHTML = `<div class="chord-score"></div>
    <p class="note">From C, the proposta may move to <b>${names}</b> (one delay later). This is the consonance chord C–E–G–A, ${chordHow(entry)}.</p>`;
  wrap.append(box);
  drawSmall(box.querySelector('.chord-score'), chordTune(steps), 90);
}

/** How the move chord comes from the consonance chord, in words. */
function chordHow(entry) {
  if (entry === 0) return 'above and below the note, since at the unison the voices cross';
  if (entry < 0) return `transposed down ${withArticle(intervalName(-entry))}`;
  return `turned upside down and transposed up ${withArticle(intervalName(entry))}`;
}

/** Draws the canon at one interval both ways round, so each voice leads in turn. */
function renderExamples(parent, entry) {
  for (const example of examplesBothWays(entry)) {
    if (example) renderExample(parent, example);
    else parent.insertAdjacentHTML('beforeend', '<p class="note">No four-bar first-species canon this way round keeps every rule.</p>');
  }
}

/** Shows the table and example for one interval of entrance. */
function showTable(entry) {
  const section = document.getElementById('table');
  section.innerHTML = renderTable(entry);
  renderExamples(section.querySelector('.examples'), entry);
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
    if (r.similar) problems.push('similar motion into a perfect consonance');
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

document.getElementById('links').innerHTML = EXAMPLE_ENTRIES
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

showTable(EXAMPLE_ENTRIES[0]);
runCheck();

