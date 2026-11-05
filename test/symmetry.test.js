import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crosses, motion, landing, mirrorStep, rotationSteps, consonancesKept, consonanceSymmetries,
  element, act, compose, ALL_ELEMENTS, word, cycles, pieces,
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

test('each chart is one symmetry: octave pairs (−11 and −4, −9 and −2, −7 and −14) share one', () => {
  assert.deepEqual(element(-11), element(-4));
  assert.deepEqual(element(-9), element(-2));
  assert.deepEqual(element(-7), element(-14));
  assert.deepEqual(element(3), { kind: 'turn', step: 3 });
  assert.deepEqual(element(-12), { kind: 'flip', step: 5 });
});

test('compose matches doing one symmetry after the other, for all 14 × 14 pairs', () => {
  for (const a of ALL_ELEMENTS) {
    for (const b of ALL_ELEMENTS) {
      for (let n = 0; n < 7; n += 1) assert.equal(act(compose(b, a), n), act(b, act(a, n)));
    }
  }
});

test('octave inversion then 10th inversion is a shift up a 3rd; every flip undoes itself', () => {
  assert.deepEqual(compose(element(-9), element(-7)), { kind: 'turn', step: 2 });
  for (const k of [0, 1, 2, 3, 4, 5, 6]) {
    const flip = { kind: 'flip', step: k };
    assert.deepEqual(compose(flip, flip), { kind: 'turn', step: 0 });
  }
});

test('words in r and s: +3 is r³, −7 is s, −11 is r⁴s, and −11 and −4 share a name', () => {
  assert.equal(word(element(0)), 'e');
  assert.equal(word(element(1)), 'r');
  assert.equal(word(element(3)), 'r³');
  assert.equal(word(element(-7)), 's');
  assert.equal(word(element(-8)), 'rs');
  assert.equal(word(element(-11)), 'r⁴s');
  assert.equal(word(element(-4)), word(element(-11)));
});

test('cycle notation: a turn is one 7-cycle, a flip three swaps around its mirror step', () => {
  assert.equal(cycles(element(0)), '( )');
  assert.equal(cycles(element(3)), '(0 3 6 2 5 1 4)');
  assert.equal(cycles(element(-7)), '(1 6)(2 5)(3 4)');
  assert.equal(cycles(element(-9)), '(0 2)(3 6)(4 5)');
  assert.equal(cycles(element(-11)), '(0 4)(1 3)(5 6)');
});

test('each word is the same symmetry as doing s, then r k times', () => {
  const r = { kind: 'turn', step: 1 };
  const s = element(-7);
  for (const k of [0, 1, 2, 3, 4, 5, 6]) {
    let made = s;
    for (let i = 0; i < k; i += 1) made = compose(r, made);
    assert.deepEqual(made, { kind: 'flip', step: k });
  }
});

test('the 14 symmetries have 14 different names', () => {
  assert.equal(new Set(ALL_ELEMENTS.map(word)).size, 14);
  assert.equal(new Set(ALL_ELEMENTS.map(cycles)).size, 14);
});

test('pieces: −4 flips 0–3 and turns 4–6 by three steps (§90); −11 and +3 are one piece', () => {
  const p = pieces(-4);
  assert.deepEqual(p.map((x) => x.ms), [[0, 1, 2, 3], [4, 5, 6]]);
  assert.deepEqual(p[1].e, { kind: 'turn', step: 3 });
  for (const x of p) for (const m of x.ms) assert.equal(act(x.e, m), landing(m, -4));
  assert.equal(pieces(-11).length, 1);
  assert.equal(pieces(3).length, 1);
});
