import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ritardandoTempos, withRitardando } from '../src/notation/ritardando.js';

test('the ritardando slows a little each beat, to 85% by the end of the bar (IC p. 19, Cho 2026-11-14)', () => {
  assert.deepEqual(ritardandoTempos(90), [87, 83, 80, 77]);
});

test('each beat of the bar gets a tempo field before the first note that starts in it, in any voice', () => {
  const abc = 'L:1/4\nK:C\n[V:R] z4 | E C E3/2 F/ | G4 |]\n[V:P] C4 | C2 D2 | C,4 |]';
  const out = withRitardando(abc, 2, 90).split('\n');
  // R has notes on beats 1, 2 and 3; nothing starts on beat 4, so its field goes before R's F on 4½
  assert.equal(out[2], '[V:R] z4 | [Q:1/4=87] E [Q:1/4=83] C [Q:1/4=80] E3/2 [Q:1/4=77] F/ | G4 |]');
  assert.equal(out[3], '[V:P] C4 | C2 D2 | C,4 |]'); // P's notes on beats 1 and 3 are already covered by R
});
