// Bathe's canon table page: one row of the table notated. For a chosen move
// of the plain song (a "course"), one small score per canon interval (a
// "place"): the leader's allowed notes over the first plain-song note, and
// the follower's copies over the next. Display only: the cells come from
// src/taneyev/bathe.js. Bathe's numbers are 1-indexed; steps are zero-indexed.

import { batheWorked, upward } from '../src/taneyev/bathe.js';
import { parsePitch } from '../src/common/diatonic.js';
import { abcPitch } from '../src/notation/abc.js';

/** The plain-song moves offered, as signed zero-indexed steps, with their names. */
export const MOVES = [
  { steps: 0, name: 'repeats' }, { steps: 1, name: 'a step up' }, { steps: 2, name: 'a 3rd up' },
  { steps: 3, name: 'a 4th up' }, { steps: 4, name: 'a 5th up' }, { steps: -1, name: 'a step down' },
  { steps: -2, name: 'a 3rd down' }, { steps: -3, name: 'a 4th down' }, { steps: -4, name: 'a 5th down' },
];

/** The canon intervals shown, as places up 1–7 (zero-indexed steps 0–6), with their names. */
const PLACES_UP = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th'];

/** The first plain-song note, and the leader's lowest note (an octave above it). */
const CANTUS = parsePitch('C3');

/** A chord in abc, or a whole rest when it is empty: [C E G] → '[CEG]'. */
const chord = (steps) => (steps.length ? `[${steps.map(abcPitch).join('')}]` : 'z');

/** The abc for one place: follower, leader, plain song and the gray imaginary cantus, two bars. */
function placeAbc(place, move) {
  const next = CANTUS + move;
  const fits = batheWorked(place + 1, upward(move)).filter((w) => w.fits);
  const leader = fits.map((w) => CANTUS + 7 + (w.leader - 1));
  const follower = leader.map((step) => step + place);
  return ['X:1', 'M:none', 'L:1', 'K:C',
    'V:F clef=treble name="R"', 'V:L clef=treble name="P"', 'V:CF clef=bass name="CF"', 'V:ICF clef=bass name="ICF"',
    `[V:F] z | ${chord(follower)} |]`, `[V:L] ${chord(leader)} | z |]`,
    `[V:CF] ${abcPitch(CANTUS)} | ${abcPitch(next)} |]`, `[V:ICF] ${abcPitch(next - place)} | z |]`].join('\n');
}

/** The line under one small score: each leader interval, what the follower makes of it, and whether it fits. */
function workedLine(place, move) {
  const worked = batheWorked(place + 1, upward(move));
  const parts = worked.map((w) => `<span class="bathe-try ${w.fits ? 'yes' : 'no'}">P ${w.leader} → R ${w.follower} ${w.fits ? '✓' : '✗'}</span>`);
  const cell = worked.filter((w) => w.fits).map((w) => w.leader).join(' ') || 'nothing';
  return `<div class="bathe-tries">${parts.join('')}</div><p class="note">Bathe’s cell: <b>${cell}</b></p>`;
}

/** Draws every place for one move of the plain song into `box`, one small card per place. */
export function drawMove(box, move) {
  box.innerHTML = PLACES_UP.map((name, place) => `<div class="bathe-ex"><h4>Canon at the ${place === 0 ? 'unison' : `${name} above`} (place ${place + 1})</h4>
    <div class="bathe-score" id="bathe-ex-${place}"></div>${workedLine(place, move)}</div>`).join('');
  PLACES_UP.forEach((_, place) => {
    const el = document.getElementById(`bathe-ex-${place}`);
    window.ABCJS.renderAbc(el, placeAbc(place, move), { staffwidth: 170, scale: 0.75, paddingleft: 0, paddingright: 0, add_classes: true });
    el.querySelectorAll('.abcjs-v3').forEach((note) => note.classList.add('silent-voice'));
  });
}
