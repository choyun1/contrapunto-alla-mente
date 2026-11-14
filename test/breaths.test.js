import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breatheAfter, breathMarks, BREATH } from '../src/notation/breaths.js';

/** A note map entry: start and end in whole notes, and where its text starts. */
const note = (startChar, start, end) => ({ startChar, start, end });

test('a note with a breath mark is cut short by a sixteenth (IC p. 19, bar 4, Cho 2026-11-14)', () => {
  const voice = [note(10, 0, 0.25), note(14, 0.25, 0.5)];
  breatheAfter([voice], new Set([10]));
  assert.equal(voice[0].end, 0.25 - BREATH);
  assert.equal(voice[1].end, 0.5); // the next note is untouched
});

test('a breath never takes more than half of a short note', () => {
  const voice = [note(3, 0, 0.0625)];
  breatheAfter([voice], new Set([3]));
  assert.equal(voice[0].end, 0.03125);
});

test('a breath on a spacer (!breath!y) marks the note before it; one on a note marks that note', () => {
  const pitch = [{ pitch: 0 }];
  const tune = { lines: [{ staff: [{ voices: [[
    { el_type: 'note', startChar: 5, pitches: pitch },
    { el_type: 'note', startChar: 9, rest: { type: 'spacer' }, decoration: ['breath'] },
    { el_type: 'note', startChar: 19, pitches: pitch },
    { el_type: 'bar', startChar: 22 },
    { el_type: 'note', startChar: 23, pitches: pitch, decoration: ['breath'] },
  ]] }] }] };
  assert.deepEqual([...breathMarks(tune)], [5, 23]);
});
