import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { keySignature, readBars } from '../src/notation/abc-read.js';
import { KIND, dissonances, isAltered, isStrongBeat, worthShowing } from '../src/taneyev/florid.js';
import { dissonancesOf, timelines } from '../notebook/score.js';

/** The text of a notebook example's abc file. */
const load = (file) => readFileSync(new URL(`../notebook/examples/${file}`, import.meta.url), 'utf8');

/** The dissonances shown for an example that start at time t (whole notes from the start). */
const at = (file, t) => dissonancesOf(load(file)).filter((d) => Math.abs(d.start - t) < 1e-9);

/** A single note for building small voices by hand: { step, semitones } only. */
const note = (step, semitones) => ({ step, semitones });

test('key signatures: K:D has F# and C#, K:Bb has Bb and Eb, K:Am has none', () => {
  assert.deepEqual(keySignature('K:D\n'), { F: 1, C: 1 });
  assert.deepEqual(keySignature('K:Bb\n'), { B: -1, E: -1 });
  assert.deepEqual(keySignature('K:Am\n'), {});
});

test('semitones: the key applies, an accidental holds to the bar line, a tie keeps it', () => {
  const [first, second] = readBars('F ^C C- | C C |', 1 / 4, keySignature('K:C\n'));
  assert.deepEqual(first.map((n) => n.semitones), [53, 49, 49]); // F4, C#4, C#4 again
  assert.deepEqual(second.map((n) => n.semitones), [49, 48]); // tied C# keeps its sharp; then C natural
  const [inD] = readBars('F =F', 1 / 4, keySignature('K:D\n'));
  assert.deepEqual(inD.map((n) => n.semitones), [54, 53]);
});

test('altered intervals: C#–G is a diminished 5th, C–G a perfect one, F–B an augmented 4th', () => {
  assert.equal(isAltered(note(28, 49), note(32, 55)), true);
  assert.equal(isAltered(note(28, 48), note(32, 55)), false);
  assert.equal(isAltered(note(31, 53), note(34, 59)), true);
});

test('strong beats in 4/4: beats 1 and 3 only', () => {
  assert.deepEqual([0, 0.25, 0.5, 0.75, 1.125].map(isStrongBeat), [true, false, true, false, false]);
});

test('IC p. 5 (#2), bar 3 beat 1: R over CF is a 9–8 suspension', () => {
  const [d] = at('ic05b-canon-5th-above-b-flat.abc', 2);
  assert.equal(d.kind, KIND.SUSPENSION);
  assert.equal(d.label, '9–8');
});

test('IC p. 6 (#3), bar 4 beat 1: R over CF is a 7–6 suspension', () => {
  const found = at('ic06a-canon-5th-above.abc', 3).find((d) => d.voices.join() === 'R,CF');
  assert.equal(found.kind, KIND.SUSPENSION);
  assert.equal(found.label, '7–6');
});

test('IC p. 6 (#4), bar 4 beat 2½: R C# against P G is caught as a tritone to check', () => {
  const found = at('ic06b-canon-12th-above.abc', 3 + 3 / 8).find((d) => d.voices.join() === 'R,P');
  assert.equal(found.tritone, true);
  assert.equal(found.kind, KIND.CHECK);
});

test('IC p. 10 (#7): every dissonance on beat 1 is a suspension; R’s D on bar 6 beat 3 is left by leap', () => {
  const list = dissonancesOf(load('ic10-canon-5th-below-then-free.abc'));
  const downbeats = list.filter((d) => Number.isInteger(d.start));
  assert.ok(downbeats.length >= 3);
  assert.ok(downbeats.every((d) => d.kind === KIND.SUSPENSION), downbeats.map((d) => d.kind).join());
  assert.equal(list.find((d) => d.start === 5.5).kind, KIND.CHECK); // E–D–G over the cantus C
});

test('a 7th suspended in the lower voice, resolving to an octave, is not a suspension (§90)', () => {
  // lower C4 tied over the bar line under E5, the upper moves to B4 (a 7th), then the lower down to B3 (an octave)
  const abc = 'L:1/4\nK:C\n[V:U] e2 e2 | B4 |]\n[V:L] z2 C2- | C2 B,2 |]\n';
  const found = dissonances(timelines(abc)).find((d) => d.start === 1);
  assert.equal(found.steps, 6); // zero-indexed: 6 is a 7th
  assert.notEqual(found.kind, KIND.SUSPENSION);
});

test('a 7th suspended in the upper voice, resolving down to a 6th, is a 7–6 (Fux, fourth species)', () => {
  const abc = 'L:1/4\nK:C\n[V:U] z2 G2- | G F z2 |]\n[V:L] C2 E2 | A,4 |]\n';
  const found = dissonances(timelines(abc)).find((d) => d.start === 1);
  assert.equal(found.kind, KIND.SUSPENSION);
  assert.equal(found.label, '7–6');
});

test('a weak-beat passing tone is not shown; a weak-beat leap into a dissonance is', () => {
  const passing = 'L:1/4\nK:C\n[V:U] E F G2 |]\n[V:L] C4 |]\n';
  assert.equal(worthShowing(dissonances(timelines(passing))).length, 0);
  const leap = 'L:1/4\nK:C\n[V:U] E B c2 |]\n[V:L] C4 |]\n';
  assert.equal(worthShowing(dissonances(timelines(leap)))[0].kind, KIND.CHECK);
});

test('a 9th suspended in the lower voice is a 9–10, not a 9–8 (Fux, fourth species)', () => {
  const below = 'L:1/4\nK:C\n[V:U] e2 e2 | d2 d2 |]\n[V:L] z2 C2- | C2 B,2 |]\n';
  assert.equal(dissonances(timelines(below)).find((d) => d.start === 1).label, '9–10');
});

test('a cantus whole note against a dissonance on beat 3 is not a suspension: it was not syncopated', () => {
  // F4 whole note; the upper passes D5 C5 B4 A4, and B4 on beat 3 is a tritone (IC p. 29, bar 3)
  const abc = 'L:1/4\nK:C\n[V:O] d c B A |]\n[V:CF] F4 |]\n';
  const found = dissonances(timelines(abc)).find((d) => d.start === 0.5);
  assert.equal(found.kind, KIND.CHECK);
  assert.equal(found.tritone, true);
});

test('a note held over from a rest in the other voice can be suspended: the canon’s entry (IC p. 21, bar 2)', () => {
  const abc = 'L:1/4\nK:C\n[V:R] z4 | G2 c2 |]\n[V:P] C2 F2- | F E A2 |]\n';
  const found = dissonances(timelines(abc)).find((d) => d.start === 1);
  assert.equal(found.kind, KIND.SUSPENSION);
  assert.equal(found.label, '2–3');
});
