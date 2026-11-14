import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonInterval, canonMarks, spanVerdict, consonantSpans, consecutivePerfects, checkProposta, moveChord,
  keepsSide, crossesVoices,
  sharedMoves,
} from '../src/taneyev/canon.js';
import { parsePitch, pitchName } from '../src/common/diatonic.js';

// Intervals and spans are zero-indexed: a step is 1, a 3rd 2, an octave 7.

test('n = entry − span, Taneyev’s n = m + Jv with m = −span (video 4, 09:06)', () => {
  assert.equal(canonInterval(0, 7), 7); // repeated note at the octave above: octave
  assert.equal(canonInterval(2, 7), 5); // rising 3rd: 6th
  assert.equal(canonInterval(2, -7), -9); // rising 3rd, risposta an octave below: 10th
});

test('canon at the octave after one measure: a step makes a 7th or a 9th (Cho’s example)', () => {
  assert.equal(canonInterval(1, 7), 6);
  assert.equal(canonInterval(-1, 7), 8);
  assert.equal(spanVerdict(1, 7), 'suspension');
  assert.equal(spanVerdict(-1, 7), 'suspension');
});

test('canon at the octave above: the consonant spans', () => {
  // Down an octave, 6th, 5th, 3rd; repeat; up a 3rd, 4th, 6th, octave.
  assert.deepEqual(consonantSpans(7), [-7, -5, -4, -2, 0, 2, 3, 5, 7]);
});

test('canon at the octave below mirrors the octave above', () => {
  assert.deepEqual(consonantSpans(-7), [-7, -5, -3, -2, 0, 2, 4, 5, 7]);
});

test('canon at the unison: no steps and no 4ths', () => {
  assert.deepEqual(consonantSpans(0), [-7, -5, -4, -2, 0, 2, 4, 5, 7]);
});

test('canon at the 5th above: down a step, up a 3rd, down a 4th, up a 5th (stretto fuga, to check against Schubert)', () => {
  assert.deepEqual(consonantSpans(4, { range: 4 }), [-3, -1, 0, 2, 4]);
});

test('perfect and imperfect verdicts', () => {
  assert.equal(spanVerdict(0, 7), 'perfect'); // octave
  assert.equal(spanVerdict(3, 7), 'perfect'); // rising 4th gives a 5th
  assert.equal(spanVerdict(2, 7), 'free'); // rising 3rd gives a 6th
});

test('suspension marks come from the Jv = 0 chart, risposta as voice I (§§81–82, 90)', () => {
  // Rising step at the octave above: a 7th, suspended only in the upper voice (§82).
  assert.deepEqual(canonMarks(1, 7), { risposta: '—', proposta: '(—)' });
  // Falling step: a 9th, which may resolve to an octave in either voice (§81).
  assert.deepEqual(canonMarks(-1, 7), { risposta: '—', proposta: '—' });
  // Rising step at the octave below: the risposta is the lower voice of the 9th.
  assert.deepEqual(canonMarks(1, -7), { risposta: '—', proposta: '—' });
});

test('consecutive perfects need both voices to move', () => {
  assert.equal(consecutivePerfects(4, 4, true), true);
  assert.equal(consecutivePerfects(4, 11, true), true); // 5th to 12th (video 4, 20:08)
  assert.equal(consecutivePerfects(7, 7, false), false);
  assert.equal(consecutivePerfects(4, 7, true), false);
});

test('checkProposta flags steps and anti-parallel 5ths', () => {
  const steps = ['C4', 'D4', 'G4', 'C4'].map(parsePitch);
  const [first, second, third] = checkProposta(steps, 7, 1);
  assert.equal(first.verdict, 'suspension'); // C–D is a step: 7th
  assert.equal(second.n, 4); // D–G rises a 4th: 5th
  assert.equal(third.n, 11); // G–C falls a 5th: 12th
  assert.equal(third.consecutive, true);
});

test('checkProposta pairs notes one delay apart', () => {
  const steps = ['D4', 'F4', 'E4', 'D4'].map(parsePitch);
  const results = checkProposta(steps, 7, 2);
  assert.deepEqual(results.map((r) => r.span), [1, -2]); // D–E, F–D
});

test('pitch names parse to diatonic steps', () => {
  assert.equal(parsePitch('E4'), 30);
  assert.equal(pitchName(parsePitch('g3')), 'G3');
  assert.equal(parsePitch('H4'), null);
});

test('move chord at the 5th: bass proposta B C E G, soprano proposta F A C D (Cho’s chart)', () => {
  assert.deepEqual(moveChord(4), [-1, 0, 2, 4]);
  assert.deepEqual(moveChord(-4), [-4, -2, 0, 1]);
  assert.deepEqual(moveChord(11), moveChord(4)); // the 12th folds onto the 5th
});

test('the two move chords mirror each other around the proposta’s note', () => {
  for (const entry of [2, 3, 4, 5, 7, 9, 11, 12, 13, 14]) {
    // 0 - span, not -span, so a unison stays 0 rather than −0.
    const mirrored = moveChord(entry).map((span) => 0 - span).sort((a, b) => a - b);
    assert.deepEqual(moveChord(-entry), mirrored, `entry ${entry}`);
  }
});

test('soprano move chord = consonance chord (0 2 4 5) transposed down by the entry', () => {
  const noteClass = (step) => ((step % 7) + 7) % 7;
  for (const entry of [2, 3, 4, 5, 7, 9, 11]) {
    const expected = [0, 2, 4, 5].map((c) => noteClass(c - entry)).sort();
    assert.deepEqual(moveChord(-entry).map(noteClass).sort(), expected, `entry ${entry}`);
  }
});

test('sides: the risposta a 5th above may not cross below, and only keepsSide rules out meeting on a unison', () => {
  assert.ok(keepsSide(2, 4)); // a 3rd above
  assert.ok(!keepsSide(-2, 4)); // crossed to a 3rd below
  assert.ok(!keepsSide(0, 4)); // met on a unison
  assert.ok(!crossesVoices(0, 4));
  assert.ok(crossesVoices(-2, 4));
  assert.ok(keepsSide(-2, 0)); // at the unison canon either voice may be on top
});

test('IC p. 21 margin, “5 over 8”: answers a 5th above and an octave below leave C → C E G', () => {
  assert.deepEqual(sharedMoves([4, -7]), [0, 2, 4]);
});

test('IC p. 21 margin, “8 over 5”: answers an octave above and a 5th below leave C → C F A (3rd down, 4th up, unison)', () => {
  assert.deepEqual(sharedMoves([7, -4]), [0, 3, 5]);
});

test('IC p. 27 margin lists: the proposta’s moves for a canon at the 5th below and above', () => {
  // “Canon 5th below: +3, +1, 0, −2, −4” and “5th above: +4, +2, 0, −1, −3”, steps from the proposta’s note
  const withinFifth = (entry) => consonantSpans(entry).filter((span) => Math.abs(span) <= 4);
  assert.deepEqual(withinFifth(-4), [-4, -2, 0, 1, 3]);
  assert.deepEqual(withinFifth(4), [-3, -1, 0, 2, 4]);
});

test('IC p. 27 chord stacks: the move chords for the 5th and the octave, on C', () => {
  // treble “5th” F A C D, bass “5th” B C E G, treble “oct.” G A C E, bass “oct.” A C E F
  assert.deepEqual(moveChord(-4), [-4, -2, 0, 1]);
  assert.deepEqual(moveChord(4), [-1, 0, 2, 4]);
  assert.deepEqual(moveChord(-7), [-3, -2, 0, 2]);
  assert.deepEqual(moveChord(7), [-2, 0, 2, 3]);
});
