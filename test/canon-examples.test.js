import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonExample, examplesBothWays, EXAMPLE_ENTRIES, BARS } from '../src/taneyev/canon-examples.js';
import { checkProposta, similarIntoPerfect } from '../src/taneyev/canon.js';
import { isTritone, parsePitch } from '../src/common/diatonic.js';
import { twoVoiceTune } from '../src/notation/abc.js';

// Intervals are zero-indexed: octave 7, 12th 11.

test('entries follow the consonance charts page order', () => {
  assert.deepEqual(EXAMPLE_ENTRIES, [0, -7, -14, -11, -9, -4, -2, 3, 5, -12, -13]);
});

test('every example is a valid first-species canon', () => {
  for (const entry of EXAMPLE_ENTRIES) {
    const example = canonExample(entry);
    assert.ok(example, `no example at ${entry}`);
    assert.equal(example.proposta.length, BARS);
    const results = checkProposta(example.proposta, entry, 1);
    for (const r of results) {
      assert.notEqual(r.verdict, 'suspension', `dissonance at ${entry}`);
      assert.equal(r.consecutive || r.similar, false, `bad motion at ${entry}`);
    }
  }
});

test('the risposta copies the proposta one bar later, moved by the entry', () => {
  const { proposta, risposta } = canonExample(-7);
  assert.equal(risposta[0], null);
  assert.deepEqual(risposta.slice(1), proposta.slice(0, -1).map((step) => step - 7));
});

test('the 3rd below needs a repeated note: every other consonant move rises', () => {
  const { proposta } = canonExample(-2);
  assert.ok(proposta.slice(1).some((step, k) => step === proposta[k]));
});

test('similar motion into a perfect consonance (Fux, first species)', () => {
  assert.equal(similarIntoPerfect(1, 2, 7), true);
  assert.equal(similarIntoPerfect(1, -2, 7), false);
  assert.equal(similarIntoPerfect(1, 1, 2), false);
});

test('tritones in C major are F–B and B–F only', () => {
  assert.equal(isTritone(parsePitch('F4'), parsePitch('B4')), true);
  assert.equal(isTritone(parsePitch('B3'), parsePitch('F4')), true);
  assert.equal(isTritone(parsePitch('F4'), parsePitch('C5')), false);
  assert.equal(isTritone(parsePitch('E4'), parsePitch('B4')), false);
});

test('a null voice prints a whole rest', () => {
  const abc = twoVoiceTune([{ voiceI: 28, voiceII: null }, { voiceI: 30, voiceII: 28 }], { names: ['P', 'R'] });
  assert.match(abc, /z1/);
  assert.match(abc, /name="P"/);
});

test('each interval has a canon both ways round, so each voice leads in turn', () => {
  for (const entry of EXAMPLE_ENTRIES.filter((e) => e !== 0)) {
    const [upper, lower] = examplesBothWays(entry);
    assert.ok(upper.proposta[0] > upper.risposta[1], `proposta on top at ${entry}`);
    assert.ok(lower.proposta[0] < lower.risposta[1], `proposta below at ${entry}`);
  }
  assert.equal(examplesBothWays(0).length, 1);
});

test('examples stay off high ledger lines: nothing above A5', () => {
  const A5 = parsePitch('A5');
  for (const entry of EXAMPLE_ENTRIES) {
    for (const example of examplesBothWays(entry)) {
      const top = Math.max(...example.proposta, ...example.risposta.filter((s) => s !== null));
      assert.ok(top <= A5, `too high at ${example.entry}`);
    }
  }
});
