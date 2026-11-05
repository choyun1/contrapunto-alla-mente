// The list at the bottom of the three-voice page: every split of every total
// Jv that has a four-bar example from the chosen starting note, in two tabs,
// first species and mixed species. The search runs in split-survey-worker.js;
// this file only builds the list. Shifts are zero-indexed: −7 is the octave.

import { KIND } from '../src/taneyev/three-voice-pick.js';
import { sign } from './chart-card.js';

/** The two tabs, in order. */
const TABS = [
  { kind: KIND.FIRST, name: 'First species' },
  { kind: KIND.MIXED, name: 'Mixed species' },
];

/** Returns the section's skeleton: a status line, the tab buttons and one panel per tab. */
function skeleton() {
  const tabs = TABS.map((tab, k) => `<button type="button" role="tab" id="survey-tab-${tab.kind}"
    aria-controls="survey-panel-${tab.kind}" aria-selected="${k === 0}">${tab.name} (<span>0</span>)</button>`).join('');
  const panels = TABS.map((tab, k) => `<div role="tabpanel" id="survey-panel-${tab.kind}"
    aria-labelledby="survey-tab-${tab.kind}" ${k === 0 ? '' : 'hidden'}></div>`).join('');
  return `<p class="note" aria-live="polite"></p><div class="survey-tabs" role="tablist">${tabs}</div>${panels}`;
}

/** Shows one tab's panel and marks its button. */
function selectTab(section, kind) {
  for (const tab of TABS) {
    const on = tab.kind === kind;
    section.querySelector(`#survey-tab-${tab.kind}`).setAttribute('aria-selected', String(on));
    section.querySelector(`#survey-panel-${tab.kind}`).hidden = !on;
  }
}

/** Returns the panel's line for a total, creating it in number order: "−12: [−7 + −5] …". */
function lineFor(panel, total) {
  let line = panel.querySelector(`[data-total="${total}"]`);
  if (line) return line;
  line = document.createElement('p');
  line.className = 'survey-line';
  line.dataset.total = String(total);
  line.innerHTML = `<b>${sign(total)}</b> `;
  panel.append(line); // results arrive in number order, so appending keeps it
  return line;
}

/**
 * Fills `section` with the list and returns { restart(start) }, which starts a
 * new search from that starting note. Clicking a split calls onPick(total, split).
 */
export function mountSurvey(section, { onPick }) {
  section.innerHTML = skeleton();
  const status = section.querySelector('.note');
  for (const tab of TABS) {
    section.querySelector(`#survey-tab-${tab.kind}`).addEventListener('click', () => selectTab(section, tab.kind));
  }
  let worker = null;
  const restart = (start, startName) => {
    worker?.terminate();
    const counts = { [KIND.FIRST]: 0, [KIND.MIXED]: 0 };
    for (const tab of TABS) {
      section.querySelector(`#survey-panel-${tab.kind}`).replaceChildren();
      section.querySelector(`#survey-tab-${tab.kind} span`).textContent = '0';
    }
    status.textContent = `Searching every total from ${startName}…`;
    worker = new Worker(new URL('./split-survey-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.done) {
        status.textContent = `Every split with a four-bar example, the lower voice starting on ${startName}. Click one to hear it.`;
        return;
      }
      status.textContent = `Searching every total from ${startName}… now at ${sign(data.total)}`;
      if (!data.kind) return;
      counts[data.kind] += 1;
      section.querySelector(`#survey-tab-${data.kind} span`).textContent = String(counts[data.kind]);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${sign(data.split.upper)} + ${sign(data.split.lower)}`;
      button.addEventListener('click', () => onPick(data.total, data.split));
      lineFor(section.querySelector(`#survey-panel-${data.kind}`), data.total).append(button, ' ');
    };
    worker.postMessage({ start });
  };
  return { restart };
}
