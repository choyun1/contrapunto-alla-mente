// Renders the Continue the proposta drill: the opening of one of Cho's own
// canons is given, and you write the rest of the proposta note by note in the
// notebook's rhythm, while the risposta copies what you write. Every check
// comes from src/taneyev/canon-continue.js; this file runs the drill and draws it.
// Intervals are zero-indexed (3rd 2, 5th 4, octave 7); pitches are diatonic steps.

import { checkAll, countWrite, canonVoices, writeWindow, worstOf, VOICE } from '../src/taneyev/canon-continue.js';
import { isStrongBeat } from '../src/taneyev/florid.js';
import { handMoves } from '../src/taneyev/canon-hands.js';
import { drillFrom, givenChoices } from '../src/drills/continue-drill.js';
import { nameInKey, semitonesInKey, semitonesOf, parsePitch } from '../src/common/diatonic.js';
import { keyLabels } from '../src/input/key-map.js';
import { listenForNotes, connectMidi } from '../src/input/listen.js';
import { tone, VOICE as SOUND_VOICE } from '../src/audio/tone.js';
import { keyboard } from '../src/ui/keyboard.js';
import { TEMPO, block, showWithAudio } from '../src/notation/playback.js';
import { drillExamples } from './continue-examples.js';
import { drawScore } from './continue-score.js';
import { fillSelect, stripCell } from './common.js';

const EXAMPLES = drillExamples();

/** Seconds a whole note lasts when a note is heard on its own, at the Notebook's tempo. */
const WHOLE_SECONDS = (4 * 60) / TEMPO.NOTEBOOK;

/** The shortest a note sounds when you play it (s), so eighths are still heard. */
const SHORTEST = 0.4;

/** The on-screen keyboard before it is moved to the proposta's octave: the three rows of computer keys. */
const LOW = parsePitch('C3');
const HIGH = parsePitch('C6');

let state = null; // { example, abc, drill, steps, results, octaves }

/** The text of an example's abc file. */
async function load(file) {
  const response = await fetch(new URL(`../notebook/examples/${file}`, import.meta.url));
  if (!response.ok) throw new Error(`Could not load ${file}: ${response.status}`);
  return response.text();
}

/** Octaves to move the keyboard so the notebook's proposta sits in the middle of it. */
function octavesFor(drill) {
  const steps = [...drill.given, ...drill.slots].map((note) => note.step).filter((step) => step !== null);
  const middle = (Math.min(...steps) + Math.max(...steps)) / 2;
  return Math.round((middle - (LOW + HIGH) / 2) / 7);
}

/** A time in a bar in words: "bar 4, beat 2", "bar 4, beat 2½", "bar 4, beat 2 (last 16th)". */
function whereName(t) {
  const bar = Math.floor(t + 1e-9);
  const beats = (t - bar) * 4;
  const beat = Math.floor(beats + 1e-9) + 1;
  const rest = beats - (beat - 1);
  let part = '';
  if (Math.abs(rest - 0.5) < 1e-9) part = '½';
  else if (rest > 1e-9) part = rest < 0.5 ? ' (2nd 16th)' : ' (4th 16th)';
  return `bar ${bar + 1}, beat ${beat}${part}`;
}

/** Note values by length in whole notes. */
const VALUES = new Map([[1, 'whole note'], [0.75, 'dotted half'], [0.5, 'half note'], [0.375, 'dotted quarter'],
  [0.25, 'quarter'], [0.1875, 'dotted eighth'], [0.125, 'eighth'], [0.0625, '16th']]);

/** The note value of a length in words, e.g. "dotted quarter", or the length in whole notes. */
const valueName = (length) => VALUES.get(length) ?? `${length} of a bar`;

/** A voice's note sounding at time t, or null. */
const soundingAt = (voice, t) => voice?.find((note) => note.step !== null && t >= note.start - 1e-9 && t < note.start + note.length - 1e-9) ?? null;

