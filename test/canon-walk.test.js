import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomProposta, rispostaFor } from '../src/taneyev/canon-walk.js';
import { checkProposta, keepsSide, VERDICT } from '../src/taneyev/canon.js';
import { isTritone, parsePitch } from '../src/common/diatonic.js';

// Intervals are zero-indexed: 5th 4, octave 7, 12th 11. Pitches are diatonic steps.

/** A seeded random number generator, so the tests are repeatable (mulberry32). */
function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const C4 = parsePitch('C4');
const RANGE = { low: C4 - 5, high: C4 + 5 };

// The drill pages' canons at delays 1 to 3 (drills/common.js CANONS).
const ENTRIES = [0, 7, -7, 4, -4, 3, -3, 5, -5, 11, -11, 9, -9];

test('every random proposta is a correct first-species canon (canon.js checkProposta)', () => {
  for (const entry of ENTRIES) {
    for (const delay of [1, 2, 3]) {
      const proposta = randomProposta({ start: C4, entry, delay, length: 12, range: RANGE, random: seeded(entry * 10 + delay) });
      assert.ok(proposta, `entry ${entry}, delay ${delay}`);
      assert.equal(proposta.length, 12);
      for (const result of checkProposta(proposta, entry, delay)) {
        assert.notEqual(result.verdict, VERDICT.SUSPENSION, `entry ${entry}, delay ${delay}`);
        assert.ok(!result.consecutive && !result.similar && keepsSide(result.n, entry));
      }
      proposta.slice(1).forEach((step, k) => assert.ok(!isTritone(step, proposta[k])));
      proposta.forEach((step) => assert.ok(step >= RANGE.low && step <= RANGE.high));
    }
  }
});

test('the risposta is the proposta moved by the interval of entrance, after the delay', () => {
  assert.deepEqual(rispostaFor([28, 30, 29], 4, 1), [null, 32, 34]);
});
