// The guide to the 3D models (models.html): a live coin, helix and Cayley
// graph, each with buttons to pick a chart's Jv. The drawings come from
// shift-model.js and cayley.js; this file only places them on the page.

import { renderModel } from './shift-model.js';
import { renderCayley } from './cayley.js';
import { sign, slug } from './chart-card.js';

// The shifts that have a chart on the charts page (the same list as charts.js).
const CHART_JVS = [0, -7, -14, -11, -9, -4, -2, 3, 5, -12, -13];

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
renderCayley(document.getElementById('graph'), CHART_JVS, (jv) => `charts.html#${slug(jv)}`);
