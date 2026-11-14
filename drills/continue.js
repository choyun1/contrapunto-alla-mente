// Renders the Continue the proposta drill: the opening of one of Cho's own
// canons is given, and you write the rest of the proposta note by note, in the
// notebook's rhythm or your own, while the risposta copies what you write. Every check
// comes from src/taneyev/canon-continue.js; this file runs the drill and draws it.
// Intervals are zero-indexed (3rd 2, 5th 4, octave 7); pitches are diatonic
// steps, with semitones from C0 for how they sound (ficta included).

import {
  checkAll, countWrite, canonVoices, isComplete, writeWindow, writtenNotes, worstOf, SLOT, VOICE,
} from '../src/taneyev/canon-continue.js';
import { isStrongBeat } from '../src/taneyev/florid.js';
import { drillFrom, givenChoices, inOwnRhythm, reached, roomLeft } from '../src/drills/continue-drill.js';
import { spellInKey, spelledName, semitonesOf, parsePitch } from '../src/common/diatonic.js';
import { keyLabels } from '../src/input/key-map.js';
import { listenForNotes, connectMidi } from '../src/input/listen.js';
import { tone, VOICE as SOUND_VOICE } from '../src/audio/tone.js';
import { keyboard } from '../src/ui/keyboard.js';
import { TEMPO, block, showWithAudio } from '../src/notation/playback.js';
import { drillExamples } from './continue-examples.js';
import { drawScore } from './continue-score.js';
import { drawLengths, listenForLengths, pickedLength, roomName, valueName, whereName } from './continue-rhythm.js';
import { fillSelect, stripCell } from './common.js';

const EXAMPLES = drillExamples();

/** Seconds a whole note lasts when a note is heard on its own, at the Notebook's tempo. */
const WHOLE_SECONDS = (4 * 60) / TEMPO.NOTEBOOK;

/** The shortest a note sounds when you play it (s), so eighths are still heard. */
const SHORTEST = 0.4;

/** The on-screen keyboard before it is moved to the proposta's octave: the three rows of computer keys. */
const LOW = parsePitch('C3');
const HIGH = parsePitch('C6');

// base: the drill in the notebook's rhythm; entries: what you wrote, [{ length, played }];
// drill and steps: what the checks take, in whichever rhythm is in use (refresh)
let state = null; // { example, abc, base, own, entries, drill, steps, results, octaves }

/** Works out the drill, your notes and their checks after an entry is added or taken back. */
function refresh() {
  const { base, own, entries } = state;
  const view = own ? inOwnRhythm(base, entries) : { drill: base, steps: entries.map((entry) => entry.played) };
  Object.assign(state, view, { results: checkAll(view.drill, view.steps) });
}

/** Where the next note you write starts. */
function nextStart() {
  const { base, own, entries, drill, steps } = state;
  return own ? reached(base, entries) : writeWindow(drill, steps.length).start;
}

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

/** The notes you wrote so far, as they sound: [{ step, semitones, ... }], one per note. */
const writtenPitches = () => writtenNotes(state.drill, state.steps).filter((note) => note.slot === SLOT.WRITE);

/** Plays a note given as { step, semitones }; options as for tone(). */
const sound = (note, options) => tone(note.step, { ...options, alter: note.semitones - semitonesOf(note.step) });

/** A voice's note sounding at time t, or null. */
const soundingAt = (voice, t) => voice?.find((note) => note.step !== null && t >= note.start - 1e-9 && t < note.start + note.length - 1e-9) ?? null;

/** The length of the next note: the one picked, in your own rhythm; the notebook's, with any tied notes, in its rhythm. */
function nextLength() {
  const { drill, steps, own } = state;
  if (own) return { length: pickedLength(), held: false };
  const window = writeWindow(drill, steps.length);
  const note = drill.slots.find((slot) => Math.abs(slot.start - window.start) < 1e-9);
  return { length: note.length, held: window.end - window.start > note.length + 1e-9 };
}

/** The prompt for the next note you write, with what it sounds against. */
function promptFor(k) {
  const { drill, steps, own } = state;
  if (isComplete(drill, steps)) return 'Done: the canon is complete as far as the notebook keeps it strict.';
  const start = nextStart();
  const voices = canonVoices(drill, steps);
  const against = [VOICE.R, VOICE.CF].map((id) => [id, soundingAt(voices[id], start)])
    .filter(([, sounding]) => sounding).map(([id, sounding]) => `${id} ${spelledName(sounding)}`);
  const beat = isStrongBeat(start) ? 'a strong beat: be consonant' : 'a weak beat: a dissonance must pass or turn by step';
  const { length, held } = nextLength();
  const value = valueName(length);
  const article = /^e/.test(value) ? 'an' : 'a';
  const which = own ? `Note ${k + 1}` : `Note ${k + 1} of ${countWrite(drill)}`;
  const left = own ? ` ${roomName(roomLeft(state.base, state.entries))} left to fill.` : '';
  return `${which}: ${whereName(start)}, ${article} ${value}${held ? ', held over' : ''}. `
    + `Against ${against.join(' and ') || 'nothing'}; ${beat}.${left}`;
}

