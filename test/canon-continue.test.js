import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { canonVoices, checkAll, isComplete, checkNote, continuationSlots, leapProblem, SLOT, worstOf } from '../src/taneyev/canon-continue.js';
import { drillFrom, givenChoices, inOwnRhythm, roomLeft, timeline } from '../src/drills/continue-drill.js';
import { drillExamples } from '../drills/continue-examples.js';
import { readBars, readVoices, keySignature, unitLength } from '../src/notation/abc-read.js';
import { timelineAbc, lengthText } from '../src/notation/abc-timeline.js';
import { nameInKey, parsePitch, semitonesInKey } from '../src/common/diatonic.js';

// Intervals are zero-indexed (2nd 1, 5th 4, octave 7). Times are in whole notes, a bar of 4/4 each.

const DIR = new URL('../notebook/examples/', import.meta.url);
const load = (file) => readFileSync(new URL(file, DIR), 'utf8');
const example = (prefix) => drillExamples().find((e) => e.file.startsWith(prefix));
const p = parsePitch;

/** A drill of a notebook example with the notebook's own notes written, and every note checked. */
function notebookRun(prefix, given) {
  const { file, canon } = example(prefix);
  const drill = drillFrom(load(file), canon, given ?? givenChoices(canon)[0]);
  return { drill, results: checkAll(drill, drill.original) };
}

// A small canon at the octave above, delay one bar: P holds C4, R answers C5;
// bar 2 of P is four quarters (yours to write), bar 3 a whole note.
const OCTAVE_CANON = `X:1
M:C
L:1/4
K:C
V:R clef=treble
V:P clef=treble
[V:R] z4 | c4 | e d c B | c4 |]
[V:P] C4 | E D C B, | C4 | z4 |]
`;
const octaveDrill = () => drillFrom(OCTAVE_CANON, { lead: 'P', follow: 'R', entry: 7, delay: 1, spans: [[1, 3]] }, 1);

test('the continuation: a tied note keeps its pitch, a rest stays a rest, the rest are yours', () => {
  const [bar] = readBars('C2- C z |', 1 / 4);
  const notes = timeline([bar]);
  assert.deepEqual(continuationSlots(notes).map((note) => note.slot), [SLOT.WRITE, SLOT.HELD, SLOT.REST]);
});

