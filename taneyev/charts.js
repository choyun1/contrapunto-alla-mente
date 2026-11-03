import { renderNotation } from './notation.js';
import { chart, baseMarks, isPerfect, intervalName, forbidsSimilarMotion, parallelSurvives } from '../src/taneyev/rules.js';

// Order: Jv = 0, then the octave family (−7, −14), the 12th and 10th, their
// octave-reduced forms (−4 = −11 + 7, −2 = −9 + 7), direct shifts, then the rare ones.
const CHARTS = [
  [0, 'Simple counterpoint', 'The reference marks that every other chart is built from.'],
  [-7, 'Invertible at the octave', 'The textbook case. Sixth in Taneyev’s practice order.'],
  [-14, 'Invertible at the 15th', 'The same as −7 up to the 10th. It differs at the 11th and 12th (10 and 11): at −7 a 12th becomes a 5th, at −14 it becomes a 4th. Use it when the voices sit more than an octave apart, as in Bach’s keyboard openings.'],
  [-11, 'Invertible at the 12th', 'Taneyev’s most important kind. Third in the practice order.'],
  [-9, 'Invertible at the 10th', 'Second in the practice order, without suspensions or similar motion.'],
  [-4, 'Invertible at the 5th', 'Fourth in the practice order.'],
  [-2, 'Invertible at the 3rd', 'Seventh in the practice order.'],
  [3, 'Direct shift up a 4th', 'Voices move apart without crossing. Fifth in the practice order.'],
  [5, 'Direct shift up a 6th', 'Eighth in the practice order.'],
  [-12, 'Invertible at the 13th', 'Ninth in the practice order.'],
  [-13, 'Invertible at the 14th', 'Tenth in the practice order. Rare in real music.'],
];

const fmt = (n) => (n < 0 ? `−${-n}` : String(n));
const sign = (jv) => (jv > 0 ? `+${jv}` : fmt(jv));
const slug = (jv) => `jv${jv < 0 ? 'm' : 'p'}${Math.abs(jv)}`;
const num = (i) => (isPerfect(i) ? `<b>${fmt(i)}</b>` : fmt(i));
const tds = (xs, cls) => xs.map((x) => `<td class="${cls}">${x}</td>`).join('');
/** Returns the chart's formula, e.g. "n = m + Jv = m − 7" (zero-indexed intervals; Taneyev's basic formula, § to check against the book). */
function formula(jv) {
  const general = '<i>n</i> = <i>m</i> + J<sub>v</sub>';
  if (jv === 0) return `${general} = <i>m</i>`;
  const op = jv < 0 ? '−' : '+';
  return `${general} = <i>m</i> ${op} ${Math.abs(jv)}`;
}
const yn = (b) => `<span class="${b ? 'yes' : 'no'}">${b ? 'yes' : 'no'}</span>`;

function render(jv, title, note) {
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
  return `<section class="chart" id="${slug(jv)}">
    <header><h2><span class="jv">J<sub>v</sub> = ${sign(jv)}</span> ${title}</h2>
    <p class="formula">${formula(jv)}</p>
    <p class="note">${note}</p>
    <dl class="facts"><div><dt>Fixed consonances</dt><dd>${fixed}</dd></div>
      <div><dt>Parallel 3rds</dt><dd>${yn(parallelSurvives(2, jv))}</dd></div>
      <div><dt>Parallel 6ths</dt><dd>${yn(parallelSurvives(5, jv))}</dd></div>
      <div><dt>Parallel 10ths</dt><dd>${yn(parallelSurvives(9, jv))}</dd></div>${similar}</dl></header>
    <div class="scroll"><table><tbody>${working}${result}</tbody></table></div>
    <details class="notation" data-jv="${jv}"><summary>See and hear it in notation</summary>
      <div class="examples"></div></details></section>`;
}

document.getElementById('links').innerHTML = CHARTS
  .map(([jv]) => `<a href="#${slug(jv)}">${sign(jv)}</a>`).join(' ');
document.getElementById('charts').innerHTML = CHARTS.map((c) => render(...c)).join('');

/** Draws a chart's notation the first time its panel is opened. */
function wireNotation(root) {
  root.querySelectorAll('details.notation').forEach((panel) => {
    panel.addEventListener('toggle', () => {
      const box = panel.querySelector('.examples');
      if (panel.open && !box.hasChildNodes()) renderNotation(box, Number(panel.dataset.jv));
    });
  });
}
wireNotation(document.getElementById('charts'));

const form = document.getElementById('custom');
const showCustom = (jv) => {
  const box = document.getElementById('custom-chart');
  box.innerHTML = render(jv, jv < 0 ? 'Inverse shift' : jv > 0 ? 'Direct shift' : 'Simple counterpoint',
    'Generated on request.');
  wireNotation(box);
  box.scrollIntoView({ behavior: 'smooth' });
};
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const jv = parseInt(document.getElementById('jvin').value, 10);
  if (Number.isInteger(jv) && Math.abs(jv) <= 21) showCustom(jv);
});
