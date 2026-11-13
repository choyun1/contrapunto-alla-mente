import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readBars, readVoices, voiceIds } from '../src/notation/abc-read.js';
import { SECTIONS } from '../notebook/examples.js';
import { ICF, delayAt, drawnAbc, imaginaryBars } from '../notebook/score.js';

const EXAMPLES = SECTIONS.flatMap((section) => section.examples);

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

test('each notebook canon copies the leader exactly up to its cadence (IC pp. 5–7 and 10–11, WIP p. 7)', () => {
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
