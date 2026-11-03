import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chart, combine, baseMarks, forbidsSimilarMotion, parallelSurvives } from '../src/taneyev/rules.js';

const row = (c, voice) => c.map((col) => col[voice]);

test('Jv = 0 marks match Taneyev §90 (video 2, frame 0055)', () => {
  const c = chart(0, { width: 8 });
  assert.deepEqual(row(c, 'above'), ['x', '(—)', 'x', '—', 'x', '---', '—', 'x', '—']);
  assert.deepEqual(row(c, 'below'), ['x', '—', 'x', '—', '---', 'x', '(—)', 'x', '—']);
});

test('Jv = −11 combined rules match the video chart (video 2, frame 0071)', () => {
  const c = chart(-11);
  assert.deepEqual(row(c, 'above'), ['x', '(—)', 'x', '—', 'x', '(—)', '— x', 'x', '—', 'x', '—', 'x']);
  assert.deepEqual(row(c, 'below'), ['x', '—', 'x', '—', 'x', '— x', '(—)', 'x', '—', 'x', '(—)', 'x']);
});

test('negative intervals swap the marks of their positive form', () => {
  assert.deepEqual(baseMarks(-6), { above: '(—)', below: '—' });
});

test('a 9th may resolve to an octave in the upper voice, a 2nd may not (§81)', () => {
  assert.equal(baseMarks(1).above, '(—)');
  assert.equal(baseMarks(8).above, '—');
});

test('the 5th–6th exchange suppresses x (§135)', () => {
  // At −7 the 4th becomes a 5th: the upper voice keeps a plain —.
  assert.equal(combine(3, [-7]).above, '—');
  assert.equal(combine(3, [-7]).below, '— x');
});

test('with two shifts, x needs the dotted line in every consonant version (Segall n. 16)', () => {
  // Jv = 3 and −8: interval 1 becomes 4 (dotted below) and −7 (no dotted line), so x stays.
  assert.equal(combine(1, [3, -8]).below, '— x');
});

test('§101: similar motion is forbidden when |Jv| is a 2nd, 3rd, 6th or 7th', () => {
  assert.deepEqual([0, -2, 3, -4, 5, -7, -8, -9, -11, -12, -13, -14].filter(forbidsSimilarMotion),
    [-2, 5, -8, -9, -12, -13]);
});

test('parallel chains', () => {
  assert.equal(parallelSurvives(2, -7), true); // 3rds become 6ths
  assert.equal(parallelSurvives(5, -11), false); // 6ths become 7ths
  assert.equal(parallelSurvives(2, -9), false); // 3rds become octaves
});
