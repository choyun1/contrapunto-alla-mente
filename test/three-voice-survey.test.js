import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STARTING_NOTES, exampleForSplit, KIND } from '../src/taneyev/three-voice-pick.js';

// The committed answer key (npm run build-survey). A full check would rerun the
// whole search (minutes), so this checks its shape and a few entries against it.
const survey = JSON.parse(readFileSync(new URL('../data/three-voice-survey.json', import.meta.url), 'utf8'));
const F3 = 24;
const C4 = 28;

test('the answer key covers every starting note the page offers', () => {
  for (let step = STARTING_NOTES.from; step <= STARTING_NOTES.to; step += 1) {
    assert.ok(survey[step], `starting step ${step}`);
    assert.ok(Array.isArray(survey[step][KIND.FIRST]) && Array.isArray(survey[step][KIND.MIXED]));
  }
});

test('answer-key entries agree with the search (F3: −7 + −4 first, −7 + −5 mixed; C4: −1 + −2 mixed)', () => {
  const has = (start, kind, [total, upper, lower]) => survey[start][kind].some((r) => r.join() === [total, upper, lower].join());
  assert.ok(has(F3, KIND.FIRST, [-11, -7, -4]));
  assert.equal(exampleForSplit({ upper: -7, lower: -4 }, { start: F3 }).kind, KIND.FIRST);
  assert.ok(has(F3, KIND.MIXED, [-12, -7, -5]));
  assert.equal(exampleForSplit({ upper: -7, lower: -5 }, { start: F3 }).kind, KIND.MIXED);
  assert.ok(has(C4, KIND.MIXED, [-3, -1, -2]));
});

test('a split with no example is absent: −1 + 0 from C4', () => {
  const listed = [...survey[C4][KIND.FIRST], ...survey[C4][KIND.MIXED]].some((r) => r.join() === '-1,-1,0');
  assert.equal(listed, false);
  assert.equal(exampleForSplit({ upper: -1, lower: 0 }, { start: C4 }), null);
});
