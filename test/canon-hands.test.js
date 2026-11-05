import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  handMoves, stackedChord, chordSymbol, moveNames, sameNamesBelow, propostaSides, SIDE,
} from '../src/taneyev/canon-hands.js';
import { consonantSpans, moveChord, canonInterval } from '../src/taneyev/canon.js';
import { isConsonant } from '../src/taneyev/rules.js';
import { parsePitch, letterOf } from '../src/common/diatonic.js';

// Intervals are zero-indexed: 3rd 2, 5th 4, octave 7. Pitches are diatonic steps.

const C4 = parsePitch('C4');
const letters = (steps) => steps.map(letterOf).join(' ');
const sorted = (names) => [...names].sort().join(' ');
const ENTRIES = Array.from({ length: 29 }, (_, k) => k - 14);

test('every hand key is consonant and keeps the voices uncrossed (canon.js)', () => {
  for (const entry of ENTRIES) {
    for (const move of handMoves(C4, entry)) {
      assert.ok(isConsonant(move.n), `entry ${entry}, span ${move.span}`);
      assert.ok(consonantSpans(entry, { range: 21 }).includes(move.span));
      if (entry > 0) assert.ok(move.n >= 0);
      if (entry < 0) assert.ok(move.n <= 0);
    }
  }
});

test('Cho’s conjecture: four note names for every canon, five at the unison', () => {
  for (const entry of ENTRIES) assert.equal(moveNames(C4, entry).length, entry === 0 ? 5 : 4, `entry ${entry}`);
});

test('the hand gives the same note names as the move chord on the proposta page', () => {
  for (const entry of ENTRIES) {
    assert.equal(sorted(moveNames(C4, entry)), sorted(moveChord(entry).map(letterOf)), `entry ${entry}`);
  }
});

test('the unison is the union of the two sides', () => {
  const above = moveNames(C4, -7); // risposta an octave below: proposta above, thumb on C3
  const below = moveNames(C4, 7);
  assert.equal(sorted(new Set([...above, ...below])), sorted(moveNames(C4, 0)));
  assert.equal(sorted(moveNames(C4, 0)), 'A C E F G'); // all but the steps D and B
});

test('the proposta takes the side away from the risposta', () => {
  assert.deepEqual(propostaSides(4), [SIDE.BELOW]);
  assert.deepEqual(propostaSides(-4), [SIDE.ABOVE]);
  assert.deepEqual(propostaSides(0), [SIDE.BELOW, SIDE.ABOVE]);
});

test('canon at the 5th above from C4: left hand on G4 gives G E C B', () => {
  assert.equal(letters(handMoves(C4, 4).map((m) => m.step)), 'B C E G');
  assert.deepEqual(handMoves(C4, 4).map((m) => m.n), [5, 4, 2, 0]);
});

test('stacked chords: Fmaj7 below C, Am7 above C, Fmaj9 at the unison', () => {
  const C3 = parsePitch('C3');
  assert.equal(letters(stackedChord(C3, 7)), 'F A C E'); // risposta on C4, proposta below
  assert.equal(chordSymbol(stackedChord(C3, 7)), 'Fmaj7');
  assert.equal(letters(stackedChord(parsePitch('C5'), -7)), 'A C E G');
  assert.equal(chordSymbol(stackedChord(parsePitch('C5'), -7)), 'Am7');
  assert.equal(chordSymbol(stackedChord(C4, 0)), 'Fmaj9');
});

test('the stacked chord holds exactly the hand’s note names', () => {
  for (const entry of ENTRIES) {
    assert.equal(sorted(stackedChord(C4, entry).map(letterOf)), sorted(moveNames(C4, entry)), `entry ${entry}`);
    assert.ok(chordSymbol(stackedChord(C4, entry)), `entry ${entry} has a name`);
  }
});

test('canons that stack to a 10th share note names (2nd–2nd, 3rd–octave, 4th–7th, 5th–6th)', () => {
  const pairs = [1, 2, 3, 4, 5, 6, 7].map(sameNamesBelow);
  assert.deepEqual(pairs, [1, 7, 6, 5, 4, 3, 2]);
  assert.equal(canonInterval(0, 4), 4); // sanity: a repeated note at the 5th above is a 5th
});
