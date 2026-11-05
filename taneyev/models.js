// The guide to the 3D models (models.html): a live coin, helix and Cayley
// graph, each with buttons to pick a chart's Jv. The drawings come from
// shift-model.js and cayley.js; this file only places them on the page.

import { renderModel } from './shift-model.js';
import { renderCayley } from './cayley.js';
import { sign, slug } from './chart-card.js';
import { BOOK_SHIFTS } from '../src/taneyev/shifts.js';
import { ALL_ELEMENTS, word, cycles, consonancesKept, tiName } from '../src/taneyev/symmetry.js';
import { intervalName } from '../src/taneyev/rules.js';

// The shifts Taneyev works through: the Cayley graph fills their dots.
const BOOK_JVS = BOOK_SHIFTS.map((entry) => entry.jv);

// The shifts the guide offers on each model, and the one it starts on.
const PICKS = {
  coin: { jvs: [0, -7, -11, -9, -4, 3], start: -11 },
  helix: { jvs: [-7, -14, -11, 3], start: -7 },
};

/** Fills a row of Jv buttons that drive `model`, marking the chosen one. */
function wirePicker(row, jvs, start, model) {
  row.innerHTML = `<span>J<sub>v</sub></span> ${jvs
    .map((jv) => `<button type="button" data-jv="${jv}" aria-pressed="${jv === start}">${sign(jv)}</button>`).join(' ')}`;
  row.classList.add('model-bar');
  row.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    row.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    model.setJv(Number(button.dataset.jv));
  }));
}

for (const [name, { jvs, start }] of Object.entries(PICKS)) {
  const model = renderModel(document.getElementById(name), start, { model: name });
  wirePicker(document.querySelector(`[data-picker="${name}"]`), jvs, start, model);
}
renderCayley(document.getElementById('graph'), BOOK_JVS, (jv) => `charts.html#${slug(jv)}`);

/** The shifts that act as symmetry e, counted within two octaves: e.g. '−11, −4'. */
function jvsFor(e) {
  if (e.kind === 'turn') return [e.step, e.step + 7].map(sign).join(', ');
  const k = e.step === 0 ? 7 : e.step;
  return [-k - 7, -k].map(sign).join(', ');
}

/** One row of the names table: the symmetry's T/I name, word, cycles, meaning, shifts and consonances kept. */
function nameRow(e) {
  const jv = e.kind === 'turn' ? e.step : -(7 + e.step);
  const what = e.kind === 'turn'
    ? (e.step === 0 ? 'no motion' : `turn: shift up a ${intervalName(e.step)}`)
    : `flip: inversion at the ${intervalName(7 + e.step)}`;
  return `<tr><td><b>${tiName(e)}</b></td><td>${word(e)}</td><td>${cycles(e)}</td><td>${what}</td><td>${jvsFor(e)}</td><td>${consonancesKept(jv)} of 4</td></tr>`;
}

document.getElementById('names').innerHTML = ALL_ELEMENTS.map(nameRow).join('');
