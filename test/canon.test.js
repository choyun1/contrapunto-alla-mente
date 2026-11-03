import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonInterval, canonMarks, spanVerdict, consonantSpans, consecutivePerfects, checkProposta,
} from '../src/taneyev/canon.js';
import { parsePitch, pitchName } from '../src/common/diatonic.js';

// Intervals and spans are zero-indexed: a step is 1, a 3rd 2, an octave 7.

test('n = entry − span, Taneyev’s n = m + Jv with m = −span (video 4, 09:06)', () => {
  assert.equal(canonInterval(0, 7), 7); // repeated note at the octave above: octave
  assert.equal(canonInterval(2, 7), 5); // rising 3rd: 6th
  assert.equal(canonInterval(2, -7), -9); // rising 3rd, risposta an octave below: 10th
});

test('canon at the octave after one measure: a step makes a 7th or a 9th (Cho’s example)', () => {
  assert.equal(canonInterval(1, 7), 6);
  assert.equal(canonInterval(-1, 7), 8);
  assert.equal(spanVerdict(1, 7), 'suspension');
  assert.equal(spanVerdict(-1, 7), 'suspension');
});

test('canon at the octave above: the consonant spans', () => {
  // Down an octave, 6th, 5th, 3rd; repeat; up a 3rd, 4th, 6th, octave.
  assert.deepEqual(consonantSpans(7), [-7, -5, -4, -2, 0, 2, 3, 5, 7]);
});

test('canon at the octave below mirrors the octave above', () => {
  assert.deepEqual(consonantSpans(-7), [-7, -5, -3, -2, 0, 2, 4, 5, 7]);
});

test('canon at the unison: no steps and no 4ths', () => {
  assert.deepEqual(consonantSpans(0), [-7, -5, -4, -2, 0, 2, 4, 5, 7]);
});

test('canon at the 5th above: down a step, up a 3rd, down a 4th, up a 5th (stretto fuga, to check against Schubert)', () => {
  assert.deepEqual(consonantSpans(4, { range: 4 }), [-3, -1, 0, 2, 4]);
});

test('perfect and imperfect verdicts', () => {
  assert.equal(spanVerdict(0, 7), 'perfect'); // octave
  assert.equal(spanVerdict(3, 7), 'perfect'); // rising 4th gives a 5th
  assert.equal(spanVerdict(2, 7), 'free'); // rising 3rd gives a 6th
});

test('suspension marks come from the Jv = 0 chart, risposta as voice I (§§81–82, 90)', () => {
  // Rising step at the octave above: a 7th, suspended only in the upper voice (§82).
  assert.deepEqual(canonMarks(1, 7), { risposta: '—', proposta: '(—)' });
  // Falling step: a 9th, which may resolve to an octave in either voice (§81).
  assert.deepEqual(canonMarks(-1, 7), { risposta: '—', proposta: '—' });
  // Rising step at the octave below: the risposta is the lower voice of the 9th.
  assert.deepEqual(canonMarks(1, -7), { risposta: '—', proposta: '—' });
});

test('consecutive perfects need both voices to move', () => {
  assert.equal(consecutivePerfects(4, 4, true), true);
  assert.equal(consecutivePerfects(4, 11, true), true); // 5th to 12th (video 4, 20:08)
  assert.equal(consecutivePerfects(7, 7, false), false);
  assert.equal(consecutivePerfects(4, 7, true), false);
});

test('checkProposta flags steps and anti-parallel 5ths', () => {
  const steps = ['C4', 'D4', 'G4', 'C4'].map(parsePitch);
  const [first, second, third] = checkProposta(steps, 7, 1);
  assert.equal(first.verdict, 'suspension'); // C–D is a step: 7th
  assert.equal(second.n, 4); // D–G rises a 4th: 5th
  assert.equal(third.n, 11); // G–C falls a 5th: 12th
  assert.equal(third.consecutive, true);
});

test('checkProposta pairs notes one delay apart', () => {
  const steps = ['D4', 'F4', 'E4', 'D4'].map(parsePitch);
  const results = checkProposta(steps, 7, 2);
  assert.deepEqual(results.map((r) => r.span), [1, -2]); // D–E, F–D
});

test('pitch names parse to diatonic steps', () => {
  assert.equal(parsePitch('E4'), 30);
  assert.equal(pitchName(parsePitch('g3')), 'G3');
  assert.equal(parsePitch('H4'), null);
});
