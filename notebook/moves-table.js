// The notebook's table of a proposta's allowed moves under several answers at
// once, set side by side as in the margin of IC p. 21. Display only: the move
// chords and their common notes come from src/taneyev/canon.js.
// Steps are zero-indexed and counted from the proposta's note, here C.

import { moveChord, sharedMoves } from '../src/taneyev/canon.js';
import { letterOf, MIDDLE_C } from '../src/common/diatonic.js';

/** Note names for steps from C: [−1, 0, 2, 4] → 'B C E G'. */
const names = (steps) => steps.map((step) => letterOf(MIDDLE_C + step)).join(' ');

/** One group of answers: a row per answer with its move chord, then the notes all of them allow. */
function groupHtml({ title, answers }) {
  const rows = answers.map(({ label, entry }) => `<tr><td>${label}</td><td>${names(moveChord(entry))}</td></tr>`);
  const both = names(sharedMoves(answers.map((a) => a.entry)));
  return `<table class="spans moves"><caption>${title}</caption><tbody>${rows.join('')}
    <tr class="moves-both"><td>both</td><td><b>${both}</b></td></tr></tbody></table>`;
}

/** The whole figure: the groups side by side, each starting from P on C. */
export function movesTableHtml(groups) {
  return `<div class="moves-wrap">${groups.map(groupHtml).join('')}</div>`;
}
