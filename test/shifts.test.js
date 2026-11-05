import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allShifts, inRange, isCommonShift, bookEntry, shiftTitle, shiftNote, BOOK_SHIFTS } from '../src/taneyev/shifts.js';
import { intervalName } from '../src/taneyev/rules.js';
import { isEasyShift } from '../src/taneyev/three-voices.js';

test('the charts page offers every Jv from −21 to +21, as the three-voice page does', () => {
  const jvs = allShifts();
  assert.equal(jvs.length, 43);
  assert.equal(jvs[0], -21);
  assert.equal(jvs.at(-1), 21);
  assert.ok(inRange(-21) && inRange(0) && !inRange(22) && !inRange(1.5));
});

test('the common shifts are 0 and inversion at the octave, 10th and 12th (−7, −9, −11)', () => {
  assert.deepEqual(allShifts().filter(isCommonShift), [-11, -9, -7, 0]);
});

test('the three-voice page calls the same shifts easy', () => {
  for (const jv of allShifts()) assert.equal(isEasyShift(jv), isCommonShift(jv));
});

test('Taneyev’s practice order runs 2 to 10 with no gaps (−9 second, −11 third, −7 sixth)', () => {
  const orders = BOOK_SHIFTS.map((e) => e.order).filter(Boolean).sort((a, b) => a - b);
  assert.deepEqual(orders, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(bookEntry(-11).order, 3);
  assert.equal(bookEntry(-8), undefined);
});

test('titles name the interval of inversion, zero-indexed (−11 is the 12th, −7 the octave)', () => {
  assert.equal(shiftTitle(0), 'Simple counterpoint');
  assert.equal(shiftTitle(-11), 'Invertible at the 12th');
  assert.equal(shiftTitle(-7), 'Invertible at the octave');
  assert.equal(shiftTitle(-21), 'Invertible at the 22nd');
  assert.equal(shiftTitle(3), 'Direct shift up a 4th');
  assert.equal(shiftTitle(7), 'Direct shift up an octave');
  assert.equal(shiftTitle(10), 'Direct shift up an 11th');
});

test('notes say when a shift is outside the book', () => {
  assert.match(shiftNote(-11), /Third in Taneyev’s practice order/);
  assert.match(shiftNote(-8), /Not one of the shifts Taneyev works through/);
});

test('interval names past the 15th take the right ordinal (zero-indexed: 20 is the 21st)', () => {
  assert.equal(intervalName(15), '16th');
  assert.equal(intervalName(20), '21st');
  assert.equal(intervalName(21), '22nd');
  assert.equal(intervalName(-21), '22nd (crossed)');
});
