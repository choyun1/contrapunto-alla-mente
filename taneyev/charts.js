// The charts page: the shared Jv dropdown (src/ui/jv-picker.js) and the
// chart for the one you pick.
// The URL hash (#jvm11) names the chart, so links and the back button work.
// Which shifts matter and what they are called comes from src/taneyev/shifts.js.

import { renderChart, wireNotation, slug } from './chart-card.js';
import { mountDock } from './model-dock.js';
import { inRange, shiftTitle, shiftNote, BOOK_SHIFTS } from '../src/taneyev/shifts.js';
import { mountJvPicker } from '../src/ui/jv-picker.js';

const START = -11; // Taneyev's most important kind
const chartBox = document.getElementById('charts');

/** The Jv a hash like "#jvm11" or "#jvp3" names, or null. */
function jvFromHash(hash) {
  const match = /^#jv([mp])(\d+)$/.exec(hash);
  if (!match) return null;
  const size = Number(match[2]);
  const jv = match[1] === 'm' ? 0 - size : size; // 0 - size, not -size, so no −0
  return inRange(jv) ? jv : null;
}

const dock = mountDock(BOOK_SHIFTS.map((entry) => entry.jv), (jv) => `#${slug(jv)}`);

/** Draws the chart for jv and sets the dropdown to it. */
function show(jv) {
  chartBox.innerHTML = renderChart(jv, shiftTitle(jv), shiftNote(jv));
  wireNotation(chartBox);
  dock.follow(jv);
  picker.set(jv);
}

/** Points the URL at jv; the hashchange listener then draws it. */
const go = (jv) => { location.hash = slug(jv); };

const picker = mountJvPicker(document.getElementById('jv-pick'), {
  label: 'Chart for J<sub>v</sub>',
  title: shiftTitle,
  onPick: go,
});

/** Shows the chart the URL names, or the starting chart when it names none. */
const showFromUrl = () => show(jvFromHash(location.hash) ?? START);

window.addEventListener('hashchange', showFromUrl);
showFromUrl();
