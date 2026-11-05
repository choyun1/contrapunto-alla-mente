import { renderChart, wireNotation, sign, slug } from './chart-card.js';
import { mountDock } from './model-dock.js';

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

document.getElementById('links').innerHTML = CHARTS
  .map(([jv]) => `<a href="#${slug(jv)}">${sign(jv)}</a>`).join(' ');
document.getElementById('charts').innerHTML = CHARTS
  .map(([jv, title, note]) => renderChart(jv, title, note)).join('');

wireNotation(document.getElementById('charts'));
const dock = mountDock(CHARTS.map(([jv]) => jv), (jv) => `#${slug(jv)}`);

const form = document.getElementById('custom');
const showCustom = (jv) => {
  const box = document.getElementById('custom-chart');
  box.innerHTML = renderChart(jv, jv < 0 ? 'Inverse shift' : jv > 0 ? 'Direct shift' : 'Simple counterpoint',
    'Generated on request.');
  wireNotation(box);
  dock.watch(box.querySelector('section.chart'));
  box.scrollIntoView({ behavior: 'smooth' });
};
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const jv = parseInt(document.getElementById('jvin').value, 10);
  if (Number.isInteger(jv) && Math.abs(jv) <= 21) showCustom(jv);
});

