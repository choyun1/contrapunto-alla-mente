import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitShift, pairShifts, isEasySplit, fixedConsonances, middleEntry } from '../src/taneyev/three-voices.js';
import { pitchName } from '../src/common/diatonic.js';

test('every split of −11 adds back up to −11', () => {
  const splits = splitShift(-11);
  assert.equal(splits.length, 12);
  for (const s of splits) assert.equal(pairShifts(s).upperLower, -11);
});

test('the 12th splits as octave + 5th, 5th + octave and 3rd + 10th', () => {
  const has = (upper, lower) => splitShift(-11).some((s) => s.upper === upper && s.lower === lower);
  assert.ok(has(-4, -7)); // middle an octave above the lower voice
  assert.ok(has(-7, -4)); // middle a 5th above the lower voice
  assert.ok(has(-2, -9)); // middle a 10th above the lower voice
});

test('direct shifts split with positive parts', () => {
  assert.deepEqual(splitShift(3).map((s) => [s.upper, s.lower]), [[3, 0], [2, 1], [1, 2], [0, 3]]);
});

test('easy splits need both inner pairs at 0, −7, −9 or −11', () => {
  const easy = (total) => splitShift(total).filter(isEasySplit).map((s) => [s.upper, s.lower]);
  assert.deepEqual(easy(-11), [[-11, 0], [0, -11]]);
  assert.deepEqual(easy(-14), [[-7, -7]]);
  assert.deepEqual(easy(-18), [[-11, -7], [-9, -9], [-7, -11]]);
});

test('fixed consonances follow the rules core (−7: 3rds, 6ths, 10ths and the octave)', () => {
  assert.deepEqual(fixedConsonances(-7), [0, 2, 5, 7, 9]);
});

test('in a canon on F3 and C5, octave + 5th puts the middle voice on F4', () => {
  const F3 = 3 * 7 + 3;
  assert.equal(pitchName(F3 + 11), 'C5');
  assert.equal(pitchName(middleEntry(F3, { upper: -4, lower: -7 })), 'F4');
  assert.equal(pitchName(middleEntry(F3, { upper: -2, lower: -9 })), 'A4');
});
