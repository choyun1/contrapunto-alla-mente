import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickWeighted, recordAnswer, weightOf } from '../src/drills/deck.js';

test('a miss raises a prompt’s weight, a clean answer lowers it back to 1', () => {
  let stats = recordAnswer({}, 'x', true);
  assert.equal(weightOf(stats, 'x'), 3);
  stats = recordAnswer(stats, 'x', true);
  assert.equal(weightOf(stats, 'x'), 5);
  for (let k = 0; k < 10; k += 1) stats = recordAnswer(stats, 'x', false);
  assert.equal(weightOf(stats, 'x'), 1);
  assert.deepEqual([stats.x.seen, stats.x.missed], [12, 2]);
});

test('weights never pass the cap', () => {
  let stats = {};
  for (let k = 0; k < 10; k += 1) stats = recordAnswer(stats, 'x', true);
  assert.equal(weightOf(stats, 'x'), 8);
});

test('prompts are drawn in proportion to their weight', () => {
  const weight = (item) => ({ a: 1, b: 3 })[item];
  assert.equal(pickWeighted(['a', 'b'], weight, () => 0.2), 'a'); // 0.8 of 4 falls in a's 1
  assert.equal(pickWeighted(['a', 'b'], weight, () => 0.3), 'b'); // 1.2 of 4 falls in b's 3
});
