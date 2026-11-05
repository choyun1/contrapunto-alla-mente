// The charts page: a row of every Jv from −21 to +21, and the chart for the
// one you pick. The common shifts carry a ✓ and the others Taneyev works
// through are in full colour; the rest are generated from the same rules.
// The URL hash (#jvm11) names the chart, so links and the back button work.
// Which shifts matter and what they are called comes from src/taneyev/shifts.js.

import { renderChart, wireNotation, sign, slug } from './chart-card.js';
import { mountDock } from './model-dock.js';
import { allShifts, inRange, isCommonShift, bookEntry, shiftTitle, shiftNote, BOOK_SHIFTS } from '../src/taneyev/shifts.js';

const START = -11; // Taneyev's most important kind
const picker = document.getElementById('jv-picker');
const chartBox = document.getElementById('charts');

/** The Jv a hash like "#jvm11" or "#jvp3" names, or null. */
function jvFromHash(hash) {
  const match = /^#jv([mp])(\d+)$/.exec(hash);
  if (!match) return null;
  const size = Number(match[2]);
  const jv = match[1] === 'm' ? 0 - size : size; // 0 - size, not -size, so no −0
  return inRange(jv) ? jv : null;
}

/** Returns one picker link: ✓ on a common shift, muted when Taneyev does not treat it. */
function pickerLink(jv) {
  let kind = 'rare';
  if (isCommonShift(jv)) kind = 'common';
  else if (bookEntry(jv)) kind = 'book';
  const label = isCommonShift(jv) ? `${sign(jv)} ✓` : sign(jv);
  return `<a href="#${slug(jv)}" class="chip ${kind}" data-jv="${jv}" title="${shiftTitle(jv)}">${label}</a>`;
}

/** Returns the picker's three groups: inverse shifts, 0, direct shifts. */
function pickerHtml() {
  const jvs = allShifts();
  const group = (name, list) => `<div class="jv-group"><span>${name}</span>${list.map(pickerLink).join('')}</div>`;
  return group('Voices cross', jvs.filter((jv) => jv < 0))
    + group('No shift', [0])
    + group('Voices move apart', jvs.filter((jv) => jv > 0));
}

const dock = mountDock(BOOK_SHIFTS.map((entry) => entry.jv), (jv) => `#${slug(jv)}`);

/** Draws the chart for jv and marks its link in the picker. */
function show(jv) {
  chartBox.innerHTML = renderChart(jv, shiftTitle(jv), shiftNote(jv));
  wireNotation(chartBox);
  dock.follow(jv);
  picker.querySelectorAll('a').forEach((a) => {
    if (Number(a.dataset.jv) === jv) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}

picker.innerHTML = pickerHtml();
/** Shows the chart the URL names, or the starting chart when it names none. */
const showFromUrl = () => show(jvFromHash(location.hash) ?? START);

window.addEventListener('hashchange', showFromUrl);
showFromUrl();
