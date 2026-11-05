import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstSpeciesExample, fourNoteCanti, CANTI } from '../src/taneyev/first-species.js';
import { motion, isForbiddenMove, moveSurvivesShift } from '../src/taneyev/motion.js';
import { isConsonant, isPerfect } from '../src/taneyev/rules.js';
import { isTritone, MIDDLE_C } from '../src/common/diatonic.js';

const C4 = MIDDLE_C;
const dyad = (voiceI, voiceII) => ({ voiceI, voiceII });

// Every shift on the charts page, in page order.
const CHART_SHIFTS = [0, -7, -14, -11, -9, -4, -2, 3, 5, -12, -13];

test('motion names the four kinds', () => {
  assert.equal(motion(dyad(C4 + 4, C4), dyad(C4 + 5, C4 + 1)), 'similar');
  assert.equal(motion(dyad(C4 + 4, C4), dyad(C4 + 3, C4 + 1)), 'contrary');
  assert.equal(motion(dyad(C4 + 4, C4), dyad(C4 + 4, C4 + 1)), 'oblique');
  assert.equal(motion(dyad(C4 + 4, C4), dyad(C4 + 4, C4)), 'none');
});

test('Fux: parallel 5ths, similar motion into an octave, and 5th to 12th are forbidden', () => {
  assert.equal(isForbiddenMove(4, 4, 'similar'), true);
  assert.equal(isForbiddenMove(2, 7, 'similar'), true);
  assert.equal(isForbiddenMove(4, 11, 'contrary'), true);
  assert.equal(isForbiddenMove(2, 7, 'contrary'), false);
  assert.equal(isForbiddenMove(2, 2, 'similar'), false);
});

test('§101: at Jv = −9, parallel 3rds are forbidden (they become octaves); at −7 they are fine', () => {
  const from = dyad(C4 + 2, C4);
  const to = dyad(C4 + 3, C4 + 1);
  assert.equal(moveSurvivesShift(from, to, -9), false);
  assert.equal(moveSurvivesShift(from, to, -7), true);
});

for (const jv of CHART_SHIFTS) {
  test(`first-species example at Jv = ${jv} is correct before and after the shift`, () => {
    const example = firstSpeciesExample(jv);
    assert.ok(example, 'an example exists');
    assert.equal(example.original.length, 4);
    for (const version of [example.original, example.derivative]) {
      version.forEach((d) => {
        assert.ok(isConsonant(d.voiceI - d.voiceII), 'every interval consonant');
        assert.ok(!isTritone(d.voiceI, d.voiceII), 'no B–F 5th');
      });
    }
    for (let k = 1; k < 4; k += 1) {
      assert.ok(moveSurvivesShift(example.original[k - 1], example.original[k], jv), `move ${k} legal`);
      assert.notEqual(example.original[k].voiceI, example.original[k - 1].voiceI, 'voice I moves');
    }
    const last = example.original[3];
    assert.ok(isPerfect(last.voiceI - last.voiceII), 'closes on a perfect consonance');
    assert.equal(Math.abs(last.voiceI - example.original[2].voiceI), 1, 'closes by step');
    assert.deepEqual(example.n, example.m.map((m) => m + jv), 'n = m + Jv');
  });
}

test('Jv = −7 example stays C A B C over C F D C, closing on the unison after the shift', () => {
  const example = firstSpeciesExample(-7);
  assert.deepEqual(example.m, [7, 2, 5, 7]);
  assert.deepEqual(example.n, [0, -5, -2, 0]);
});

test('fourNoteCanti: every cantus starts and ends on its note, closes by step, and includes the four CANTI (Fux)', () => {
  const canti = fourNoteCanti(MIDDLE_C);
  for (const cantus of canti) {
    assert.equal(cantus[0], MIDDLE_C);
    assert.equal(cantus[3], MIDDLE_C);
    assert.equal(Math.abs(cantus[2] - cantus[3]), 1);
  }
  for (const cantus of CANTI) assert.ok(canti.some((c) => c.join() === cantus.join()), cantus.join());
});
