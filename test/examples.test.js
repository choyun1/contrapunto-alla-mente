import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abcPitch, twoVoiceTune } from '../src/notation/abc.js';
import { ledgerLines, clefsForVoice } from '../src/notation/clefs.js';
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

test('ledger lines per clef', () => {
  assert.equal(ledgerLines(28, 'treble'), 1); // middle C
  assert.equal(ledgerLines(28, 'alto'), 0);
  assert.equal(ledgerLines(28, 'bass'), 1);
  assert.equal(ledgerLines(21, 'treble'), 4); // C3
});

test('clefs follow the register: treble high, bass low, alto in between', () => {
  assert.deepEqual(clefsForVoice([35, 36, 37]), ['treble', 'treble', 'treble']); // C5 D5 E5
  assert.deepEqual(clefsForVoice([18, 19, 20]), ['bass', 'bass', 'bass']); // G2 A2 B2
  assert.deepEqual(clefsForVoice([25, 28, 31]), ['alto', 'alto', 'alto']); // G3 C4 F4
});

test('a voice that drops two octaves changes clef once, not on every note', () => {
  // C5 D5 E5 F5, then the same an octave and a half lower
  const clefs = clefsForVoice([35, 36, 37, 38, 24, 25, 26, 27]);
  assert.deepEqual(clefs, ['treble', 'treble', 'treble', 'treble', 'bass', 'bass', 'bass', 'bass']);
});

test('a short dip below the staff does not trigger a change', () => {
  assert.deepEqual(clefsForVoice([32, 30, 28, 30, 32]), Array(5).fill('treble'));
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

test('a voice that drops after the double bar switches clef inline', () => {
  const abc = twoVoiceTune([
    { voiceI: 32, voiceII: 28, doubleBarAfter: true },
    { voiceI: 19, voiceII: 28 },
    { voiceI: 20, voiceII: 28 },
    { voiceI: 21, voiceII: 28 },
  ]);
  assert.match(abc, /\[V:I\]\nG1 \|\| \[K:clef=bass\] A,,1 \| B,,1 \| C,1 \|]/);
});
