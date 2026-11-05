import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonOverCantus, fittingSetups } from '../src/taneyev/canon-over-cantus.js';
import { checkCanon } from '../src/taneyev/canon-check.js';
import { propostaChoices, imaginaryCantus } from '../src/taneyev/imaginary-cantus.js';
import { ORDERS, setupFor } from '../src/taneyev/canon-voices.js';
import { parsePitch } from '../src/common/diatonic.js';

// Intervals are zero-indexed: 5th 4, octave 7, 12th 11.

const FUX = 'D4 F4 E4 D4 G4 F4 A4 G4 F4 E4 D4'.split(' ').map(parsePitch);
const R_CF_P = ORDERS[0];

/** The page's default: R / CF / P, risposta a 12th above, three bars later. */
const DEFAULT = setupFor({ cantus: FUX, order: R_CF_P, size: 11, delay: 3 });

test('the default setup has a whole-note canon over Fux’s Dorian cantus', () => {
  const canon = canonOverCantus(DEFAULT);
  assert.ok(canon);
  assert.equal(canon.proposta.length, FUX.length);
});

test('the risposta is the proposta a 12th higher and three bars later', () => {
  const { proposta, risposta } = canonOverCantus(DEFAULT);
  assert.deepEqual(risposta.slice(0, 3), [null, null, null]);
  for (let bar = 3; bar < FUX.length; bar += 1) assert.equal(risposta[bar], proposta[bar - 3] + 11);
});

test('every proposta note is one the imaginary-cantus table allows (step 3)', () => {
  const { proposta } = canonOverCantus(DEFAULT);
  proposta.forEach((note, bar) => {
    assert.ok(propostaChoices(DEFAULT, bar, { allowFourth: true }).includes(note), `bar ${bar + 1}`);
  });
});

test('the framework passes the bar-by-bar check (step 5)', () => {
  const { proposta } = canonOverCantus(DEFAULT);
  assert.deepEqual(checkCanon(proposta, DEFAULT).flat(), []);
});

test('the voices stay in the chosen order, top to bottom', () => {
  const { chords } = canonOverCantus(DEFAULT);
  for (const chord of chords) {
    assert.ok(chord.cantus > chord.proposta);
    if (chord.risposta !== null) assert.ok(chord.risposta > chord.cantus);
  }
});

test('the risposta forms against the cantus what the proposta formed against the imaginary cantus', () => {
  const { proposta, chords } = canonOverCantus(DEFAULT);
  const imaginary = imaginaryCantus(FUX, 11, 3);
  for (let bar = 3; bar < FUX.length; bar += 1) {
    assert.equal(chords[bar].risposta - chords[bar].cantus, proposta[bar - 3] - imaginary[bar - 3]);
  }
});

test('it ends on the final: the proposta an octave or unison from the cantus’s last note', () => {
  const { proposta } = canonOverCantus(DEFAULT);
  assert.equal((FUX.at(-1) - proposta.at(-1)) % 7, 0);
});

test('video 4’s own setup (12th, one bar) has no whole-note framework: bar 4 needs a suspension (12:22)', () => {
  assert.equal(canonOverCantus({ ...DEFAULT, delay: 1 }), null);
});

test('fittingSetups lists the default and not video 4’s one-bar setup', () => {
  const setups = fittingSetups(FUX);
  const same = (s, delay) => s.order === R_CF_P && s.size === 11 && s.delay === delay;
  assert.ok(setups.some((s) => same(s, 3)));
  assert.ok(!setups.some((s) => same(s, 1)));
});
