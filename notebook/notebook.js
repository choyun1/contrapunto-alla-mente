// The notebook page: draws and plays every example in examples.js, section by
// section. Display only: the notes are in examples/*.abc, and the imaginary
// cantus comes from score.js (and from there the rules core).

import { SECTIONS } from './examples.js';
import { drawnAbc, dissonancesOf, heardAbc } from './score.js';
import { KIND } from '../src/taneyev/florid.js';
import { intervalName } from '../src/taneyev/rules.js';
import { voiceIds } from '../src/notation/abc-read.js';
import { block, show, showWithAudio, SOUND, TEMPO } from '../src/notation/playback.js';

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

/** What a dissonance is, in words: '9–8 suspension', 'passing tone', 'check: tritone'. */
function kindText(d) {
  if (d.kind === KIND.SUSPENSION) return `${d.label} suspension`;
  if (d.kind === KIND.PASSING) return 'passing tone';
  if (d.kind === KIND.NEIGHBOR) return 'neighbor tone';
  return d.tritone ? '<b>check:</b> tritone' : '<b>check:</b> approached or left by leap';
}

/** Where a dissonance falls: 'Bar 3, beat 1', or 'beat 2½' for an eighth between beats. */
function whereText(start) {
  const bar = Math.floor(start) + 1;
  const beat = (start - Math.floor(start)) * 4 + 1;
  const whole = Math.floor(beat);
  return `Bar ${bar}, beat ${whole}${beat - whole >= 0.5 ? '½' : ''}`;
}

/**
 * A closed list of the example's dissonances, each with its kind
 * (src/taneyev/florid.js). `ids` and `label` limit it to some voices and
 * say which, e.g. 'R over P'.
 */
function dissonanceList(abc, ids, label) {
  const list = dissonancesOf(abc, ids);
  const checks = list.filter((d) => d.kind === KIND.CHECK).length;
  const items = list.map((d) => `<li>${whereText(d.start)}: ${d.voices.join(' over ')}, `
    + `${intervalName(d.steps)}, ${kindText(d)}</li>`).join('');
  const which = label ? ` (${label})` : '';
  return `<details class="notation"><summary>Dissonances${which}: ${list.length}, ${checks} to check</summary>`
    + `<ul class="dissonances">${items}</ul></details>`;
}

/** Draws one example into `parent`, gray imaginary cantus and all. */
async function drawExample(parent, example) {
  const wrap = block(parent, example.title, captionOf(example));
  const abc = await load(example.file);
  if (example.alternatives) {
    // two settings of the middle voice: each pair is checked, and heard, on its own
    const { upper, shared, lower } = example.alternatives;
    wrap.insertAdjacentHTML('beforeend', dissonanceList(abc, [upper, shared], `${upper} over ${shared}`)
      + dissonanceList(abc, [shared, lower], `${shared} over ${lower}`));
    showWithAudio(wrap, abc, heardAbc(abc, example));
    return;
  }
  wrap.insertAdjacentHTML('beforeend', dissonanceList(abc));
  if (!example.icf) {
    show(wrap, abc, null, SOUND.FLUTE, TEMPO.NOTEBOOK);
    return;
  }
  const drawn = drawnAbc(abc, example);
  showWithAudio(wrap, drawn, abc, voiceIds(drawn).length - 1);
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
