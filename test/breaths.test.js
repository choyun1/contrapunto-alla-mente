import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breatheAt, breathTimes, BREATH } from '../src/notation/breaths.js';

/** A note map entry: start and end in whole notes. */
const note = (start, end) => ({ start, end });

test('a breath after beat 1 of bar 4 is at 3¼ whole notes, in the voice order given (IC p. 19, Cho 2026-11-14)', () => {
  const times = breathTimes({ P: [[4, 1]], R: [[5, 1]] }, ['R', 'P']);
  assert.deepEqual(times, [[4.25], [3.25]]);
});

test('the note ending at a breath is cut short; the next note is untouched', () => {
  const voice = [note(3, 3.25), note(3.25, 3.5)];
  breatheAt([voice], [[3.25]]);
  assert.equal(voice[0].end, 3.25 - BREATH);
  assert.equal(voice[1].end, 3.5);
});

test('a breath never takes more than half of a short note, and a voice without breaths is left alone', () => {
  const short = [note(0, 0.0625)];
  const other = [note(0, 0.0625)];
  breatheAt([short, other], [[0.0625]]);
  assert.equal(short[0].end, 0.03125);
  assert.equal(other[0].end, 0.0625);
});
