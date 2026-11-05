import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chordAt, chordProblems, orderProblems, motionProblems, moveProblems, checkCanon,
} from '../src/taneyev/canon-check.js';
import { ORDERS, setupFor } from '../src/taneyev/canon-voices.js';
import { parsePitch } from '../src/common/diatonic.js';

// Intervals are zero-indexed: 4th 3, 5th 4, octave 7, 10th 9.

const p = (name) => parsePitch(name);
const chord = (r, c, pr) => ({ risposta: r === null ? null : p(r), cantus: p(c), proposta: p(pr) });
const R_CF_P = ORDERS[0];

test('a 4th between upper voices over a consonant bass passes; a 4th with the bass does not (video 4, 10:23)', () => {
  assert.deepEqual(chordProblems(chord('D5', 'A4', 'F4')), []);
  assert.deepEqual(chordProblems(chord(null, 'D4', 'A3')), ['4th between CF and P']);
});

test('chordProblems names dissonances, tritones and shared notes', () => {
  assert.deepEqual(chordProblems(chord(null, 'D4', 'C4')), ['2nd between CF and P']);
  assert.deepEqual(chordProblems(chord(null, 'F4', 'B3')), ['tritone between CF and P']);
  assert.deepEqual(chordProblems(chord('D4', 'D4', 'B3')), ['R and CF on the same note']);
});

test('orderProblems keeps each voice above the next and within a 10th', () => {
  const setup = { order: R_CF_P, entry: 11 };
  assert.deepEqual(orderProblems(chord('A4', 'D4', 'B3'), setup), []);
  assert.deepEqual(orderProblems(chord('C4', 'D4', 'B3'), setup), ['R is not above CF']);
  assert.deepEqual(orderProblems(chord('G5', 'D4', 'B3'), setup), ['R and CF more than a 10th apart']);
  assert.deepEqual(orderProblems(chord(null, 'D4', 'B3'), setup), [], 'a silent risposta is skipped');
});

test('at the unison the proposta and risposta may cross', () => {
  const order = ORDERS.find((o) => o[0] === 'cantus' && o[1] === 'risposta');
  assert.deepEqual(orderProblems(chord('A3', 'D4', 'C4'), { order, entry: 0 }), []);
});

test('motionProblems: parallel 5ths in any pair, hidden octaves only in the outer pair (Fux)', () => {
  assert.deepEqual(motionProblems(chord(null, 'A4', 'D4'), chord(null, 'B4', 'E4')), ['consecutive 5ths between CF and P']);
  assert.deepEqual(motionProblems(chord('A4', 'E4', 'C4'), chord('D5', 'F4', 'D4')), ['hidden octave between R and P']);
  assert.deepEqual(motionProblems(chord('C5', 'E4', 'C4'), chord('D5', 'G4', 'B3')), [], 'a hidden 5th between upper voices is fine');
});

test('moveProblems allows steps, 3rds to 5ths and the octave, not 6ths, 7ths or tritones (Fux)', () => {
  assert.deepEqual(moveProblems(p('D4'), p('A4')), []);
  assert.deepEqual(moveProblems(p('D4'), p('D5')), []);
  assert.deepEqual(moveProblems(p('D4'), p('B4')), ['P leaps a 6th']);
  assert.deepEqual(moveProblems(p('F4'), p('B4')), ['P leaps a tritone']);
  assert.deepEqual(moveProblems(null, p('B4')), []);
});

test('chordAt leaves the risposta silent before it enters and where its proposta bar is empty', () => {
  const setup = setupFor({ cantus: [p('D4'), p('F4'), p('E4')], order: R_CF_P, size: 11, delay: 1 });
  assert.equal(chordAt([p('G3'), null, null], setup, 0).risposta, null);
  assert.equal(chordAt([p('G3'), null, null], setup, 1).risposta, p('G3') + 11);
  assert.equal(chordAt([p('G3'), null, null], setup, 2).risposta, null);
});

test('checkCanon reports one list per bar and skips empty proposta bars', () => {
  const setup = setupFor({ cantus: [p('D4'), p('F4'), p('E4')], order: R_CF_P, size: 11, delay: 1 });
  const problems = checkCanon([p('G3'), null, p('D4')], setup);
  assert.equal(problems.length, 3);
  assert.deepEqual(problems[0], []);
  assert.deepEqual(problems[1], [], 'an empty bar has nothing to check');
  assert.deepEqual(problems[2], ['2nd between CF and P']);
});
