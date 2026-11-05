// The answer key at the bottom of the three-voice page: one list of every split
// of every total Jv that has a four-bar example from the chosen starting note,
// each tagged first species or mixed species. It starts collapsed. The list
// comes from survey-data.js (precomputed); this file only builds it.
// Shifts are zero-indexed: −7 is the octave.

import { sign } from './chart-card.js';
import { examplesFrom } from './survey-data.js';
import { kindTag } from './kind-tag.js';

/** Returns one row: total, the two inner shifts, the tag. */
function row({ total, split, kind }, k) {
  return `<tr data-k="${k}" tabindex="0" title="Show this split">
    <td>${sign(total)}</td><td>${sign(split.upper)}</td><td>${sign(split.lower)}</td><td>${kindTag(kind)}</td></tr>`;
}

/**
 * Fills the `details` element with the answer key and returns { show(start, startName) },
 * which lists the splits for that starting note. Clicking a row calls onPick(total, split).
 */
export function mountSurvey(details, { onPick }) {
  const summary = details.querySelector('summary');
  const body = details.querySelector('.survey-body');
  const show = (start, startName) => {
    const list = examplesFrom(start);
    const mixed = list.filter((entry) => entry.kind === 'mixed').length;
    summary.textContent = `Answer key: every split with an example from ${startName} (${list.length}, ${mixed} of them mixed species)`;
    body.innerHTML = `<table><thead><tr><th scope="col">Total J<sub>v</sub></th><th scope="col">Upper–middle</th>
      <th scope="col">Middle–lower</th><th scope="col">Example</th></tr></thead><tbody>${list.map(row).join('')}</tbody></table>`;
    body.querySelectorAll('tbody tr').forEach((tr) => {
      const { total, split } = list[Number(tr.dataset.k)];
      tr.addEventListener('click', () => onPick(total, split));
      tr.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onPick(total, split);
      });
    });
  };
  return { show };
}
