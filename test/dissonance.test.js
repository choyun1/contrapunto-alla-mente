import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maySuspend, suspensionMark, resolutionOf, isPassingTone } from '../src/taneyev/dissonance.js';

test('Jv = 0: a 2nd may not be suspended above, a 7th not below (§81–82; video 2, frame 0055)', () => {
  assert.equal(maySuspend(1, 0, 'above'), false); // would resolve to a unison
  assert.equal(maySuspend(1, 0, 'below'), true); // 2–3
  assert.equal(maySuspend(6, 0, 'above'), true); // 7–6
  assert.equal(maySuspend(6, 0, 'below'), false); // would resolve to an octave
  assert.equal(maySuspend(8, 0, 'above'), true); // 9–8 (§81)
});

test('Jv = −11: the 6th becomes a 7th, so it is suspended above as — x and not at all below (video 2, frame 0071)', () => {
  assert.equal(suspensionMark(5, -11, 'above'), '(—)');
  assert.equal(suspensionMark(5, -11, 'below'), '— x');
  assert.equal(suspensionMark(6, -11, 'above'), '— x');
  assert.equal(maySuspend(6, -11, 'below'), false);
});

test('a suspension resolves by the suspended voice stepping down (Fux, fourth species)', () => {
  assert.equal(resolutionOf(6, 'above'), 5); // 7th → 6th
  assert.equal(resolutionOf(3, 'above'), 2); // 4th → 3rd
  assert.equal(resolutionOf(1, 'below'), 2); // 2nd → 3rd
  assert.equal(resolutionOf(-6, 'above'), -7); // crossed: voice I is below and steps further down
});

test('a passing tone steps in and on in the same direction (Fux, second species)', () => {
  assert.equal(isPassingTone(28, 29, 30), true); // C D E
  assert.equal(isPassingTone(30, 29, 28), true); // E D C
  assert.equal(isPassingTone(28, 29, 28), false); // a neighbour, not a passing tone
  assert.equal(isPassingTone(28, 30, 32), false); // leaps
});
