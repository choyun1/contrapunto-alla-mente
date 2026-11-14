import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { readBars, readVoices, voiceIds } from '../src/notation/abc-read.js';
import { beamedAbc } from '../src/notation/beams.js';
import { SECTIONS } from '../notebook/examples.js';
import { WIP_SECTIONS } from '../wip/examples.js';
import { ICF, canonMarks, delayAt, drawnAbc, heardAbc, imaginaryBars, withMarks } from '../notebook/score.js';

// the WIP page's examples are checked the same way as the Notebook's
const EXAMPLES = [...SECTIONS, ...WIP_SECTIONS].flatMap((section) => section.examples);

/** The text of a notebook example's abc file. */
const load = (file) => readFileSync(new URL(`../notebook/examples/${file}`, import.meta.url), 'utf8');

/** Every note of a voice with its start time in whole notes: [{ at, step, length }]. */
function timeline(bars) {
  const notes = [];
  let at = 0;
  for (const bar of bars) {
    for (const note of bar) {
      notes.push({ at, step: note.step, length: note.length });
      at += note.length;
    }
  }
  return notes;
}

/** Is bar `bar` (counted from 0) inside one of a canon's spans (counted from 1, first to last)? */
const inSpans = (spans, bar) => spans.some(([first, last]) => bar + 1 >= first && bar + 1 <= last);

/** The first of the leader's notes in the canon's spans that the follower does not copy, or null. */
function firstUncopied(voices, canon) {
  const { lead, follow, entry, spans } = canon;
  const follower = new Map(timeline(voices[follow]).map((note) => [note.at, note]));
  const leader = timeline(voices[lead]).filter((note) => note.step !== null && inSpans(spans, Math.floor(note.at)));
  return leader.find((note) => {
    const copy = follower.get(note.at + delayAt(canon, Math.floor(note.at)));
    return !copy || copy.step !== note.step + entry || copy.length !== note.length;
  }) ?? null;
}

test('the abc reader: pitches as diatonic steps, lengths in whole notes', () => {
  // C4 = 28, so C, = 21, c = 35, c' = 42; with L:1/4, '2' is a half note and '/' an eighth.
  const [first, second] = readBars("C, c c' z | B,2 ^F/ G/ A-|]", 1 / 4);
  assert.deepEqual(first.map((note) => note.step), [21, 35, 42, null]);
  assert.deepEqual(second.map((note) => note.length), [0.5, 0.125, 0.125, 0.25]);
  assert.equal(second[3].tie, true);
});

test('every notebook example has full 4/4 bars, the same number in every voice', () => {
  for (const example of EXAMPLES) {
    const voices = readVoices(load(example.file));
    const counts = Object.values(voices).map((bars) => bars.length);
    assert.equal(new Set(counts).size, 1, `${example.file}: voices differ in length`);
    for (const [id, bars] of Object.entries(voices)) {
      bars.forEach((bar, k) => {
        const length = bar.reduce((sum, note) => sum + note.length, 0);
        assert.equal(length, 1, `${example.file}, ${id}, bar ${k + 1}`);
      });
    }
  }
});

test('each notebook canon copies the leader exactly up to its cadence (IC pp. 5–7, 10–11 and 13–26)', () => {
  for (const example of EXAMPLES.filter((e) => e.canon)) {
    const miss = firstUncopied(readVoices(load(example.file)), example.canon);
    assert.equal(miss, null, `${example.file}: not copied at ${miss?.at} whole notes`);
  }
});

test('P over the imaginary cantus equals R over the cantus, one delay later (IC p. 9)', () => {
  for (const example of EXAMPLES.filter((e) => e.icf)) {
    const voices = readVoices(load(example.file));
    const { lead, follow, spans } = example.canon;
    const imaginary = imaginaryBars(load(example.file), example.canon);
    for (let bar = 0; bar < voices[lead].length; bar++) {
      if (!inSpans(spans, bar)) continue;
      const delay = delayAt(example.canon, bar);
      const p = voices[lead][bar][0].step;
      const r = voices[follow][bar + delay][0].step;
      const cantus = voices.CF[bar + delay][0].step;
      if (p === null || imaginary[bar] === null) continue;
      assert.equal(p - imaginary[bar], r - cantus, `${example.file}, bar ${bar + 1}`);
    }
  }
});

test('the imaginary cantus of IC p. 10 is the cantus a 5th up and two bars earlier, as Cho wrote it', () => {
  const example = EXAMPLES.find((e) => e.file.startsWith('ic10'));
  // D4 C4 E4 G4 F4 D4 E4 E4 (delay of two bars)
  assert.deepEqual(imaginaryBars(load(example.file), example.canon).slice(0, 8), [29, 28, 30, 32, 31, 29, 30, 30]);
});

test('the drawn score adds the imaginary cantus as the bottom staff', () => {
  const example = EXAMPLES.find((e) => e.icf);
  const drawn = drawnAbc(load(example.file), example);
  assert.equal(voiceIds(drawn).at(-1), ICF.id);
  assert.equal(readVoices(drawn)[ICF.id].length, readVoices(load(example.file)).CF.length);
});

