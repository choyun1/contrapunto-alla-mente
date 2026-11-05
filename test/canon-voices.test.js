import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ORDERS, orderName, entryFor, setupFor } from '../src/taneyev/canon-voices.js';
import { SIDE } from '../src/taneyev/imaginary-cantus.js';

// Intervals are zero-indexed: 5th 4, 12th 11.

test('there are six orders, all different', () => {
  assert.equal(new Set(ORDERS.map(orderName)).size, 6);
});

test('video 4’s first setup, R / CF / P at the 12th: risposta above, proposta below the cantus (02:40)', () => {
  const setup = setupFor({ cantus: [], order: ORDERS[0], size: 11, delay: 1 });
  assert.equal(setup.entry, 11);
  assert.equal(setup.side, SIDE.BELOW);
  assert.equal(setup.rispostaSide, SIDE.ABOVE);
});

test('video 4’s second setup, R / P / CF at the 5th: both canon voices above the cantus (16:29)', () => {
  const order = ['risposta', 'proposta', 'cantus'];
  const setup = setupFor({ cantus: [], order, size: 4, delay: 1 });
  assert.equal(orderName(order), 'R / P / CF');
  assert.equal(setup.entry, 4);
  assert.equal(setup.side, SIDE.ABOVE);
  assert.equal(setup.rispostaSide, SIDE.ABOVE);
});

test('the entry is negative when the risposta is below, and the unison stays 0', () => {
  assert.equal(entryFor(['proposta', 'cantus', 'risposta'], 7), -7);
  assert.ok(Object.is(entryFor(['proposta', 'cantus', 'risposta'], 0), 0));
});
