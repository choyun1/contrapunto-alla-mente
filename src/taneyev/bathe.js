// William Bathe's "generall Table" of two parts in one upon a plain song
// (A Briefe Introduction to the Skill of Song, London, c. 1596; Early Music
// Sources handout, Rotem & Schab 2024). Rules core.
//
// The table is 1-indexed, as Bathe prints it: a "place" is the canon interval
// (place 5 = the follower a 5th above the leader) and a "course" is the plain
// song's own move to its next note (course 2 = a step up). Each cell lists the
// intervals the leader may take above the plain song, 1-indexed and within an
// octave. The plain song is sung beneath both parts, and the follower enters
// one plain-song note later.
//
// Everywhere else this project counts zero-indexed (unison 0, 5th 4, octave
// 7). The functions here take and return Bathe's 1-indexed numbers and say so.
//
// Why the table works: the leader's note against the next plain-song note,
// moved down by the place, is what the follower will sound against the plain
// song. So each cell is the consonances that stay consonant when shifted by
// place − course, which is the guide interval of the imaginary cantus method
// (imaginary-cantus.js) and the Jv of a Taneyev chart (rules.js).

import { isConsonant } from './rules.js';

/** Bathe's columns, as printed: places up, with the place down that shares each column. */
export const PLACES = [
  { up: 1, down: 1 }, { up: 7, down: 2 }, { up: 6, down: 3 }, { up: 5, down: 4 },
  { up: 4, down: 5 }, { up: 3, down: 6 }, { up: 2, down: 7 },
];

/** Bathe's rows, as printed: courses up 1–8, with the course down that shares each row. */
export const COURSES = [1, 2, 3, 4, 5, 6, 7, 8].map((up) => ({ up, down: 9 - up }));

/**
 * The table as printed (handout p. 5), rows by course up 1–8, columns as in
 * PLACES. One cell is a misprint: course 5, place 2 reads 3 6, and the
 * editors correct it to 1 6.
 */
export const PRINTED = [
  ['1356', '6', '135', '16', '35', '136', '5'],
  ['6', '135', '16', '35', '136', '5', '1356'],
  ['135', '16', '35', '136', '5', '1356', '6'],
  ['16', '35', '136', '5', '1356', '6', '135'],
  ['35', '136', '5', '1356', '6', '135', '36'],
  ['136', '5', '1356', '6', '135', '16', '35'],
  ['5', '1356', '6', '135', '16', '35', '136'],
  ['1356', '6', '135', '16', '35', '136', '5'],
].map((row) => row.map((cell) => [...cell].map(Number)));

/** The misprinted cell, by course up and place up, with the editors' reading. */
export const MISPRINT = { course: 5, place: 2, printed: [3, 6], corrected: [1, 6] };

/** The guide interval for a place and course, both 1-indexed and upward: zero-indexed, within an octave (0–6). */
export function batheGuide(place, course) {
  const steps = (place - 1) - (course - 1);
  return ((steps % 7) + 7) % 7;
}

/** The intervals the leader may take above the plain song, 1-indexed (1 3 5 6 at most): one cell of the table. */
export function batheCell(place, course) {
  const guide = batheGuide(place, course);
  const fits = [];
  for (let leader = 0; leader < 7; leader++) {
    if (isConsonant(leader) && isConsonant(leader + guide)) fits.push(leader + 1);
  }
  return fits;
}

/** The place up that shares a column with a place down (2 down is 7 up), both 1-indexed. */
export const placeUp = (down) => (down === 1 ? 1 : 9 - down);

/** The course up that shares a row with a course down (2 down is 7 up), both 1-indexed. */
export const courseUp = (down) => 9 - down;

/** The whole table computed, in the printed layout: rows by course up 1–8, columns as in PLACES. */
export function batheTable() {
  return COURSES.map(({ up: course }) => PLACES.map(({ up: place }) => batheCell(place, course)));
}

/** A zero-indexed, signed interval as Bathe's 1-indexed upward number within an octave: 4 → 5, −1 → 7 (a 2nd down is a 7th up). */
export const upward = (steps) => (((steps % 7) + 7) % 7) + 1;

/**
 * Where a canon bar sits in Bathe's table: { place, course }, 1-indexed and
 * upward. `entry` is the canon interval and `span` the plain song's move over
 * the delay, both zero-indexed and signed as in imaginary-cantus.js.
 */
export const batheSpot = (entry, span) => ({ place: upward(entry), course: upward(span) });

/**
 * Every leader interval in one cell, worked out: [{ leader, follower, fits }],
 * 1-indexed within the octave. `leader` is the leader above the current
 * plain-song note, `follower` is the follower (the leader's note moved by the
 * place, a note later) above the next one, and `fits` says both are consonant.
 * Only the four consonances (1 3 5 6) are tried for the leader.
 */
export function batheWorked(place, course) {
  const guide = batheGuide(place, course);
  return [0, 2, 4, 5].map((leader) => ({
    leader: leader + 1,
    follower: upward(leader + guide),
    fits: isConsonant(leader + guide),
  }));
}

// How the table holds the canon move chords (canon.js, moveChord; Cho's paper
// chord chart, Canons p. 1). Once the leader sings interval `leader` above the
// plain song's current note, the follower's note is fixed: `leader` + place
// above that same note, one plain-song note later. So for that one bar the
// plain song and the follower are a two-voice canon, the plain song the
// proposta below and the follower the risposta above, and the plain song's
// next note must be in that canon's move chord. Read down one place's column:
// the rows whose cell holds `leader` are exactly that chord.

/**
 * The canon between plain song and follower that a leader interval sets up:
 * the follower's interval above the plain song's current note, zero-indexed,
 * 1–7. Octaves are ignored, as Bathe ignores them, and a unison counts as an
 * octave because the follower stays above the plain song.
 */
export function followerEntry(place, leader) {
  const steps = ((place - 1) + (leader - 1)) % 7;
  return steps === 0 ? 7 : steps;
}

/** The courses up, 1-indexed (1–7), whose cell in one place's column holds the leader interval `leader` (1-indexed). */
export function coursesHolding(place, leader) {
  const courses = [1, 2, 3, 4, 5, 6, 7];
  return courses.filter((course) => batheCell(place, course).includes(leader));
}

/**
 * Cho's 0–6 wheel (IC p. 27, an early cyclic notation): the seven steps
 * counted around a circle, mod 7, zero-indexed. For one shift `jv`, each
 * corner m says whether m is a consonance above the plain song (`above`) and
 * whether m + jv is one above the imaginary cantus (`shifted`). The consonance
 * set {0, 2, 4, 5} turned back by jv lands on the `shifted` corners, and the
 * corners with both are one cell of Bathe's table. Returns [{ m, above, shifted }].
 */
export function wheel(jv) {
  const corners = [0, 1, 2, 3, 4, 5, 6];
  return corners.map((m) => ({ m, above: isConsonant(m), shifted: isConsonant(m + jv) }));
}
