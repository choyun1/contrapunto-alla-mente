import { chart, baseMarks, isPerfect, intervalName, forbidsSimilarMotion, parallelSurvives } from '../src/taneyev/rules.js';

const CHARTS = [
  [-7, 'Invertible at the octave', 'The textbook case. Sixth in Taneyev’s practice order.'],
  [-9, 'Invertible at the 10th', 'Second in the practice order, without suspensions or similar motion.'],
  [-11, 'Invertible at the 12th', 'Taneyev’s most important kind. Third in the practice order.'],
  [-14, 'Invertible at the 15th', 'Common in Bach’s keyboard openings.'],
  [-4, 'Invertible at the 5th', 'Fourth in the practice order.'],
  [-2, 'Invertible at the 3rd', 'Seventh in the practice order.'],
  [-12, 'Invertible at the 13th', 'Ninth in the practice order.'],
  [-13, 'Invertible at the 14th', 'Tenth in the practice order. Rare in real music.'],
  [3, 'Direct shift up a 4th', 'Voices move apart without crossing. Fifth in the practice order.'],
  [5, 'Direct shift up a 6th', 'Eighth in the practice order.'],
  [0, 'Simple counterpoint', 'The reference marks that every other chart is built from.'],
];

const fmt = (n) => (n < 0 ? `−${-n}` : String(n));
const sign = (jv) => (jv > 0 ? `+${jv}` : fmt(jv));
const slug = (jv) => `jv${jv < 0 ? 'm' : 'p'}${Math.abs(jv)}`;
const num = (i) => (isPerfect(i) ? `<b>${fmt(i)}</b>` : fmt(i));
const tds = (xs, cls) => xs.map((x) => `<td class="${cls}">${x}</td>`).join('');
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
    <p class="note">${note}</p>
    <dl class="facts"><div><dt>Fixed consonances</dt><dd>${fixed}</dd></div>
      <div><dt>Parallel 3rds</dt><dd>${yn(parallelSurvives(2, jv))}</dd></div>
      <div><dt>Parallel 6ths</dt><dd>${yn(parallelSurvives(5, jv))}</dd></div>
      <div><dt>Parallel 10ths</dt><dd>${yn(parallelSurvives(9, jv))}</dd></div>${similar}</dl></header>
    <div class="scroll"><table><tbody>${working}${result}</tbody></table></div></section>`;
}

document.getElementById('links').innerHTML = CHARTS
  .map(([jv]) => `<a href="#${slug(jv)}">${sign(jv)}</a>`).join(' ');
document.getElementById('charts').innerHTML = CHARTS.map((c) => render(...c)).join('');

const form = document.getElementById('custom');
const showCustom = (jv) => {
  const box = document.getElementById('custom-chart');
  box.innerHTML = render(jv, jv < 0 ? 'Inverse shift' : jv > 0 ? 'Direct shift' : 'Simple counterpoint',
    'Generated on request.');
  box.scrollIntoView({ behavior: 'smooth' });
};
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const jv = parseInt(document.getElementById('jvin').value, 10);
  if (Number.isInteger(jv) && Math.abs(jv) <= 21) showCustom(jv);
});
