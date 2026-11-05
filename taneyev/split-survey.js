// The answer key at the bottom of the three-voice page: one list of every split
// of every total Jv that has a four-bar example from the chosen starting note,
// each tagged first species or mixed species, grouped by total Jv. The key and
// every group start collapsed. The list
// comes from survey-data.js (precomputed); this file only builds it.
// Shifts are zero-indexed: −7 is the octave.

import { sign } from './chart-card.js';
import { examplesFrom } from './survey-data.js';
import { kindTag } from './kind-tag.js';

/** Returns one row: the two inner shifts and the tag. `k` indexes the whole list. */
function row({ split, kind }, k) {
  return `<tr data-k="${k}" tabindex="0" title="Show this split">
    <td>${sign(split.upper)}</td><td>${sign(split.lower)}</td><td>${kindTag(kind)}</td></tr>`;
}

/** Returns the summary for one total: "−12 · 6 splits, 1 mixed species". */
function totalSummary(total, entries) {
  const mixed = entries.filter((entry) => entry.kind === 'mixed').length;
  const count = `${entries.length} ${entries.length === 1 ? 'split' : 'splits'}`;
  const extra = mixed ? `, <span class="kind-tag mixed">${mixed} mixed</span>` : '';
  return `<b>${sign(total)}</b> · ${count}${extra}`;
}

/** Returns one collapsed group: a total Jv and the table of its splits. */
function totalGroup(total, entries, indexOf) {
  const rows = entries.map((entry) => row(entry, indexOf.get(entry))).join('');
  return `<details class="survey-total"><summary>${totalSummary(total, entries)}</summary>
    <table><thead><tr><th scope="col">Upper–middle</th><th scope="col">Middle–lower</th>
    <th scope="col">Example</th></tr></thead><tbody>${rows}</tbody></table></details>`;
}

/**
 * Fills the `details` element with the answer key and returns { show(start, startName) },
 * which lists the splits for that starting note, one collapsed group per total Jv.
 * Clicking a row calls onPick(total, split).
 */
export function mountSurvey(details, { onPick }) {
  const summary = details.querySelector('summary');
  const body = details.querySelector('.survey-body');
  const show = (start, startName) => {
    const list = examplesFrom(start);
    const mixed = list.filter((entry) => entry.kind === 'mixed').length;
    summary.textContent = `Answer key: every split with an example from ${startName} (${list.length}, ${mixed} of them mixed species)`;
    const indexOf = new Map(list.map((entry, k) => [entry, k]));
    const totals = [...new Set(list.map((entry) => entry.total))];
    body.innerHTML = totals.map((total) => totalGroup(total, list.filter((e) => e.total === total), indexOf)).join('');
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
