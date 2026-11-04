import { test } from 'node:test';
import assert from 'node:assert/strict';
import { threeVoiceExample } from '../src/taneyev/three-voice-examples.js';
import { splitShift, pairShifts } from '../src/taneyev/three-voices.js';
import { isConsonant } from '../src/taneyev/rules.js';
import { moveSurvivesShift } from '../src/taneyev/motion.js';
import { voicesTune } from '../src/notation/abc.js';

const PAIRS = [['upper', 'middle'], ['middle', 'lower'], ['upper', 'lower']];

/** Every split of −11 that has an example. */
const examples = splitShift(-11)
  .map((split) => ({ split, example: threeVoiceExample(split) }))
  .filter(({ example }) => example);

test('the 12th has examples for octave + 5th, 5th + octave and 3rd + 10th', () => {
  const found = examples.map(({ split }) => `${split.upper} ${split.lower}`);
  for (const wanted of ['-7 -4', '-4 -7', '-2 -9']) assert.ok(found.includes(wanted), wanted);
});

test('the lower voice is the cantus and stays put; the others move by their shifts', () => {
  for (const { split, example } of examples) {
    const { middleLower, upperLower } = pairShifts(split);
    example.original.forEach((chord, k) => {
      const shifted = example.shifted[k];
      assert.equal(chord.lower, example.cantus[k]);
      assert.equal(shifted.lower, chord.lower);
      assert.equal(shifted.middle - chord.middle, middleLower);
      assert.equal(shifted.upper - chord.upper, upperLower);
    });
  }
});

test('every pair is consonant in both versions (two-voice rules, Taneyev §90)', () => {
  for (const { example } of examples) {
    for (const chord of [...example.original, ...example.shifted]) {
      for (const [high, low] of PAIRS) assert.ok(isConsonant(chord[high] - chord[low]));
    }
  }
});

test('no pair moves into a forbidden perfect consonance, before or after the shift (Fux; §101)', () => {
  for (const { split, example } of examples) {
    const { upperMiddle, middleLower, upperLower } = pairShifts(split);
    const jvs = [upperMiddle, middleLower, upperLower];
    for (let k = 1; k < example.original.length; k += 1) {
      PAIRS.forEach(([high, low], p) => {
        const from = { voiceI: example.original[k - 1][high], voiceII: example.original[k - 1][low] };
        const to = { voiceI: example.original[k][high], voiceII: example.original[k][low] };
        assert.ok(moveSurvivesShift(from, to, jvs[p]));
      });
    }
  }
});

test('−7 + −7 has no example while the 4th counts as a dissonance', () => {
  // Every usable chord has the outer voices an octave apart, so they move in parallel octaves.
  assert.equal(threeVoiceExample({ upper: -7, lower: -7 }), null);
});

test('voicesTune keeps the given staff order unless asked to sort', () => {
  const measures = [{ a: 21, b: 35 }];
  const voices = [{ id: 'A', key: 'a', name: 'A' }, { id: 'B', key: 'b', name: 'B' }];
  assert.match(voicesTune(measures, voices), /%%score \(B\) \(A\)/);
  assert.match(voicesTune(measures, voices, { sortByPitch: false }), /%%score \(A\) \(B\)/);
});