test('given bars: from the delay up to two bars before the strict canon ends (IC p. 15, delay of three bars)', () => {
  assert.deepEqual(givenChoices(example('ic15').canon), [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const drill = octaveDrill();
  assert.equal(drill.start, 1);
  assert.deepEqual(drill.original, [p('E4'), p('D4'), p('C4'), p('B3'), p('C4')]);
});

test('IC p. 27, canon at the octave in F: the notebook’s own continuation passes clean', () => {
  const { results } = notebookRun('ic27a');
  assert.ok(results.every((result) => worstOf(result) === null));
});

test('IC p. 19, third and fourth systems: the octaves going into bar 6 are caught (WIP page, waiting to be reworked)', () => {
  const { drill, results } = notebookRun('ic19c');
  const intoBar6 = drill.slots.filter((note) => note.slot === SLOT.WRITE).findIndex((note) => note.start === 5);
  assert.ok(results[intoBar6].misses.includes('consecutive octaves between P and R'));
});

test('IC p. 10: a note is also checked where R copies it, two bars later, against the CF', () => {
  const { drill, results } = notebookRun('ic10', 2);
  const bar5 = drill.slots.filter((note) => note.slot === SLOT.WRITE).findIndex((note) => note.start === 4);
  assert.ok(results[bar5].misses.includes('consecutive 5ths between R and CF'));
});

test('IC p. 19, second system: the notebook’s ficta are kept, so its copies make no tritone', () => {
  const { results } = notebookRun('ic19b');
  assert.ok(results.every((result) => result.misses.length === 0));
});

test('a dissonance on a weak beat waits for the next note: a passing tone resolves it (Fux, second species)', () => {
  const drill = octaveDrill();
  // E4 then D4 against R's C5: D4 makes a 7th on beat 2
  assert.deepEqual(checkNote(drill, [p('E4'), p('D4')], 1).pending, ['7th between R and P, not passing or resolving']);
  const passing = checkNote(drill, [p('E4'), p('D4'), p('C4')], 1);
  assert.equal(worstOf(passing), null);
  const leapt = checkNote(drill, [p('E4'), p('D4'), p('G4')], 1);
  assert.equal(worstOf(leapt), 'check');
});

test('a dissonance on beat 1 that does not pass on by step is a miss', () => {
  const drill = octaveDrill();
  // G4 against R's C5 is a 4th, leapt into from C4 and left by a step up
  assert.equal(worstOf(checkNote(drill, [p('G4')], 0)), 'pending');
  assert.equal(worstOf(checkNote(drill, [p('G4'), p('A4')], 0)), 'miss');
});

test('crossing above R, when R enters above, is marked to check', () => {
  const drill = octaveDrill();
  assert.ok(checkNote(drill, [p('E5')], 0).checks.includes('P crosses R'));
});

test('melodic leaps: a 7th, a 9th and a tritone are not allowed; a 6th and an octave are (Fux)', () => {
  const at = (name) => ({ step: p(name), semitones: semitonesInKey(p(name)) });
  assert.equal(leapProblem(at('C4'), at('B4')), 'P leaps a 7th');
  assert.equal(leapProblem(at('C4'), at('D5')), 'P leaps a 9th');
  assert.equal(leapProblem(at('F4'), at('B4')), 'P leaps a tritone');
  assert.equal(leapProblem(at('C4'), at('A4')), null);
  assert.equal(leapProblem(at('C4'), at('C5')), null);
});

test('notes in a key: F major spells and sounds B as B♭', () => {
  const key = keySignature('K:F');
  assert.equal(nameInKey(p('B4'), key), 'B♭4');
  assert.equal(semitonesInKey(p('B4'), key), semitonesInKey(p('B4')) - 1);
});

test('abc lengths are written back as abc-read.js reads them', () => {
  assert.deepEqual([1, 2, 0.5, 1.5, 0.25, 3].map((units) => lengthText(units / 4, 1 / 4)), ['', '2', '/', '3/2', '/4', '3']);
});

test('every notebook voice is written back to abc note for note, accidentals included', () => {
  for (const file of readdirSync(DIR).filter((f) => f.endsWith('.abc'))) {
    const abc = load(file);
    const [unit, key] = [unitLength(abc), keySignature(abc)];
    for (const [id, bars] of Object.entries(readVoices(abc))) {
      const notes = timeline(bars);
      const back = timeline(readBars(timelineAbc(notes, { unit, key, bars: bars.length }), unit, key));
      const shape = (list) => list.map((n) => [n.start, n.length, n.step, n.semitones]);
      assert.deepEqual(shape(back), shape(notes), `${file}, ${id}`);
    }
  }
});

test('every drilled example has room to write: at least one choice of given bars', () => {
  for (const { file, canon } of drillExamples()) assert.ok(givenChoices(canon).length > 0, file);
});

test('a pitch played on a black key is written as played, and R answers it raised too (ficta)', () => {
  const drill = octaveDrill();
  const fSharp = { step: p('F4'), semitones: semitonesInKey(p('F4')) + 1 };
  const result = checkNote(drill, [p('E4'), fSharp], 1);
  assert.ok(result.misses.includes('P leaps an altered 2nd') === false);
  const voices = canonVoices(drill, [p('E4'), fSharp]);
  assert.equal(voices.P.at(-1).semitones, fSharp.semitones);
  const copy = voices.R.find((note) => note.start === 2.25);
  assert.equal(copy.semitones, semitonesInKey(p('F5')) + 1);
});

test('your own rhythm: a note over the bar line is tied across it, and the canon is done only when the bars are full', () => {
  const drill = octaveDrill();
  const entries = [{ length: 0.75, played: p('E4') }, { length: 0.5, played: p('D4') }];
  const own = inOwnRhythm(drill, entries);
  assert.deepEqual(own.drill.slots.map((note) => [note.start, note.slot, note.tie]),
    [[1, SLOT.WRITE, false], [1.75, SLOT.WRITE, true], [2, SLOT.HELD, false]]);
  assert.equal(isComplete(own.drill, own.steps), false);
  const voices = canonVoices(own.drill, own.steps);
  assert.equal(voices.R.find((note) => note.start === 2.75).step, p('D5')); // R copies the tied D a bar later
  const full = [...entries, { length: roomLeft(drill, entries), played: p('C4') }];
  const done = inOwnRhythm(drill, full);
  assert.equal(isComplete(done.drill, done.steps), true);
  assert.equal(checkAll(done.drill, done.steps).length, 3);
});

test('your own rhythm: a rest takes time but is not a note to check', () => {
  const drill = octaveDrill();
  const own = inOwnRhythm(drill, [{ length: 0.25, played: null }, { length: 0.25, played: p('E4') }]);
  assert.deepEqual(own.drill.slots.map((note) => note.slot), [SLOT.REST, SLOT.WRITE]);
  assert.equal(checkAll(own.drill, own.steps).length, 1);
});
