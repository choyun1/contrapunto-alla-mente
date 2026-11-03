import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abcPitch, clefFor, twoVoiceTune } from '../src/notation/abc.js';
import { pitchName, MIDDLE_C } from '../src/common/diatonic.js';
import { intervalStrip, parallelChain } from '../src/taneyev/examples.js';

test('diatonic steps name the right pitches', () => {
  assert.equal(pitchName(MIDDLE_C), 'C4');
  assert.equal(pitchName(MIDDLE_C - 1), 'B3');
  assert.equal(pitchName(MIDDLE_C + 11), 'G5');
});

test('abc spelling across octaves', () => {
  assert.deepEqual([21, 27, 28, 35, 42].map(abcPitch), ['C,', 'B,', 'C', 'c', "c'"]);
});

test('clef follows where the voice sits', () => {
  assert.equal(clefFor([28, 30, 32]), 'treble');
  assert.equal(clefFor([17, 19, 28]), 'bass');
});

test('interval strip at Jv = −11: the 3rd E4 over C4 becomes A2 under C4, a 10th', () => {
  const third = intervalStrip(-11)[2];
  assert.equal(pitchName(third.original.voiceI), 'E4');
  assert.equal(pitchName(third.derivative.voiceI), 'A2');
  assert.equal(third.n, -9);
  assert.equal(third.kind, 'fixed-consonance');
});

test('parallel chains: 3rds survive −7 as 6ths, but become octaves at −9', () => {
  assert.equal(parallelChain(2, -7).survives, true);
  assert.equal(parallelChain(2, -7).verdict, 'parallel 6ths: fine');
  assert.equal(parallelChain(2, -9).verdict, 'parallel octaves: forbidden');
  assert.equal(parallelChain(5, -11).verdict, 'parallel 7ths: dissonant');
});

test('a two-voice tune puts each voice on its own staff', () => {
  const abc = twoVoiceTune([{ voiceI: 30, voiceII: 28, textI: '2' }]);
  assert.match(abc, /V:I clef=treble name="I"/);
  assert.match(abc, /\[V:I\]\n"\^2"E1 \|]/);
});

test('a section after a double bar switches clef when the voice moves down', () => {
  const abc = twoVoiceTune([
    { voiceI: 30, voiceII: 28, doubleBarAfter: true },
    { voiceI: 19, voiceII: 28 },
  ]);
  assert.match(abc, /\[V:I\]\nE1 \|\| \[K:clef=bass\] A,,1 \|]/);
});