/** The prompt for the next note you write, with what it sounds against. */
function promptFor(k) {
  const { drill, steps } = state;
  const total = countWrite(drill);
  if (k >= total) return 'Done: the canon is complete as far as the notebook keeps it strict.';
  const window = writeWindow(drill, k);
  const note = drill.slots.find((slot) => Math.abs(slot.start - window.start) < 1e-9);
  const voices = canonVoices(drill, steps);
  const against = [VOICE.R, VOICE.CF].map((id) => [id, soundingAt(voices[id], window.start)])
    .filter(([, sounding]) => sounding).map(([id, sounding]) => `${id} ${nameInKey(sounding.step, drill.key)}`);
  const held = window.end - window.start > note.length + 1e-9 ? ', held over' : '';
  const beat = isStrongBeat(window.start) ? 'a strong beat: be consonant' : 'a weak beat: a dissonance must pass or turn by step';
  const value = valueName(note.length);
  const article = /^e/.test(value) ? 'an' : 'a';
  return `Note ${k + 1} of ${total}: ${whereName(window.start)}, ${article} ${value}${held}. `
    + `Against ${against.join(' and ') || 'nothing'}; ${beat}.`;
}

/** Draws the keyboard: R and CF on their notes now, P on your last note, and the hand from R if asked for. */
function drawKeys() {
  const { drill, steps, octaves } = state;
  const voices = canonVoices(drill, steps);
  const k = steps.length;
  const tags = [];
  let marks = [];
  if (k < countWrite(drill)) {
    const t = writeWindow(drill, k).start;
    const risposta = soundingAt(voices.R, t);
    const cantus = soundingAt(voices.CF, t);
    if (risposta) tags.push({ step: risposta.step, text: 'R', kind: 'r' });
    if (cantus) tags.push({ step: cantus.step, text: 'CF', kind: 'p' });
    const showHand = document.getElementById('hints').checked && risposta;
    if (showHand) marks = handMoves(risposta.step - drill.entry, drill.entry);
  }
  const last = voices.P.findLast((note) => note.step !== null);
  if (last && !tags.some((tag) => tag.step === last.step)) tags.push({ step: last.step, text: 'P', kind: 'p' });
  const labels = new Map([...keyLabels()].map(([step, label]) => [step + 7 * octaves, label]));
  const low = LOW + 7 * octaves;
  const high = HIGH + 7 * octaves;
  const box = document.getElementById('keys');
  box.innerHTML = keyboard(low, high, marks.filter((m) => m.step >= low && m.step <= high), tags, { labels });
  // on a narrow screen, scroll the keyboard so the first tag (R, or your last note) is in the middle
  const tag = box.querySelector('.kb-tag');
  if (tag) box.scrollLeft = Number(tag.getAttribute('x')) - box.clientWidth / 2;
}

/** Strip and score color class for a checked note, by its worst problem. */
const KIND_OF = { miss: 'miss', check: 'check', pending: 'pending' };

/** The strip of your notes so far, each with where it falls and its verdict. */
function drawStrip() {
  const { drill, steps, results } = state;
  const cells = steps.map((step, k) => {
    const worst = worstOf(results[k]);
    return stripCell({
      top: nameInKey(step, drill.key),
      middle: whereName(writeWindow(drill, k).start).replace(/bar (\d+), beat /, '$1.'),
      bottom: worst ?? 'ok',
      kind: KIND_OF[worst] ?? 'free',
    });
  });
  document.getElementById('strip').innerHTML = cells.join('');
}

/** The list of every problem so far, newest first, each with where it is. */
function drawProblems() {
  const { drill, steps, results } = state;
  const items = [];
  results.forEach((result, k) => {
    const where = `${whereName(writeWindow(drill, k).start)} (${nameInKey(steps[k], drill.key)})`;
    for (const text of result.misses) items.push(`<li class="miss">${where}: ${text}.</li>`);
    for (const text of result.checks) items.push(`<li class="check">${where}: check ${text}.</li>`);
    for (const text of result.pending) items.push(`<li class="pending">${where}: ${text} yet; it depends on the next note.</li>`);
  });
  document.getElementById('problems').innerHTML = items.reverse().join('');
}

/** Redraws everything after a note is written or taken back. */
function redraw() {
  const { abc, drill, steps, results } = state;
  document.getElementById('prompt').textContent = promptFor(steps.length);
  drawKeys();
  drawStrip();
  drawProblems();
  const kinds = results.map((result) => `cont-${worstOf(result) ?? 'ok'}`);
  drawScore(document.getElementById('score'), abc, drill, steps, kinds);
  document.getElementById('undo').disabled = steps.length === 0;
  if (steps.length === countWrite(drill)) showResult();
  else document.getElementById('result').hidden = true;
}

