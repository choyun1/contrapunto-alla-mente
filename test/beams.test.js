import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beamed, beamedAbc } from '../src/notation/beams.js';

const Q = 1 / 4; // unit note L:1/4

test('eighths share a beam within each quarter beat', () => {
  assert.equal(beamed('C/ D/ E F/ G/ A |', Q), 'C/D/ E F/G/ A |');
});

test('four eighths filling beats 1–2 or 3–4 share one beam (common engraving practice, as in Gould, Behind Bars)', () => {
  assert.equal(beamed('C/ D/ E/ F/ G/ A/ B/ c/ |', Q), 'C/D/E/F/ G/A/B/c/ |');
  assert.equal(beamed('C2 G/ A/ B/ c/ |', Q), 'C2 G/A/B/c/ |');
});

test('four eighths across the middle of the bar stay beamed by the beat', () => {
  assert.equal(beamed('C D/ E/ F/ G/ A |', Q), 'C D/E/ F/G/ A |');
});

test('the eighth after a dotted quarter joins the next beat', () => {
  assert.equal(beamed('C3/2 D/ E/ F/ G2 |', Q), 'C3/2 D/E/F/ G2 |');
});

test('rests and quarters break the beam, and barlines reset the count', () => {
  assert.equal(beamed('z/ D/ E/ F/ G2 | A/ B/ c/ d/ e2 |]', Q), 'z/ D/ E/F/ G2 | A/B/c/d/ e2 |]');
});

test('beamedAbc re-beams only the [V:] lines', () => {
  assert.equal(beamedAbc('L:1/4\nT:C/ D/\n[V:P] C/ D/ E/ F/ G2 |'), 'L:1/4\nT:C/ D/\n[V:P] C/D/E/F/ G2 |');
});
