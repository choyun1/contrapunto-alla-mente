// Renders the "Canon over a cantus firmus" section of the canon page. All the
// theory is in src/taneyev/imaginary-cantus.js (the imaginary cantus and its
// guide intervals) and src/taneyev/canon-over-cantus.js (the worked canon);
// this file only builds the page.
// Intervals are zero-indexed (step 1, 3rd 2, octave 7, 12th 11).

import { guideTable, parallelDissonantGuides, propostaChoices, GUIDE, SIDE } from '../src/taneyev/imaginary-cantus.js';
import { canonOverCantus, fittingSetups } from '../src/taneyev/canon-over-cantus.js';
import { intervalName } from '../src/taneyev/rules.js';
import { parsePitch, pitchName } from '../src/common/diatonic.js';
import { twoVoiceTune, voicesTune } from '../src/notation/abc.js';
import { block, show } from '../src/notation/playback.js';
import { fmt, sign, withArticle, entryName } from './names.js';

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

/** A setup in words, e.g. "12th above, 3 bars later, proposta below the cantus". */
function setupName({ entry, delay, side }) {
  const bars = delay === 1 ? '1 bar' : `${delay} bars`;
  return `${entryName(entry)}, ${bars} later, proposta ${side} the cantus`;
}

/** Reads the form. Returns { setup } or { error } when a pitch can't be read. */
function readForm() {
  const names = document.getElementById('cf-notes').value.split(/[\s,]+/).filter(Boolean);
  const cantus = names.map(parsePitch);
  const bad = names.filter((_, k) => cantus[k] === null);
  if (bad.length) return { error: `Can’t read: ${bad.join(', ')}. Use names like D4 or g3.` };
  const entry = Number(document.getElementById('cf-entry').value);
  const delay = Math.max(1, Number(document.getElementById('cf-delay').value));
  const side = document.getElementById('cf-side').value;
  if (cantus.length <= delay) return { error: 'Add more cantus notes than the delay.' };
  return { setup: { cantus, entry, delay, side } };
}

/** How the imaginary cantus moves, in words, e.g. "down a 12th and 3 bars earlier". */
function oppositeMove({ entry, delay }) {
  const bars = delay === 1 ? '1 bar' : `${delay} bars`;
  if (entry === 0) return `${bars} earlier`;
  const way = entry > 0 ? 'down' : 'up';
  return `${way} ${withArticle(intervalName(Math.abs(entry)))} and ${bars} earlier`;
}

/** Draws the cantus with its imaginary copy, Jv for the proposta over each bar. */
function renderHiddenCanon(parent, setup, rows) {
  const measures = rows.map((row) => ({
    voiceI: row.cantus,
    voiceII: row.imaginary,
    textI: row.jv === null ? undefined : fmt(row.jv),
  }));
  const caption = 'The cantus (CF) and its imaginary copy (Im.), moved the opposite way to the canon: '
    + `${oppositeMove(setup)}. `
    + 'The two copies make a canon of their own; it may sound wrong, and that does not matter. '
    + 'The number over each bar is the vertical shift J<sub>v</sub> the proposta must be written in there.';
  const wrap = block(parent, 'Step 2: the imaginary cantus firmus', caption);
  show(wrap, twoVoiceTune(measures, { names: ['CF', 'Im.'] }));
}

/** HTML for the bar-by-bar table: guide interval, Jv and the notes the proposta may sing. */
function renderGuideTable(setup, rows) {
  const body = rows.map((row) => {
    const choices = propostaChoices(setup, row.bar).map(pitchName).join(' ');
    if (row.guide === null) {
      return `<tr><td class="c">${row.bar + 1}</td><td>${pitchName(row.cantus)}</td><td>—</td>
        <td colspan="3">not imitated: free, against the cantus only</td><td>${choices}</td></tr>`;
    }
    return `<tr><td class="c">${row.bar + 1}</td><td>${pitchName(row.cantus)}</td><td>${pitchName(row.imaginary)}</td>
      <td>${guideName(row.guide)}</td><td class="c">${sign(row.jv)}</td><td class="c">${GUIDE_CELL[row.kind]}</td>
      <td>${choices || '<span class="no">none: needs a suspension or a 4th</span>'}</td></tr>`;
  });
  return `<div class="scroll"><table class="spans"><thead><tr><th>Bar</th><th>Cantus</th><th>Imaginary</th>
    <th>Guide interval</th><th>J<sub>v</sub></th><th>Guide</th><th>Proposta may sing</th></tr></thead>
    <tbody>${body.join('')}</tbody></table></div>`;
}

