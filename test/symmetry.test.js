import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crosses, motion, landing, mirrorStep, rotationSteps, consonancesKept, consonanceSymmetries,
} from '../src/taneyev/symmetry.js';
import { baseMarks, simple } from '../src/taneyev/rules.js';

// Intervals are zero-indexed: unison 0, 3rd 2, octave 7, 10th 9, 12th 11.

test('crossing: n = m + Jv below zero (§90)', () => {
  assert.equal(crosses(4, -7), true); // 5th inverted at the octave
  assert.equal(crosses(7, -7), false); // octave becomes a unison, not crossed
  assert.equal(crosses(2, 3), false);
});

test('motion: stay at Jv = 0, rotate in order, flip when crossed', () => {
  assert.equal(motion(4, 0), 'stay');
  assert.equal(motion(4, 3), 'rotate');
  assert.equal(motion(4, -9), 'flip');
  assert.equal(motion(9, -9), 'rotate'); // the 10th becomes a unison
});

test('a crossed interval lands on the mirror image k − m (mod 7), for every inversion in the charts', () => {
  for (const jv of [-7, -9, -11, -12, -13, -14]) {
    for (let m = 0; m < -jv; m += 1) {
      const k = -jv;
      assert.equal(landing(m, jv), ((k - m) % 7 + 7) % 7, `m = ${m}, Jv = ${jv}`);
    }
  }
});

test('the mirror passes through the unison, 2nd, 3rd and 7th for Jv = −7, −9, −11, −12', () => {
  assert.equal(mirrorStep(-7), 0);
  assert.equal(mirrorStep(-9), 1);
  assert.equal(mirrorStep(-11), 2);
  assert.equal(mirrorStep(-12), 6);
  assert.equal(mirrorStep(3), null);
});

test('the mirror step is fixed: it lands on itself (mod 7)', () => {
  for (const jv of [-7, -9, -11, -12, -13, -14]) {
    const s = mirrorStep(jv);
    assert.equal(((-jv - s) % 7 + 7) % 7, s, `Jv = ${jv}`);
  }
});

test('rotation takes the shortest turn of the heptagon', () => {
  assert.equal(rotationSteps(3), 3);
  assert.equal(rotationSteps(5), -2);
  assert.equal(rotationSteps(-1), -1);
  assert.equal(rotationSteps(7), 0);
});

test('consonances kept: 10th 4, octave and 12th 3, 9th and 11th 1 (Taneyev’s three main inversions lead)', () => {
  assert.equal(consonancesKept(-9), 4);
  assert.equal(consonancesKept(-7), 3);
  assert.equal(consonancesKept(-11), 3);
  assert.equal(consonancesKept(-12), 2);
  assert.equal(consonancesKept(-13), 2);
  assert.equal(consonancesKept(-8), 1);
  assert.equal(consonancesKept(-10), 1);
});

test('the only symmetries of the consonances are the identity and the inversion at the 10th', () => {
  assert.deepEqual(consonanceSymmetries(), [[1, 0], [6, 2]]);
});

test('voice exchange swaps the marks: a flip turns each label upside down (§90)', () => {
  for (let n = 1; n <= 14; n += 1) {
    const up = baseMarks(n);
    const down = baseMarks(-n);
    assert.deepEqual(down, { above: up.below, below: up.above }, `n = ${n}`);
    assert.equal(simple(-n), simple(n));
  }
});