/** Plays your note at its written length, with R and the CF that sound against it. */
function hear(k) {
  const { drill, steps } = state;
  const window = writeWindow(drill, k);
  const seconds = Math.max(SHORTEST, (window.end - window.start) * WHOLE_SECONDS);
  const voices = canonVoices(drill, steps);
  const step = steps[k];
  tone(step, { seconds, alter: semitonesInKey(step, drill.key) - semitonesOf(step) });
  for (const id of [VOICE.R, VOICE.CF]) {
    const other = soundingAt(voices[id], window.start);
    if (other) tone(other.step, { seconds, voice: SOUND_VOICE.SITE, alter: other.semitones - semitonesOf(other.step) });
  }
}

/** The summary under the finished canon: clean notes, problems, and how many notes match the notebook. */
function summaryText() {
  const { drill, steps, results, example } = state;
  const count = (kind) => results.filter((result) => worstOf(result) === kind).length;
  const clean = results.filter((result) => worstOf(result) === null).length;
  const same = steps.filter((step, k) => step === drill.original[k]).length;
  return `${example.title}: ${clean} of ${steps.length} notes clean, `
    + `${count('miss')} against the rules, ${count('check')} to check. `
    + `${same} of ${steps.length} notes are the notebook’s own.`;
}

/** The drill is done: the summary and the notebook's own version to compare. */
function showResult() {
  const { abc, example } = state;
  document.getElementById('summary').textContent = summaryText();
  const box = document.getElementById('original');
  box.innerHTML = '';
  const page = example.page === 'WIP' ? '../wip/' : '../notebook/';
  const wrap = block(box, 'The notebook’s version', `${example.source}. <a href="${page}#${example.id}">See it on the ${example.page} page</a>.`);
  showWithAudio(wrap, abc, abc);
  document.getElementById('result').hidden = false;
}

/** A note from the keys: written into the drill if one is going, else just played. */
function onStep(step) {
  if (!state || state.steps.length >= countWrite(state.drill)) {
    tone(step, { seconds: 0.6 });
    return;
  }
  state.steps.push(step);
  state.results = checkAll(state.drill, state.steps);
  hear(state.steps.length - 1);
  redraw();
}

/** Takes back your last note. */
function undo() {
  if (!state?.steps.length) return;
  state.steps.pop();
  state.results = checkAll(state.drill, state.steps);
  redraw();
}

/** Fills the Given select for the chosen example: from the delay up, the delay plus one picked. */
function fillGiven() {
  const example = EXAMPLES[Number(document.getElementById('example').value)];
  const choices = givenChoices(example.canon);
  const options = choices.map((bars) => ({ value: bars, text: bars === 1 ? '1 bar' : `${bars} bars` }));
  const preferred = choices.includes(example.canon.delay + 1) ? example.canon.delay + 1 : choices[0];
  fillSelect(document.getElementById('given'), options, preferred);
}

/** Start button: sets up the chosen example with its opening given. */
async function start() {
  connectMidi(onStep, (text) => { document.getElementById('midi').textContent = text; });
  const example = EXAMPLES[Number(document.getElementById('example').value)];
  const abc = await load(example.file);
  const drill = drillFrom(abc, example.canon, Number(document.getElementById('given').value));
  state = { example, abc, drill, steps: [], results: [], octaves: octavesFor(drill) };
  document.getElementById('start').textContent = 'Start again';
  redraw();
}

fillSelect(document.getElementById('example'), EXAMPLES.map((example, k) => ({
  value: k, text: `${example.title} (${example.source})`,
})), 0);
fillGiven();
document.getElementById('example').addEventListener('change', fillGiven);
document.getElementById('start').addEventListener('click', start);
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('hints').addEventListener('change', () => state && drawKeys());
document.addEventListener('keydown', (event) => {
  if (event.key === 'Backspace' && !event.target.closest?.('input, select, textarea')) {
    event.preventDefault();
    undo();
  }
});
listenForNotes({ screen: document.getElementById('keys'), onStep, octaves: () => state?.octaves ?? 0 });
document.getElementById('keys').innerHTML = keyboard(LOW, HIGH, [], [], { labels: keyLabels() });
