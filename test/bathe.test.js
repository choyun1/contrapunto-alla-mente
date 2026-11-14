import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRINTED, MISPRINT, PLACES, COURSES, batheCell, batheGuide, batheTable, batheSpot, batheWorked, placeUp, courseUp,
  upward, followerEntry, coursesHolding, wheel,
} from '../src/taneyev/bathe.js';
import { moveChord } from '../src/taneyev/canon.js';
import { chart } from '../src/taneyev/rules.js';

// Bathe counts 1-indexed (unison 1, 5th 5); the guide interval is zero-indexed.

test('Bathe’s table (c. 1596, handout p. 5): 55 of 56 cells match the computed ones', () => {
  const computed = batheTable();
  const differ = [];
  COURSES.forEach(({ up: course }, row) => PLACES.forEach(({ up: place }, col) => {
    if (computed[row][col].join() !== PRINTED[row][col].join()) differ.push({ course, place });
  }));
  assert.deepEqual(differ, [{ course: MISPRINT.course, place: MISPRINT.place }]);
});

test('the misprinted cell computes to the editors’ correction, 1 6 (handout p. 5 note)', () => {
  assert.deepEqual(batheCell(MISPRINT.place, MISPRINT.course), MISPRINT.corrected);
});

test('the plain song standing still under a canon at the unison leaves every consonance: 1 3 5 6', () => {
  assert.deepEqual(batheCell(1, 1), [1, 3, 5, 6]);
});

test('a canon at the 5th above over a plain song rising a step: guide 3 steps, leaving the 3rd and 5th (course 2, place 5)', () => {
  assert.equal(batheGuide(5, 2), 3);
  assert.deepEqual(batheCell(5, 2), [3, 5]);
});

test('places and courses down share columns and rows with places and courses up, as printed', () => {
  assert.deepEqual(PLACES.map(({ down }) => placeUp(down)), PLACES.map(({ up }) => up));
  assert.deepEqual(COURSES.map(({ down }) => courseUp(down)), COURSES.map(({ up }) => up));
});

test('each cell is the fixed consonances of the Jv chart for its guide interval (Taneyev §128)', () => {
  for (const { up: place } of PLACES) {
    for (const { up: course } of COURSES) {
      const jv = batheGuide(place, course);
      const fixed = chart(jv, { width: 6 }).filter((c) => c.kind === 'fixed-consonance').map((c) => c.m + 1);
      assert.deepEqual(batheCell(place, course), fixed, `place ${place}, course ${course}`);
    }
  }
});

test('a canon bar finds its cell: a 12th above over a step down is place 5, course 7, Bathe’s 2 down', () => {
  assert.deepEqual(batheSpot(11, -1), { place: 5, course: 7 });
  assert.equal(courseUp(2), 7);
  assert.equal(batheGuide(5, 7), (11 - (-1)) % 7); // the guide is 12 steps, an octave and a 6th
  assert.deepEqual(batheCell(5, 7), [1, 3, 5]);
});

test('worked cell: a canon at the 5th above over a step up (course 2): 3 → 6 and 5 → 8 fit, 1 → 4 and 6 → 9 do not', () => {
  assert.deepEqual(batheWorked(5, 2), [
    { leader: 1, follower: 4, fits: false },
    { leader: 3, follower: 6, fits: true },
    { leader: 5, follower: 1, fits: true },
    { leader: 6, follower: 2, fits: false },
  ]);
});

test('worked cells keep exactly the leader intervals of the printed cell', () => {
  COURSES.forEach(({ up: course }) => PLACES.forEach(({ up: place }) => {
    const kept = batheWorked(place, course).filter((w) => w.fits).map((w) => w.leader);
    assert.deepEqual(kept, batheCell(place, course));
  }));
});

// Bathe's numbers are 1-indexed; moveChord's steps are zero-indexed.
test('down each column, the rows holding one leader interval are a canon move chord (Cho’s chord chart, Canons p. 1)', () => {
  for (const { up: place } of PLACES) {
    for (const leader of [1, 3, 5, 6]) {
      const chord = moveChord(followerEntry(place, leader)).map(upward).sort((a, b) => a - b);
      assert.deepEqual(coursesHolding(place, leader), chord, `place ${place}, leader ${leader}`);
    }
  }
});

test('a 3rd in the place-5 column: the follower a 7th above, so the plain song moves to D E G B (courses 2 3 5 7)', () => {
  assert.equal(followerEntry(5, 3), 6);
  assert.deepEqual(coursesHolding(5, 3), [2, 3, 5, 7]);
});

test('a unison at place 1 makes the follower an octave above: the octave chord A C E F (courses 6 1 3 4)', () => {
  assert.equal(followerEntry(1, 1), 7);
  assert.deepEqual(coursesHolding(1, 1), [1, 3, 4, 6]);
});

// The wheel counts zero-indexed, mod 7; Bathe's cells are 1-indexed.
test('Cho’s 0–6 wheel (IC p. 27): the consonances are 0 2 4 5, and the corners kept by both rings are Bathe’s cell', () => {
  assert.deepEqual(wheel(0).filter((c) => c.above).map((c) => c.m), [0, 2, 4, 5]);
  for (const jv of [0, 1, 2, 3, 4, 5, 6]) {
    const both = wheel(jv).filter((c) => c.above && c.shifted).map((c) => c.m + 1);
    assert.deepEqual(both, batheCell(jv + 1, 1), `Jv ${jv}`);
  }
});

test('the wheel’s outer ring is the consonance set turned back by Jv: at +3 it holds 1 2 4 6', () => {
  assert.deepEqual(wheel(3).filter((c) => c.shifted).map((c) => c.m), [1, 2, 4, 6]);
});
