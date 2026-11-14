import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ritardandoInBar, stretchNotes, SLOWEST } from '../src/notation/ritardando.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test('time before the ritardando bar is unchanged; the bar itself is played longer (IC p. 19, bar 8, Cho 2026-11-14)', () => {
  const played = ritardandoInBar(8);
  close(played(3.25), 3.25);
  close(played(7), 7);
  // tempo falls in a line from 1 to 0.8, so the bar lasts −ln(0.8)/0.2 ≈ 1.12 bars
  close(played(8), 7 - Math.log(SLOWEST) / (1 - SLOWEST));
});

test('after the ritardando the tempo stays at the slowest', () => {
  const played = ritardandoInBar(8);
  close(played(9) - played(8), 1 / SLOWEST);
});

test('every voice is stretched alike, so a long note in one voice still ends with the bar in the other', () => {
  const played = ritardandoInBar(2);
  const whole = [{ start: 1, end: 2 }];
  const quarters = [0, 1, 2, 3].map((beat) => ({ start: 1 + beat / 4, end: 1.25 + beat / 4 }));
  stretchNotes([whole, quarters], played);
  close(whole[0].end, quarters[3].end);
  assert.ok(quarters[3].end - quarters[3].start > quarters[0].end - quarters[0].start); // later beats are longer
});
