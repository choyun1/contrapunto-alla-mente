// The notebook page: draws and plays every example in examples.js, section by
// section. Display only: the notes are in examples/*.abc, and the imaginary
// cantus comes from score.js (and from there the rules core).

import { SECTIONS } from './examples.js';
import { drawnAbc } from './score.js';
import { voiceIds } from '../src/notation/abc-read.js';
import { block, show, showWithSilentVoice, SOUND, TEMPO } from '../src/notation/playback.js';

/** The text of one example's abc file. */
async function load(file) {
  const response = await fetch(new URL(`examples/${file}`, import.meta.url));
  if (!response.ok) throw new Error(`Could not load ${file}: ${response.status}`);
  return response.text();
}

/** The caption under a score: the source page, Cho's note, then any reading notes. */
function captionOf(example) {
  const parts = [`<b>${example.source}.</b> ${example.note}`];
  if (example.caption) parts.push(`<i>${example.caption}</i>`);
  return parts.join(' ');
}

/** Draws one example into `parent`, gray imaginary cantus and all. */
async function drawExample(parent, example) {
  const wrap = block(parent, example.title, captionOf(example));
  const abc = await load(example.file);
  if (!example.icf) {
    show(wrap, abc, null, SOUND.FLUTE, TEMPO.NOTEBOOK);
    return;
  }
  const drawn = drawnAbc(abc, example);
  showWithSilentVoice(wrap, drawn, abc, voiceIds(drawn).length - 1);
}

/** Draws one section: its heading, its introduction and its examples in order. */
async function drawSection(main, section) {
  const card = document.createElement('section');
  card.className = 'chart';
  card.id = section.id;
  card.innerHTML = `<header><h2>${section.title}</h2><p class="note">${section.intro}</p></header>`;
  const examples = document.createElement('div');
  examples.className = 'examples';
  card.append(examples);
  main.append(card);
  for (const example of section.examples) await drawExample(examples, example);
}

const main = document.getElementById('sections');
for (const section of SECTIONS) await drawSection(main, section);