/** Draws the keyboard: R and CF on their notes now, and P on your last note. */
function drawKeys() {
  const { drill, steps, octaves } = state;
  const voices = canonVoices(drill, steps);
  const tags = [];
  if (!isComplete(drill, steps)) {
    const t = nextStart();
    const risposta = soundingAt(voices.R, t);
    const cantus = soundingAt(voices.CF, t);
    if (risposta) tags.push({ semitones: risposta.semitones, text: 'R', kind: 'r' });
    if (cantus) tags.push({ semitones: cantus.semitones, text: 'CF', kind: 'p' });
  }
  const last = voices.P.findLast((note) => note.step !== null);
  if (last && !tags.some((tag) => tag.semitones === last.semitones)) tags.push({ semitones: last.semitones, text: 'P', kind: 'p' });
  const labels = new Map([...keyLabels()].map(([step, label]) => [step + 7 * octaves, label]));
  const low = LOW + 7 * octaves;
  const high = HIGH + 7 * octaves;
  const box = document.getElementById('keys');
  box.innerHTML = keyboard(low, high, tags, { labels });
  // on a narrow screen, scroll the keyboard so the first tag (R, or your last note) is in the middle
  const tag = box.querySelector('.kb-tag');
  if (tag) box.scrollLeft = Number(tag.getAttribute('x')) - box.clientWidth / 2;
}

/** Strip and score color class for a checked note, by its worst problem. */
const KIND_OF = { miss: 'miss', check: 'check', pending: 'pending' };

/** The strip of your notes so far, each with where it falls and its verdict. */
function drawStrip() {
  const { drill, results } = state;
  const cells = writtenPitches().map((note, k) => {
    const worst = worstOf(results[k]);
    return stripCell({
      top: spelledName(note),
      middle: whereName(writeWindow(drill, k).start).replace(/bar (\d+), beat /, '$1.'),
      bottom: worst ?? 'ok',
      kind: KIND_OF[worst] ?? 'free',
    });
  });
  document.getElementById('strip').innerHTML = cells.join('');
}

/** The list of every problem so far, newest first, each with where it is. */
function drawProblems() {
  const { drill, results } = state;
  const notes = writtenPitches();
  const items = [];
  results.forEach((result, k) => {
    const where = `${whereName(writeWindow(drill, k).start)} (${spelledName(notes[k])})`;
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
  document.getElementById('undo').disabled = state.entries.length === 0;
  const lengths = document.getElementById('lengths');
  lengths.hidden = !state.own || isComplete(drill, steps);
  if (!lengths.hidden) drawLengths(lengths, roomLeft(state.base, state.entries));
  if (isComplete(drill, steps)) showResult();
  else document.getElementById('result').hidden = true;
}

/** Plays your note at its written length, with R and the CF that sound against it. */
function hear(k) {
  const { drill, steps } = state;
  const window = writeWindow(drill, k);
  const seconds = Math.max(SHORTEST, (window.end - window.start) * WHOLE_SECONDS);
  const voices = canonVoices(drill, steps);
  sound(writtenPitches()[k], { seconds });
  for (const id of [VOICE.R, VOICE.CF]) {
    const other = soundingAt(voices[id], window.start);
    if (other) sound(other, { seconds, voice: SOUND_VOICE.SITE });
  }
}

/** The summary under the finished canon: clean notes, problems, and how many notes match the notebook. */
function summaryText() {
  const { base, steps, results, example } = state;
  const notes = writtenPitches();
  const count = (kind) => results.filter((result) => worstOf(result) === kind).length;
  const clean = results.filter((result) => worstOf(result) === null).length;
  // the notebook's own: the same step at the same time as one of the notebook's notes
  const theirs = base.slots.filter((slot) => slot.slot === SLOT.WRITE);
  const same = notes.filter((note) => theirs.some((slot) => Math.abs(slot.start - note.start) < 1e-9 && slot.step === note.step)).length;
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

/**
 * What you played, as the drill writes it: a computer key is a letter (a
 * step, spelled in the key); a pressed key is a pitch, spelled in the key or
 * as ficta (spellInKey): { step, semitones }.
 */
function asWritten(played) {
  if (played.semitones === undefined) return played.step;
  return spellInKey(played.semitones, state?.drill.key ?? {});
}

/** A note from the keys: written into the drill if one is going, else just played. */
function onStep(played) {
  if (!state || isComplete(state.drill, state.steps)) {
    const written = asWritten(played);
    sound(typeof written === 'number' ? { step: written, semitones: semitonesOf(written) } : written, { seconds: 0.6 });
    return;
  }
  write(asWritten(played));
  hear(state.steps.length - 1);
  redraw();
}

/** Adds what you played (null for a rest) at the next note's length. */
function write(played) {
  state.entries.push({ length: nextLength().length, played });
  refresh();
}

/** A rest from the length picker, in your own rhythm. */
function onRest() {
  if (!state?.own || isComplete(state.drill, state.steps)) return;
  write(null);
  redraw();
}

/** Takes back your last note. */
function undo() {
  if (!state?.entries.length) return;
  state.entries.pop();
  refresh();
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
  const base = drillFrom(abc, example.canon, Number(document.getElementById('given').value));
  const own = document.getElementById('rhythm').value === 'own';
  state = { example, abc, base, own, entries: [], octaves: octavesFor(base) };
  refresh();
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
listenForLengths(document.getElementById('lengths'), {
  onChange: () => { if (state) redraw(); },
  onRest,
  isOn: () => Boolean(state?.own),
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Backspace' && !event.target.closest?.('input, select, textarea')) {
    event.preventDefault();
    undo();
  }
});
listenForNotes({ screen: document.getElementById('keys'), onStep, octaves: () => state?.octaves ?? 0 });
document.getElementById('keys').innerHTML = keyboard(LOW, HIGH, [], { labels: keyLabels() });
