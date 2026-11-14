import { test } from 'node:test';
import assert from 'node:assert/strict';
import { holdFinalNotes } from '../src/notation/final-chord.js';

/** A note map entry: pitch, start and end in whole notes. */
const note = (pitch, start, end) => ({ pitch, start, end });

test('a proposta that ends a bar early holds its last note to the final chord', () => {
  const proposta = [note(60, 0, 1), note(62, 1, 2)];
  const risposta = [note(55, 1, 2), note(57, 2, 3)];
  holdFinalNotes([proposta, risposta]);
  assert.deepEqual(proposta.map((n) => n.end), [1, 3]); // only the last note grows
  assert.deepEqual(risposta.map((n) => n.end), [2, 3]); // the last voice is unchanged
});

test('every note of a final chord in an early voice is held', () => {
  const upper = [note(64, 0, 1), note(67, 0, 1)];
  const lower = [note(48, 0, 2)];
  holdFinalNotes([upper, lower]);
  assert.deepEqual(upper.map((n) => n.end), [2, 2]);
});

test('a silent voice with no notes is left empty, and no notes are added', () => {
  const voices = [[], [note(60, 0, 1)], [note(55, 0, 0.5)]];
  holdFinalNotes(voices);
  assert.deepEqual(voices.map((v) => v.length), [0, 1, 1]);
  assert.equal(voices[2][0].end, 1);
});
