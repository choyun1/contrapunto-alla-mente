// Bathe's canon table page: the canon move chords hidden in Bathe's columns.
// Click a number in the printed table: the cells in its column holding the same
// number light up, and the note says which canon's move chord those rows are,
// and how the left hand finds it (Canon handshapes page). Display only: the
// match comes from src/taneyev/bathe.js (tested against canon.js's moveChord),
// the hand and the chord's name from canon-hands.js. Bathe's numbers are 1-indexed; steps are zero-indexed.

import { followerEntry, coursesHolding } from '../src/taneyev/bathe.js';
import { handKeys, stackedChord, chordSymbol, SIDE } from '../src/taneyev/canon-hands.js';
import { letterOf } from '../src/common/diatonic.js';

/** Interval names for Bathe's 1-indexed numbers 1–7. */
const NAMES = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th'];

/** A 1-indexed interval's name; the zero-indexed entry 7 is the octave. */
const named = (oneIndexed) => (oneIndexed === 8 ? 'octave' : NAMES[oneIndexed - 1]);

/** An interval's name with its article: "a 3rd", "an octave", "a unison". */
const aNamed = (oneIndexed) => (oneIndexed === 8 ? 'an octave' : `a ${named(oneIndexed)}`);

/** How the chosen leader interval reads: "Leader a 3rd above", or "Leader on the plain song" for 1. */
const leaderPhrase = (leader) => (leader === 1 ? 'Leader on the plain song’s note' : `Leader ${aNamed(leader)} above`);

/** A list of note names joined for reading: "D, E, G or B". */
const orList = (names, last = 'or') => `${names.slice(0, -1).join(', ')} ${last} ${names[names.length - 1]}`;

/** The note under the chosen number, with the plain song on C: the explanation, as html. */
function explain(place, leader) {
  const entry = followerEntry(place, leader); // zero-indexed, 1–7
  const follower = letterOf(entry);
  const courses = coursesHolding(place, leader);
  const chord = courses.map((course) => letterOf(course - 1)); // the same names as moveChord(entry), from C up
  const hand = handKeys(entry, SIDE.BELOW).map((key) => letterOf(key.step)).join(' ');
  const symbol = chordSymbol(stackedChord(0, entry));
  return `<p><b>${leaderPhrase(leader)}, canon at place ${place}.</b> With the plain song on C, the leader sings
    ${letterOf(leader - 1)}, so the follower will sing ${follower}, ${aNamed(entry + 1)} above this C, over the plain song’s
    next note. For that bar the plain song and the follower are a two-voice canon at the ${named(entry + 1)}: the plain song
    is the proposta below, the follower the risposta above. So the plain song may move only to ${orList(chord)}
    (${symbol}), the <a href="proposta.html">move chord</a> of that canon. On the
    <a href="handshapes.html">left hand</a>, thumb on ${follower}: ${hand}.</p>
    <p>Down the place ${place} column, the ${leader} is in exactly those rows: courses ${orList(courses, 'and')} up${courses.includes(1) ? ' (course 1 is also course 8)' : ''}.</p>`;
}

/** Marks the cells in the chosen column whose cell holds the chosen number. */
function highlight(table, place, leader) {
  for (const cell of table.querySelectorAll('td[data-place]')) {
    const holds = Number(cell.dataset.place) === place
      && cell.dataset.cell.split(' ').map(Number).includes(leader);
    cell.classList.toggle('bathe-chord', holds);
  }
  for (const button of table.querySelectorAll('button.bn')) {
    const chosen = Number(button.dataset.place) === place && Number(button.dataset.leader) === leader;
    button.setAttribute('aria-pressed', String(chosen));
  }
}

/** Wires the printed table's numbers to the note below it, starting on a 3rd at place 5. */
export function mountChords(table, note) {
  const choose = (place, leader) => {
    highlight(table, place, leader);
    note.innerHTML = explain(place, leader);
  };
  table.addEventListener('click', (event) => {
    const button = event.target.closest('button.bn');
    if (button) choose(Number(button.dataset.place), Number(button.dataset.leader));
  });
  choose(5, 3);
}
