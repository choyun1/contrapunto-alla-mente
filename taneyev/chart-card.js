// One consonance chart as an HTML card: the working rows, the combined rules
// and the notation panel. Shared by the charts page and the three-voice page.
// All the theory comes from src/taneyev/rules.js; this file only builds markup.

import { renderNotation } from './notation.js';
import { selfQuestions } from '../src/taneyev/self-questions.js';
import { chart, baseMarks, isPerfect, intervalName, forbidsSimilarMotion, parallelSurvives } from '../src/taneyev/rules.js';

const fmt = (n) => (n < 0 ? `−${-n}` : String(n));
export const sign = (jv) => (jv > 0 ? `+${jv}` : fmt(jv));
export const slug = (jv) => `jv${jv < 0 ? 'm' : 'p'}${Math.abs(jv)}`;
const num = (i) => (isPerfect(i) ? `<b>${fmt(i)}</b>` : fmt(i));
const tds = (xs, cls) => xs.map((x) => `<td class="${cls}">${x}</td>`).join('');
/** Returns the chart's formula, e.g. "n = m + Jv = m − 7" (zero-indexed intervals; Taneyev's basic formula, § to check against the book). */
function formula(jv) {
  const general = '<i>n</i> = <i>m</i> + J<sub>v</sub>';
  if (jv === 0) return `${general} = <i>m</i>`;
  const op = jv < 0 ? '−' : '+';
  return `${general} = <i>m</i> ${op} ${Math.abs(jv)}`;
}
/** Returns the "Ask yourself" reminders for a shift (self-questions.js), or '' when there are none. */
function askYourself(jv) {
  const items = selfQuestions(jv).map((q) => `<li><b>${q.question}</b> ${q.answer}</li>`);
  return items.length ? `<div class="ask"><h3>Ask yourself</h3><ul>${items.join('')}</ul></div>` : '';
}
const yn = (b) => `<span class="${b ? 'yes' : 'no'}">${b ? 'yes' : 'no'}</span>`;

/**
 * Returns the HTML for one chart card. `id` defaults to the shift's slug, e.g. "jvm11".
 * `data-jv` on the card lets the docked 3D model (model-dock.js) follow the chart in view.
 */
export function renderChart(jv, title, note, { id = slug(jv) } = {}) {
  const cols = chart(jv);
  const ms = cols.map((c) => c.m);
  const ns = ms.map((m) => m + jv);
  const working = jv === 0 ? '' : `
    <tr class="w"><th></th>${tds(ms.map((m) => baseMarks(m).above), 'mk')}</tr>
    <tr class="w"><th scope="row">Original <i>m</i></th>${tds(ms.map(num), 'nm')}</tr>
    <tr class="w"><th></th>${tds(ms.map((m) => baseMarks(m).below), 'mk')}</tr>
    <tr class="w sep"><th></th>${tds(ns.map((n) => baseMarks(n).above), 'mk')}</tr>
    <tr class="w"><th scope="row">Derivative <i>n</i></th>${tds(ns.map(num), 'nm')}</tr>
    <tr class="w"><th></th>${tds(ns.map((n) => baseMarks(n).below), 'mk')}</tr>`;
  const result = `
    <tr class="r${jv === 0 ? '' : ' rule'}"><th></th>${tds(cols.map((c) => c.above), 'mk')}</tr>
    <tr class="r"><th scope="row">${jv === 0 ? 'Interval' : 'Rules for <i>m</i>'}</th>${cols
      .map((c) => `<td class="nm k-${c.kind}" title="${intervalName(c.m)}: ${c.kind.replace('-', ' ')}">${c.perfect ? `<b>${c.m}</b>` : c.m}</td>`)
      .join('')}</tr>
    <tr class="r"><th></th>${tds(cols.map((c) => c.below), 'mk')}</tr>`;
  const fixed = cols.filter((c) => c.kind === 'fixed-consonance').map((c) => c.m).join(', ') || 'none';
  const similar = forbidsSimilarMotion(jv)
    ? '<div><dt>Similar motion</dt><dd><span class="no">none into any consonance (§101)</span></dd></div>' : '';
  return `<section class="chart" id="${id}" data-jv="${jv}">
    <header><h2><span class="jv">J<sub>v</sub> = ${sign(jv)}</span> ${title}</h2>
    <p class="formula">${formula(jv)}</p>
    <p class="note">${note}</p>
    ${askYourself(jv)}
    <dl class="facts"><div><dt>Fixed consonances</dt><dd>${fixed}</dd></div>
      <div><dt>Parallel 3rds</dt><dd>${yn(parallelSurvives(2, jv))}</dd></div>
      <div><dt>Parallel 6ths</dt><dd>${yn(parallelSurvives(5, jv))}</dd></div>
      <div><dt>Parallel 10ths</dt><dd>${yn(parallelSurvives(9, jv))}</dd></div>${similar}</dl></header>
    <div class="scroll"><table><tbody>${working}${result}</tbody></table></div>
    <details class="notation" data-jv="${jv}"><summary>See and hear it in notation</summary>
      <div class="examples"></div></details></section>`;
}

/** Draws a chart's notation the first time its panel is opened. */
export function wireNotation(root) {
  root.querySelectorAll('details.notation').forEach((panel) => {
    panel.addEventListener('toggle', () => {
      const box = panel.querySelector('.examples');
      if (panel.open && !box.hasChildNodes()) renderNotation(box, Number(panel.dataset.jv));
    });
  });
}
