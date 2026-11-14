import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parallels, parallelsBetween } from '../src/taneyev/parallels.js';
import { timelines } from '../notebook/score.js';

/** The text of a notebook example's abc file. */
const load = (file) => readFileSync(new URL(`../notebook/examples/${file}`, import.meta.url), 'utf8');

/** A voice of quarter notes from [step, semitones] pairs, null for a rest, timed from 0. */
const quarters = (notes) => notes.map((n, k) => ({ step: n?.[0] ?? null, semitones: n?.[1] ?? null, start: k / 4, length: 1 / 4 }));

test('octave to octave with both voices moving is a parallel, even in contrary motion (Fux, as in motion.js)', () => {
  const upper = quarters([[35, 60], [36, 62]]); // C5 D5
  const lower = quarters([[28, 48], [29, 50]]); // C4 D4
  assert.deepEqual(parallelsBetween(upper, lower), [{ start: 0.25, steps: 7 }]);
  const contrary = quarters([[35, 60], [29, 50]]); // C5 down to D4: octave to unison
  assert.deepEqual(parallelsBetween(contrary, quarters([[28, 48], [29, 50]])), [{ start: 0.25, steps: 0 }]);
});

test('no parallel when one voice holds, or when a diminished 5th goes to a perfect one', () => {
  assert.deepEqual(parallelsBetween(quarters([[32, 55], [32, 55]]), quarters([[28, 48], [28, 48]])), []); // repeated, nobody moves
  assert.deepEqual(parallelsBetween(quarters([[34, 59], [33, 57]]), quarters([[30, 53], [29, 52]])), []); // B–F (dim. 5th) to A–E
  assert.deepEqual(parallelsBetween(quarters([[32, 55], [33, 57]]), quarters([[28, 48], null])), []); // a rest breaks it
});

test('IC p. 20: parallel 12ths into bar 19 (C over F to B♭ over E♭)', () => {
  const found = parallels(timelines(load('ic20-canon-12th-c-minor.abc')));
  assert.deepEqual(found.map((p) => [p.start, p.steps]), [[18, 11]]);
});

test('the octaves Cho heard in an early IC p. 20 rework, bar 4: B♭–B♭ on the off-beat eighth, then C–C', () => {
  // R: C5 dotted quarter, B♭4 eighth, C5; P: A♭3 dotted quarter, B♭3 eighth, C4 (eighths here)
  const eighths = (notes) => notes.map(([step, semitones], k) => ({ step, semitones, start: k / 8, length: 1 / 8 }));
  const r = eighths([[35, 60], [35, 60], [35, 60], [34, 58], [35, 60]]);
  const p = eighths([[26, 44], [26, 44], [26, 44], [27, 46], [28, 48]]);
  assert.deepEqual(parallelsBetween(r, p), [{ start: 0.5, steps: 7 }]);
});

test('IC p. 19, last canon: octaves on the eighth into bar 6 and unisons at the end of bar 14', () => {
  const found = parallels(timelines(load('ic19c-canon-5th-below-f-with-ficta.abc')));
  assert.deepEqual(found.map((p) => [p.start, p.steps]), [[5, 7], [13.875, 0]]);
});
