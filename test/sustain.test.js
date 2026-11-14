import { test } from 'node:test';
import assert from 'node:assert/strict';
import { takeLongNotes, sustainCopies, copyGain, mixLongNote, sampleName, LOOP } from '../src/notation/sustain.js';

test('a held note longer than a sample is taken out of the note map to be looped (canon at a two-bar delay, Cho 2026-11-14)', () => {
  const voice = [{ pitch: 60, instrument: 'viola', start: 0, end: 1 }, { pitch: 62, instrument: 'viola', start: 1, end: 5 }];
  const taken = takeLongNotes([voice], 2);
  assert.deepEqual(voice.map((n) => n.pitch), [60]);
  assert.deepEqual(taken.map((n) => n.pitch), [62]);
});

test('a long piano note is left to die away, not looped', () => {
  const voice = [{ pitch: 60, instrument: 'acoustic_grand_piano', start: 0, end: 5 }];
  assert.deepEqual(takeLongNotes([voice], 2), []);
  assert.equal(voice.length, 1);
});

test('the loop copies overlap by the crossfade and cover the whole note', () => {
  const copies = sustainCopies(12);
  assert.deepEqual(copies[0], { at: 0, from: 0, length: LOOP.to });
  for (let i = 1; i < copies.length; i += 1) {
    const before = copies[i - 1];
    assert.equal(before.at + before.length - copies[i].at, LOOP.crossfade);
    assert.equal(copies[i].from, LOOP.from);
  }
  const last = copies.at(-1);
  assert.ok(last.at + last.length >= 12);
});

test('across a crossfade the two gains keep the power level (sin² + cos² = 1)', () => {
  for (const t of [0, 0.25, 0.5, 0.9]) {
    const rising = copyGain(t, 4.5, 1, false, false);
    const falling = copyGain(4.5 - 1 + t, 4.5, 1, false, false);
    assert.ok(Math.abs(rising ** 2 + falling ** 2 - 1) < 1e-9);
  }
});

test('a looped note of a steady sample sounds at a steady level, with no gap at the joins', () => {
  const rate = 100;
  const sample = [new Float32Array(600).fill(1)];
  const out = [new Float32Array(1500)];
  mixLongNote(out, sample, rate, { start: 0, seconds: 12, gain: 1, fadeSeconds: 0.2 });
  for (let n = 0; n < 1200; n += 1) assert.ok(out[0][n] > 0.99, `quiet at ${n / rate} s`);
  assert.ok(out[0][1225] === 0);
});

test('sample files are named with flats, like abcjs', () => {
  assert.equal(sampleName(60), 'C4');
  assert.equal(sampleName(61), 'Db4');
  assert.equal(sampleName(21), 'A0');
});
