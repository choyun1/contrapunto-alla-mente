import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonOverCantus, fittingSetups, goodChord, badMotion, chordAt } from '../src/taneyev/canon-over-cantus.js';
import { propostaChoices, SIDE } from '../src/taneyev/imaginary-cantus.js';
import { isConsonant } from '../src/taneyev/rules.js';
import { parsePitch } from '../src/common/diatonic.js';
import { voicesTune } from '../src/notation/abc.js';

// Intervals are zero-indexed: 5th 4, octave 7, 12th 11.

const steps = (text) => text.split(' ').map(parsePitch);
const FUX = steps('D4 F4 E4 D4 G4 F4 A4 G4 F4 E4 D4');

/** The page's default: risposta a 12th above, three bars later, proposta in the bass. */
const DEFAULT = { cantus: FUX, entry: 11, delay: 3, side: SIDE.BELOW };

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

test('every chord is consonant and every move is allowed in three voices (step 5)', () => {
  const { chords } = canonOverCantus(DEFAULT);
  chords.forEach((chord, bar) => {
    assert.ok(goodChord(chord), `bar ${bar + 1}`);
    if (bar > 0) assert.ok(!badMotion(chords[bar - 1], chord), `bars ${bar}–${bar + 1}`);
  });
});

test('the risposta forms against the cantus what the proposta formed against the imaginary cantus', () => {
  const { proposta, chords } = canonOverCantus(DEFAULT);
  for (let bar = 3; bar < FUX.length; bar += 1) {
    const imaginary = FUX[bar] - 11; // cantus[k + delay] − entry, read at bar k = bar − 3
    assert.equal(chords[bar].risposta - chords[bar].cantus, proposta[bar - 3] - imaginary);
  }
});

test('it ends on the final: the proposta an octave or unison from the cantus’s last note', () => {
  const { proposta } = canonOverCantus(DEFAULT);
  assert.equal((FUX.at(-1) - proposta.at(-1)) % 7, 0);
});

test('video 4’s own setup (12th, one bar) has no whole-note framework: bar 4 needs a suspension (12:22)', () => {
  assert.equal(canonOverCantus({ ...DEFAULT, delay: 1 }), null);
});

test('goodChord takes a 4th between upper voices over a consonant bass, not over nothing (video 4, 10:23)', () => {
  // D5 over A4 over F4: the 4th A–D is above the bass F.
  assert.ok(goodChord({ risposta: parsePitch('D5'), cantus: parsePitch('A4'), proposta: parsePitch('F4') }));
  // A 4th with the bass is out.
  assert.ok(!goodChord({ risposta: parsePitch('C5'), cantus: parsePitch('G4'), proposta: parsePitch('D4') }));
  assert.ok(!isConsonant(3));
});

test('badMotion catches parallel 5ths in any pair and hidden 5ths in the outer pair only', () => {
  const at = (r, c, p) => ({ risposta: r === null ? null : parsePitch(r), cantus: parsePitch(c), proposta: parsePitch(p) });
  assert.ok(badMotion(at(null, 'A4', 'D4'), at(null, 'B4', 'E4')), 'parallel 5ths');
  assert.ok(badMotion(at('A4', 'E4', 'C4'), at('D5', 'F4', 'D4')), 'hidden octave in the outer voices');
  assert.ok(!badMotion(at('C5', 'E4', 'C4'), at('B4', 'F4', 'D4')), 'contrary motion and parallel 3rds are fine');
  assert.ok(!badMotion(at('C5', 'E4', 'C4'), at('D5', 'G4', 'B3')), 'a hidden 5th between upper voices is fine');
});

test('chordAt leaves the risposta silent until it enters', () => {
  assert.equal(chordAt([parsePitch('G3')], DEFAULT, 0).risposta, null);
});

test('fittingSetups lists the default and not video 4’s one-bar setup', () => {
  const setups = fittingSetups(FUX);
  assert.ok(setups.some((s) => s.entry === 11 && s.delay === 3 && s.side === SIDE.BELOW));
  assert.ok(!setups.some((s) => s.entry === 11 && s.delay === 1 && s.side === SIDE.BELOW));
});

test('the finished canon draws in three staves', () => {
  const abc = voicesTune(canonOverCantus(DEFAULT).chords, [
    { id: 'R', key: 'risposta', name: 'R' },
    { id: 'CF', key: 'cantus', name: 'CF' },
    { id: 'P', key: 'proposta', name: 'P' },
  ]);
  assert.match(abc, /%%score \(R\) \(CF\) \(P\)/);
});
