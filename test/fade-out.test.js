import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fadeGain, fadeOut, soundEnd } from '../src/notation/fade-out.js';
import { ringOn } from '../src/notation/final-chord.js';

test('the fade starts at full gain and ends at silence, gently at both ends', () => {
  assert.equal(fadeGain(0), 1);
  assert.ok(Math.abs(fadeGain(0.5) - 0.5) < 1e-12);
  assert.ok(fadeGain(1) < 1e-12);
  assert.ok(fadeGain(0.05) > 0.99); // barely changed at first
});

test('only the last seconds of the sound are faded, down to silence', () => {
  const samples = new Float32Array(10).fill(1);
  fadeOut([samples], 4, 1); // 4 samples a second: the last 4 samples fade
  assert.deepEqual([...samples.slice(0, 6)], [1, 1, 1, 1, 1, 1]);
  assert.equal(samples[6], 1);
  assert.ok(samples[9] < samples[8] && samples[8] < samples[7] && samples[7] < 1);
});

test('the fade ends where the sound runs out, not at the end of the buffer (a short soundfont sample)', () => {
  const samples = new Float32Array(12).fill(1);
  samples.fill(0, 8); // the sample stops after 8 of 12 samples
  assert.equal(soundEnd([samples]), 8);
  fadeOut([samples], 4, 1);
  assert.deepEqual([...samples.slice(0, 5)], [1, 1, 1, 1, 1]);
  assert.ok(samples[7] < samples[6] && samples[6] < samples[5] && samples[5] < 1);
});

test('the final chord rings on past the end; earlier notes are left alone', () => {
  const upper = [{ start: 0, end: 1 }, { start: 1, end: 2 }];
  const lower = [{ start: 0, end: 2 }];
  ringOn([upper, lower], 0.5);
  assert.deepEqual(upper.map((n) => n.end), [1, 2.5]);
  assert.equal(lower[0].end, 2.5);
});
