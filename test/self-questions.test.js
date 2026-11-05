import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selfQuestions } from '../src/taneyev/self-questions.js';

// Intervals are zero-indexed: Jv −7 is the octave, −9 the 10th, −11 the 12th.

const asked = (jv) => selfQuestions(jv).map((q) => q.question);

test('at the 12th: what if every 6th were a dissonance? (Movable Counterpoint 2, 19:19)', () => {
  assert.deepEqual(asked(-11), ['What if every 6th were a dissonance?']);
  assert.match(selfQuestions(-11)[0].answer, /7th/);
});

test('at the octave: what if every 5th were a dissonance? (it inverts to a 4th)', () => {
  assert.deepEqual(asked(-7), ['What if every 5th were a dissonance?']);
});

test('at the 10th: what if every 3rd and every 6th were perfect? (octave and 5th)', () => {
  assert.deepEqual(asked(-9), ['What if every 3rd were perfect?', 'What if every 6th were perfect?']);
});

test('the unison changes nothing, so it asks nothing', () => {
  assert.deepEqual(asked(0), []);
});
