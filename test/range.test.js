import { test } from 'node:test';
import assert from 'node:assert/strict';
import { intoVocalRange, vocalShift, HIGHEST, LOWEST } from '../src/notation/range.js';
import { intervalStrip } from '../src/taneyev/examples.js';
import { MIDDLE_C } from '../src/common/diatonic.js';

const C4 = MIDDLE_C;
const inRange = (measures) => measures
  .flatMap((m) => [m.voiceI, m.voiceII])
  .every((step) => step === null || (step >= LOWEST && step <= HIGHEST));

test('an example already around middle C stays put', () => {
  assert.equal(vocalShift([{ voiceI: C4 + 7, voiceII: C4 }]), 0);
});

test('an example up near E6 comes down an octave, keeping its intervals', () => {
  const high = [{ voiceI: C4 + 16, voiceII: C4 }, { voiceI: C4 + 14, voiceII: C4 + 2 }];
  const moved = intoVocalRange(high);
  assert.equal(moved[0].voiceI, C4 + 9);
  assert.ok(inRange(moved));
  moved.forEach((m, k) => assert.equal(m.voiceI - m.voiceII, high[k].voiceI - high[k].voiceII));
});

test('the Jv = −14 shifted strip fits between F2 and G5', () => {
  const dyads = intervalStrip(-14).map((d) => d.derivative);
  assert.ok(inRange(intoVocalRange(dyads)));
});

test('rests are kept as rests', () => {
  const moved = intoVocalRange([{ voiceI: null, voiceII: null }, { voiceI: C4 + 16, voiceII: C4 + 9 }]);
  assert.equal(moved[0].voiceI, null);
});
