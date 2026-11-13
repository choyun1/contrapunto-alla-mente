import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readVoices } from '../src/notation/abc-read.js';
import { SECTIONS } from '../notebook/examples.js';
import { drawnAbc } from '../notebook/score.js';
import { barTexts, snippetAbc } from '../notebook/snippets.js';

/** The text of a notebook example's abc file. */
const load = (file) => readFileSync(new URL(`../notebook/examples/${file}`, import.meta.url), 'utf8');

/** Every procedure step that has an excerpt, with its section. */
const STEPS = SECTIONS.flatMap((section) => section.procedure.filter((s) => s.snippet).map((s) => ({ section, ...s })));

test('a voice splits into bars at every kind of bar line', () => {
  assert.deepEqual(barTexts('F2 c |: A B :| d4 |]'), ['F2 c', 'A B', 'd4']);
});

test('each excerpt holds exactly the bars it names, note for note', () => {
  for (const { section, snippet } of STEPS) {
    const example = section.examples.find((e) => e.file === snippet.file);
    assert.ok(example, `${snippet.file} is one of its section's examples`);
    const drawn = drawnAbc(load(snippet.file), example);
    const whole = readVoices(drawn);
    const part = readVoices(snippetAbc(drawn, snippet).abc);
    const [first, last] = snippet.bars;
    for (const [id, bars] of Object.entries(part)) {
      assert.deepEqual(bars.map((bar) => bar.map((n) => n.step)), whole[id].slice(first - 1, last).map((bar) => bar.map((n) => n.step)), `${snippet.file} ${id}`);
    }
  }
});

test('IC p. 29, bar 2: the interval numbers are 6 4 5 6 over the cantus and −1 −3 −2 −1 under it, as Cho wrote them', () => {
  const snippet = { bars: [2, 2], voices: ['O', 'D'], numbers: { against: 'CF', above: ['O'], below: ['D'] } };
  const { abc } = snippetAbc(load('ic29a-invertible-octave-c.abc'), snippet);
  assert.match(abc, /\[V:O\] "\^6"c "\^4"A "\^5"B "\^6"c/);
  assert.match(abc, /\[V:D\] "_−1"C "_−3"A, "_−2"B, "_−1"C/);
});
