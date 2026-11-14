import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restrikeLongNotes } from '../src/notation/sustain.js';

test('a held note longer than a sample is restruck in equal parts, same pitch, end to end (canon at a two-bar delay, Cho 2026-11-14)', () => {
  const voice = [{ pitch: 60, start: 7, end: 11 }];
  restrikeLongNotes([voice], 1);
  assert.deepEqual(voice.map((n) => [n.pitch, n.start, n.end]), [[60, 7, 8], [60, 8, 9], [60, 9, 10], [60, 10, 11]]);
});

test('notes no longer than the limit are left alone', () => {
  const voice = [{ pitch: 62, start: 0, end: 1.5 }, { pitch: 64, start: 1.5, end: 2 }];
  restrikeLongNotes([voice], 1.5);
  assert.equal(voice.length, 2);
  assert.equal(voice[0].end, 1.5);
});