/** A warning when the guide intervals run in parallel 2nds or 7ths, or nothing. */
function renderStuckWarning(rows) {
  const stuck = parallelDissonantGuides(rows);
  if (!stuck.length) return '';
  const bars = stuck.map((k) => `${k}–${k + 1}`).join(', ');
  return `<p class="no">Parallel dissonant guide intervals in bars ${bars}. The proposta will soon run into parallel 5ths here: try another interval or distance of entrance.</p>`;
}

/** The three staves of the finished canon, top to bottom. */
const CANON_VOICES = [
  { id: 'R', key: 'risposta', name: 'R' },
  { id: 'CF', key: 'cantus', name: 'CF' },
  { id: 'P', key: 'proposta', name: 'P' },
];

/** Draws the finished whole-note canon in three voices, with playback. */
function renderCanon(parent, setup, canon) {
  const caption = 'Proposta (P), cantus firmus (CF) and risposta (R), one whole note a bar: the framework of steps 3–6. '
    + 'Every proposta note was picked from the table above, then checked against the risposta in three voices. '
    + 'Elaborate it with faster notes as step 7.';
  const wrap = block(parent, `Step 6: the framework, canon at the ${setupName(setup)}`, caption);
  show(wrap, voicesTune(canon.chords, CANON_VOICES));
}

/** Buttons for every setup with a whole-note canon over this cantus. */
function renderFitting(parent, cantus) {
  const setups = fittingSetups(cantus);
  if (!setups.length) {
    parent.insertAdjacentHTML('beforeend', '<p class="note">No setup up to a 15th and three bars has a whole-note canon over this cantus. It will need suspensions.</p>');
    return;
  }
  const buttons = setups.map((s) => `<button type="button" data-entry="${s.entry}" data-delay="${s.delay}" data-side="${s.side}">${setupName(s)}</button>`);
  parent.insertAdjacentHTML('beforeend', `<p class="note">Setups that do have one over this cantus:</p><div class="setups">${buttons.join('')}</div>`);
}

/** Renders the whole section for the form's current values. */
function run() {
  const out = document.getElementById('cf-out');
  const { setup, error } = readForm();
  if (error) {
    out.innerHTML = `<p class="no">${error}</p>`;
    return;
  }
  const rows = guideTable(setup);
  out.innerHTML = `${renderStuckWarning(rows)}<div class="examples" id="cf-hidden"></div>
    ${renderGuideTable(setup, rows)}<div class="examples" id="cf-canon"></div>`;
  renderHiddenCanon(out.querySelector('#cf-hidden'), setup, rows);
  const canonBox = out.querySelector('#cf-canon');
  const canon = canonOverCantus(setup);
  if (canon) {
    renderCanon(canonBox, setup, canon);
    return;
  }
  canonBox.insertAdjacentHTML('beforeend', '<p class="note">No whole-note framework keeps every rule with this setup: some bar needs a suspension or a decorated line, as in the video. Work backwards instead.</p>');
  renderFitting(canonBox, setup.cantus);
}

/** Fills the form from a setup button and runs it again. */
function useSetup(button) {
  document.getElementById('cf-entry').value = button.dataset.entry;
  document.getElementById('cf-delay').value = button.dataset.delay;
  document.getElementById('cf-side').value = button.dataset.side;
  run();
}

document.getElementById('cf-form').addEventListener('submit', (event) => {
  event.preventDefault();
  run();
});
document.getElementById('cf-out').addEventListener('click', (event) => {
  if (event.target.matches('.setups button')) useSetup(event.target);
});
document.getElementById('cf-side').innerHTML = Object.values(SIDE)
  .map((side) => `<option value="${side}">${side} the cantus</option>`).join('');
document.getElementById('cf-side').value = SIDE.BELOW;

run();
