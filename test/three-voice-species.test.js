import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speciesExample, RHYTHM } from '../src/taneyev/three-voice-species.js';
import { threeVoiceExample } from '../src/taneyev/three-voice-examples.js';
import { pairShifts, isChordConsonance } from '../src/taneyev/three-voices.js';
import { maySuspend, isPassingTone } from '../src/taneyev/dissonance.js';

const C4 = 28;
const F3 = 24;

/** Examples that strict first species cannot give, with the starting note. */
const CASES = [
  { split: { upper: -1, lower: -2 }, start: C4 },
  { split: { upper: -7, lower: -5 }, start: F3 },
  { split: { upper: -3, lower: -7 }, start: C4 },
  { split: { upper: -11, lower: -2 }, start: C4 },
];
const examples = CASES.map((c) => ({ ...c, example: speciesExample(c.split, { start: c.start }) }));

/** The seven beats of one version as chords: each bar's downbeat and upbeat, then the close. */
function beatsOf(bars) {
  const pick = (value, k) => (Array.isArray(value) ? value[k] : value);
  const beats = [];
  for (const bar of bars.slice(0, -1)) {
    for (const k of [0, 1]) beats.push({ upper: pick(bar.upper, k), middle: pick(bar.middle, k), lower: bar.lower });
  }
  beats.push(bars.at(-1));
  return beats;
}

/** Is the pair a–b consonant within the chord, by the three-voice rules? */
function consonant(chord, a, b) {
  const lowest = Math.min(...Object.values(chord).filter((p) => p !== null));
  return isChordConsonance(a - b, Math.min(a, b) > lowest);
}

test('mixed species finds examples where strict first species finds none', () => {
  for (const { split, start, example } of examples) {
    assert.equal(threeVoiceExample(split, { start }), null, `${split.upper} ${split.lower}`);
    assert.ok(example, `${split.upper} ${split.lower}`);
  }
});

test('the lower voice stays put; the others move by their shifts', () => {
  for (const { split, example } of examples) {
    const { middleLower, upperLower } = pairShifts(split);
    const original = beatsOf(example.original);
    beatsOf(example.shifted).forEach((chord, k) => {
      assert.equal(chord.lower, original[k].lower);
      if (chord.middle !== null) assert.equal(chord.middle - original[k].middle, middleLower);
      if (chord.upper !== null) assert.equal(chord.upper - original[k].upper, upperLower);
    });
  }
});

test('every dissonance with the cantus is a suspension the marks allow, or a passing tone (Fux; §135)', () => {
  for (const { split, example } of examples) {
    const jv = { upper: pairShifts(split).upperLower, middle: pairShifts(split).middleLower };
    const versions = [beatsOf(example.original), beatsOf(example.shifted)];
    for (const v of ['upper', 'middle']) {
      const rhythm = example.texture[v];
      versions.forEach((beats) => beats.forEach((chord, k) => {
        if (chord[v] === null || consonant(chord, chord[v], chord.lower)) return;
        const line = versions[0].map((c) => c[v]);
        if (rhythm === RHYTHM.SYNCOPATED) {
          assert.equal(k % 2, 0, 'a suspension falls on a downbeat');
          assert.equal(line[k], line[k - 1], 'tied from the upbeat before');
          assert.equal(line[k + 1], line[k] - 1, 'resolves down by step');
          assert.ok(maySuspend(line[k] - chord.lower, jv[v], 'above'), 'its mark against the cantus is not (—)');
        } else {
          assert.equal(rhythm, RHYTHM.HALVES);
          assert.equal(k % 2, 1, 'a passing tone falls on an upbeat');
          assert.ok(isPassingTone(line[k - 1], line[k], line[k + 1]));
        }
      }));
    }
  }
});

test('the closing chord is consonant in both versions', () => {
  for (const { example } of examples) {
    for (const close of [example.original.at(-1), example.shifted.at(-1)]) {
      assert.ok(consonant(close, close.upper, close.lower));
      assert.ok(consonant(close, close.middle, close.lower));
      assert.ok(consonant(close, close.upper, close.middle));
    }
  }
});

test('−1 + −2 from C4: a syncopated voice with a suspension that is a 6th in the original and a 4th shifted', () => {
  const { example } = examples[0];
  assert.equal(example.texture.middle, RHYTHM.SYNCOPATED);
  assert.deepEqual(example.suspensions, [2]);
  const [tied] = example.original[1].middle;
  assert.equal(tied - example.original[1].lower, 5); // a 6th (zero-indexed 5)
  const [tiedShifted] = example.shifted[1].middle;
  assert.equal(tiedShifted - example.shifted[1].lower, 3); // a 4th (3)
});