test('alternative staves: the lower is the upper moved by its shift, note for note (IC pp. 21, 23, 29)', () => {
  for (const example of EXAMPLES.filter((e) => e.alternatives)) {
    const { upper, lower, shift } = example.alternatives;
    const voices = readVoices(load(example.file));
    const above = timeline(voices[upper]);
    const below = timeline(voices[lower]);
    assert.equal(below.length, above.length, example.file);
    above.forEach((note, i) => {
      const moved = note.step === null ? null : note.step + shift;
      assert.deepEqual([below[i].step, below[i].length], [moved, note.length], `${example.file}, note ${i + 1}`);
    });
  }
});

test('alternative staves are heard one pair after the other, with a bar of rest between', () => {
  const example = EXAMPLES.find((e) => e.file.startsWith('ic23a'));
  const abc = load(example.file);
  const heard = readVoices(heardAbc(abc, example));
  const written = readVoices(abc);
  assert.deepEqual(Object.keys(heard), ['O', 'D']);
  const bars = written.CF.length;
  assert.equal(heard.O.length, 2 * bars + 1);
  assert.deepEqual(heard.O.slice(bars + 1), written.CF);
  assert.deepEqual(heard.D.slice(0, bars), written.CF);
  assert.deepEqual(heard.D.slice(bars + 1), written.D);
  assert.equal(heard.D[bars][0].step, null);
  assert.equal(heardAbc(abc, {}), abc);
});

/** One token of a music line: a bar line, or a note or rest with its length text. */
test('every example beams its eighth notes as engraved: by the beat, four eighths by the half bar', () => {
  for (const file of EXAMPLES.map((e) => e.file)) {
    const abc = load(file);
    assert.equal(abc, beamedAbc(abc), file);
  }
});

test('every abc file in notebook/examples/ is shown on the Notebook or the WIP page', () => {
  const shown = new Set(EXAMPLES.map((e) => e.file));
  const files = readdirSync(new URL('../notebook/examples/', import.meta.url)).filter((f) => f.endsWith('.abc'));
  for (const file of files) assert.ok(shown.has(file), file);
});

test('no example has a T: title line, since the page writes its own titles', () => {
  for (const example of EXAMPLES) assert.doesNotMatch(load(example.file), /^T:/m, example.file);
});

test('IC p. 15: P leaves the canon at bar 15 and both voices cadence from bar 18', () => {
  const example = EXAMPLES.find((e) => e.file.startsWith('ic15'));
  assert.deepEqual(canonMarks(load(example.file), example), { P: { 15: 'free', 18: 'cadence' }, R: { 18: 'cadence' } });
});

test('IC p. 20 and its rework: P leads a canon at the 12th to bar 10, then R leads one at the 12th below from bar 12', () => {
  const first = { lead: 'P', follow: 'R', entry: 11, delay: 1, spans: [[2, 9]] };
  // R's bar 13 has quarters where P answers with a dotted rhythm, so it is left out
  const second = { lead: 'R', follow: 'P', entry: -11, delay: 1, spans: [[12, 12], [14, 20]] };
  for (const file of ['ic20-canon-12th-c-minor.abc', 'ic20r-canon-12th-c-minor-rework.abc']) {
    const voices = readVoices(load(file));
    assert.equal(firstUncopied(voices, first), null, file);
    assert.equal(firstUncopied(voices, second), null, file);
  }
});

test('IC p. 20: the trade of names is marked above both staves at bar 12', () => {
  const example = EXAMPLES.find((e) => e.file.startsWith('ic20'));
  const drawn = drawnAbc(load(example.file), example);
  assert.match(drawn, /\| "\^now P"e c a3\/2 g\/ \|/);
  assert.match(drawn, /\| "\^now R"z4 \|/);
});

test('IC p. 7: the cadence between the two canons is marked, and so is the one at the end', () => {
  const example = EXAMPLES.find((e) => e.file.startsWith('ic07'));
  const marks = canonMarks(load(example.file), example);
  assert.equal(marks.R[7], 'cadence');
  assert.equal(marks.R[16], 'cadence');
});

test('a mark is written above the first note of its bar, even across lines and repeats', () => {
  const abc = '[V:P] C4 | D4 |\n[V:P] |: E2 F2 :| G4 |]\n';
  assert.equal(withMarks(abc, { P: { 2: 'free', 4: 'cadence' } }),
    '[V:P] C4 | "^free"D4 |\n[V:P] |: "^cadence"E2 F2 :| G4 |]\n');
});

test('marks change only what is drawn: the notes read the same', () => {
  for (const example of EXAMPLES.filter((e) => e.canon)) {
    const abc = load(example.file);
    const drawn = readVoices(drawnAbc(abc, example));
    for (const [id, bars] of Object.entries(readVoices(abc))) assert.deepEqual(drawn[id], bars, example.file);
  }
});

test('an infinite canon is heard three times round its repeat, and stays a canon all the way (IC pp. 25, 26)', () => {
  for (const example of EXAMPLES.filter((e) => e.rounds)) {
    const written = readVoices(load(example.file));
    const heard = readVoices(heardAbc(load(example.file), example));
    const loop = written.P.length - 2; // the bars inside the repeat
    assert.equal(heard.P.length, 2 + 3 * loop, example.file);
    const { entry } = example.canon;
    for (let bar = 0; bar < heard.P.length - 2; bar++) {
      const copy = heard.R[bar + 1].map((note) => note.step);
      assert.deepEqual(copy, heard.P[bar].map((note) => (note.step === null ? null : note.step + entry)), `${example.file}, bar ${bar + 1}`);
    }
  }
});
