import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIGNATURES, NO_SIGNATURE, sounding, fromLetter, fromPitch } from '../src/common/signatures.js';
import { parsePitch, semitonesOf, semitonesInKey, spellInKey, spelledName } from '../src/common/diatonic.js';
import { keySignature } from '../src/notation/abc-read.js';
import { keyboard } from '../src/ui/keyboard.js';
import { semitonesOfMidi } from '../src/input/key-map.js';

const p = parsePitch;

test('every signature moves C major onto the notes of its own key (abc key names)', () => {
  for (const signature of SIGNATURES) {
    const key = keySignature(`K:${signature.abc}`);
    for (let step = p('C4'); step < p('C5'); step += 1) {
      const real = sounding(step, signature);
      assert.equal(real.semitones, semitonesInKey(real.step, key), `${signature.name}, step ${step}`);
    }
  }
  assert.equal(SIGNATURES[NO_SIGNATURE].steps, 0);
});

test('a played pitch comes back to its step in C, and a pitch outside the signature to null', () => {
  const oneFlat = SIGNATURES.find((s) => s.abc === 'F');
  assert.equal(fromPitch(semitonesOf(p('B4')) - 1, oneFlat), p('F4')); // B♭ in F major is F in C, the fourth degree
  assert.equal(fromPitch(semitonesOf(p('B4')), oneFlat), null); // B♮ is not in F major
  assert.equal(fromLetter(p('B4'), oneFlat), p('F4')); // the letter key B plays B♭
});

test('spelling a played pitch: the key’s own letter first, then naturals, then the usual ficta (C♯ E♭ F♯ G♯ B♭)', () => {
  const fMajor = keySignature('K:F');
  const name = (semitones, key) => spelledName(spellInKey(semitones, key));
  assert.equal(name(semitonesOf(p('B4')) - 1, fMajor), 'B♭4');
  assert.equal(name(semitonesOf(p('B4')), fMajor), 'B4');
  assert.equal(name(semitonesOf(p('C5')) + 1, fMajor), 'C♯5'); // the leading tone of D minor
  assert.equal(name(semitonesOf(p('F4')) + 1, {}), 'F♯4');
  assert.equal(name(semitonesOf(p('E4')) - 1, {}), 'E♭4');
});

test('the keyboard draws every key with its pitch, black keys too, so they can be played and tagged', () => {
  const svg = keyboard(p('C4'), p('C5'), [{ semitones: 49, text: 'R', kind: 'r' }]);
  assert.match(svg, /class="kb-black" data-semitones="49"/); // C♯4
  assert.match(svg, /class="kb-white" data-step="28" data-semitones="48"/); // C4
  assert.match(svg, />R<\/text>/);
  assert.equal(semitonesOfMidi(61), 49); // MIDI C♯4
});
