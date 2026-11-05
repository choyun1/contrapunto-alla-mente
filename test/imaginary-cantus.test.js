import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  imaginaryCantus, guideTable, guideKind, shiftFor, parallelDissonantGuides, propostaChoices, GUIDE, SIDE,
} from '../src/taneyev/imaginary-cantus.js';
import { parsePitch } from '../src/common/diatonic.js';

// Intervals are zero-indexed: octave 7, 10th 9, 12th 11.

/** Fux's Dorian cantus firmus at a given octave, as steps. */
const fux = (octave) => 'D F E D G F A G F E D'.split(' ').map((letter) => parsePitch(`${letter}${octave}`));

/** Video 4's first setup: cantus in the alto, proposta in the bass, risposta a 12th above, one bar later. */
const VIDEO_4_FIRST = { cantus: fux(4), entry: 11, delay: 1, side: SIDE.BELOW };

test('imaginary cantus is the cantus a 12th lower and a bar earlier (video 4, 04:23)', () => {
  const imaginary = imaginaryCantus(VIDEO_4_FIRST.cantus, 11, 1);
  assert.equal(imaginary[0], parsePitch('B2')); // the cantus's second note, F4, down a 12th
  assert.equal(imaginary.at(-1), null, 'the last bar has no imaginary note');
});

test('guide shifts match video 4, 06:25: bars 1 and 6 at the 10th, bar 4 at the 9th, the rest at the 13th', () => {
  const shifts = guideTable(VIDEO_4_FIRST).map((row) => row.jv);
  assert.deepEqual(shifts, [-9, -12, -12, -8, -12, -9, -12, -12, -12, -12, null]);
});

test('an octave in bar 1 becomes a 3rd against the imaginary cantus: 7 + −9 = −2 (video 4, 09:06)', () => {
  const [first] = guideTable(VIDEO_4_FIRST);
  const proposta = parsePitch('D3'); // an octave below the cantus's D4
  assert.equal(first.cantus - proposta, 7);
  assert.equal(first.imaginary - proposta, 7 + first.jv);
  assert.equal(7 + first.jv, -2);
});

test('with the cantus in the bass and the risposta a 5th up, Jv is positive: 2 in bar 1 (video 4, 17:27)', () => {
  const rows = guideTable({ cantus: fux(3), entry: 4, delay: 1, side: SIDE.ABOVE });
  assert.equal(rows[0].jv, 2);
  assert.ok(rows.slice(0, -1).every((row) => row.jv > 0), 'direct shifting throughout');
});

test('shiftFor flips the guide when the proposta is below, with no −0', () => {
  assert.equal(shiftFor(9, SIDE.ABOVE), 9);
  assert.equal(shiftFor(9, SIDE.BELOW), -9);
  assert.ok(Object.is(shiftFor(0, SIDE.BELOW), 0));
  assert.equal(shiftFor(null, SIDE.BELOW), null);
});

test('guide kinds: unison simple, octave and 10th consonant, 2nd and 9th hard (video 4, 06:25)', () => {
  assert.equal(guideKind(0), GUIDE.SIMPLE);
  assert.equal(guideKind(7), GUIDE.CONSONANT);
  assert.equal(guideKind(-9), GUIDE.CONSONANT);
  assert.equal(guideKind(1), GUIDE.DISSONANT);
  assert.equal(guideKind(8), GUIDE.DISSONANT);
});

test('parallel 7ths in the guide intervals are flagged (Taneyev’s diagram, video 4, 07:45)', () => {
  // A canon at the octave above over Fux's cantus in the bass: the cantus falls by
  // step in bars 2–3 and 7–10, so the guides run in parallel 9ths (8).
  const rows = guideTable({ cantus: fux(3), entry: 7, delay: 1, side: SIDE.ABOVE });
  assert.deepEqual(parallelDissonantGuides(rows), [2, 7, 8, 9]);
  assert.deepEqual(parallelDissonantGuides(guideTable(VIDEO_4_FIRST)), []);
});

test('proposta choices are consonant with both copies of the cantus', () => {
  const imaginary = imaginaryCantus(VIDEO_4_FIRST.cantus, 11, 1);
  for (let bar = 0; bar < 10; bar += 1) {
    for (const note of propostaChoices(VIDEO_4_FIRST, bar)) {
      assert.ok(note < VIDEO_4_FIRST.cantus[bar], 'proposta stays below');
      assert.ok([0, 2, 4, 5].includes((VIDEO_4_FIRST.cantus[bar] - note) % 7));
      assert.ok([0, 2, 4, 5].includes(Math.abs(note - imaginary[bar]) % 7));
    }
  }
});

test('bar 4 of video 4’s setup (Jv −8) leaves only G3 in whole notes within a 10th', () => {
  assert.deepEqual(propostaChoices(VIDEO_4_FIRST, 3), [parsePitch('G3')]);
});

test('allowFourth adds the 4th against the imaginary cantus (video 4, 10:23: D over A in bar 2)', () => {
  const strict = propostaChoices(VIDEO_4_FIRST, 1);
  const loose = propostaChoices(VIDEO_4_FIRST, 1, { allowFourth: true });
  assert.ok(!strict.includes(parsePitch('D3')));
  assert.ok(loose.includes(parsePitch('D3')));
});
