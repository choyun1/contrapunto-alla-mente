// Renders the Lead the canon drill: you play the proposta, the site plays it
// back as the risposta after the delay, and each of your notes is checked
// against the risposta's note under it. All the checks come from
// src/taneyev/canon.js; this file runs the drill and draws it.
// Intervals are zero-indexed (3rd 2, 5th 4, octave 7); pitches are diatonic steps.

import { checkProposta, crossesVoices } from '../src/taneyev/canon.js';
import { handMoves } from '../src/taneyev/canon-hands.js';
import { pitchName, isTritone } from '../src/common/diatonic.js';
import { listenForNotes, connectMidi } from '../src/input/listen.js';
import { tone, VOICE } from '../src/audio/tone.js';
import { startRun } from '../src/drills/run.js';
import { twoVoiceTune } from '../src/notation/abc.js';
import { block, show } from '../src/notation/playback.js';
import {
  canonOptions, DELAYS, TEMPOS, LENGTHS, fillSelect, numberIn, drawKeys, verdictLabel, betweenName, stripCell,
} from './common.js';
import { entryName } from '../canon/names.js';

/** How long the risposta holds a note in wait-for-me mode, at most (s); the next beat cuts it. */
const HOLD = 30;

/** How long your own note sounds (s). */
const PLAYER_SECONDS = 1;

let state = null; // { entry, delay, length, proposta, cells, run, held }

/** The risposta's note on beat i, or null before it enters or after it ends. */
function rispostaAt(i) {
  if (i < state.delay) return null;
  return state.proposta[i - state.delay] ?? null;
}

/** The risposta note in sounding pitch: your note `delay` beats ago, moved by the interval of entrance. */
const rispostaPitch = (i) => (rispostaAt(i) === null ? null : rispostaAt(i) + state.entry);

/** The prompt line for beat i. */
function promptFor(i) {
  const total = `Note ${i + 1} of ${state.length}`;
  if (i >= state.length) return `The risposta finishes: ${pitchName(rispostaPitch(i))}.`;
  if (rispostaPitch(i) === null) return `${total}: the risposta has not come in yet. Play any note.`;
  return `${total}: the risposta sings ${pitchName(rispostaPitch(i))}.`;
}

/** Draws the keyboard for beat i: R on the risposta's note, P on your last note, and the hand if hints are on. */
function drawBeat(i) {
  const tags = [];
  const risposta = rispostaPitch(i);
  if (risposta !== null) tags.push({ step: risposta, text: 'R', kind: 'r' });
  const last = state.proposta[i - 1];
  if (last != null && last !== risposta) tags.push({ step: last, text: 'P', kind: 'p' });
  const showHand = document.getElementById('hints').checked && risposta !== null && i < state.length;
  const marks = showHand ? handMoves(rispostaAt(i), state.entry) : [];
  drawKeys(document.getElementById('keys'), { marks, tags });
}

/** Redraws the strip of beats so far, with the current beat outlined. */
function drawStrip(now) {
  const cells = state.cells.map((cell, k) => stripCell({ ...cell, kind: `${cell.kind}${k === now ? ' now' : ''}` }));
  document.getElementById('strip').innerHTML = cells.join('');
}

/** Beat i starts: the risposta sounds its note, and the page shows what to play against. */
function onBeat(i, at, seconds) {
  state.held?.stop();
  state.held = null;
  const risposta = rispostaPitch(i);
  if (risposta !== null) state.held = tone(risposta, { at, seconds: seconds ?? HOLD, voice: VOICE.SITE });
  document.getElementById('prompt').textContent = promptFor(i);
  drawBeat(i);
}

/** The strip cell for your note on beat i, checked against the risposta (canon.js). */
function gradeNote(i) {
  const step = state.proposta[i];
  if (i < state.delay) return { top: pitchName(step), middle: '—', bottom: 'alone', kind: '' };
  const result = checkProposta(state.proposta.slice(0, i + 1), state.entry, state.delay).at(-1);
  const tritone = i > 0 && isTritone(step, state.proposta[i - 1]);
  const label = verdictLabel(result, { crossed: crossesVoices(result.n, state.entry), tritone });
  return { top: pitchName(step), middle: betweenName(result.n), bottom: label.text, kind: label.kind };
}

/** You played `step` on beat i. */
function onNote(i, step) {
  tone(step, { seconds: PLAYER_SECONDS });
  state.proposta[i] = step;
  state.cells[i] = gradeNote(i);
  drawStrip(i);
}

/** No note on beat i (timed runs): your last note is held, or the run stops on the first beat. */
function onMiss(i) {
  if (i === 0) {
    stopRun('You missed the first beat. Press Start to try again.');
    return;
  }
  state.proposta[i] = state.proposta[i - 1];
  state.cells[i] = { ...gradeNote(i), bottom: 'missed', kind: 'miss' };
  drawStrip(i);
}

/** Counts each kind of mistake, e.g. "2 dissonant, 1 parallel". */
function mistakeCounts(mistakes) {
  const counts = new Map();
  mistakes.forEach((kind) => counts.set(kind, (counts.get(kind) ?? 0) + 1));
  return [...counts].map(([kind, count]) => `${count} ${kind}`).join(', ');
}

/** The run is over: draws both voices on the staff with a Play button. */
function onEnd() {
  const { proposta, entry, delay, length, cells } = state;
  const mistakes = cells.filter((cell) => cell.kind === 'miss').map((cell) => cell.bottom);
  const measures = Array.from({ length: length + delay }, (_, k) => ({
    voiceI: k < delay || proposta[k - delay] == null ? null : proposta[k - delay] + entry,
    voiceII: proposta[k] ?? null,
  }));
  const clean = length - mistakes.length;
  document.getElementById('summary').textContent = `Canon at the ${entryName(entry)}, delay ${delay}: `
    + `${clean} of ${length} notes clean${mistakes.length ? ` (${mistakeCounts(mistakes)})` : ''}.`;
  const score = document.getElementById('score');
  score.innerHTML = '';
  show(block(score, 'Proposta and risposta'), twoVoiceTune(measures, { names: ['Risposta', 'Proposta'] }));
  document.getElementById('result').hidden = false;
  stopRun('Done. Press Start for another.');
}

/** Stops the run and resets the Start button. */
function stopRun(message) {
  state?.run?.stop();
  state?.held?.stop();
  state = null;
  drawKeys(document.getElementById('keys'));
  document.getElementById('start').textContent = 'Start';
  document.getElementById('prompt').textContent = message;
}

/** Start button: starts a run with the chosen settings, or stops the one going. */
function toggleStart() {
  if (state) {
    stopRun('Stopped. Press Start to begin again.');
    return;
  }
  connectMidi(onStep, (text) => { document.getElementById('midi').textContent = text; });
  const length = numberIn('length');
  const delay = numberIn('delay');
  state = { entry: numberIn('entry'), delay, length, proposta: [], cells: [], held: null, run: null };
  document.getElementById('start').textContent = 'Stop';
  document.getElementById('result').hidden = true;
  drawStrip(-1);
  // The risposta goes on `delay` beats after your last note, to finish the canon.
  state.run = startRun({
    length: length + delay, bpm: numberIn('tempo'), needsInput: (i) => i < length, onBeat, onNote, onMiss, onEnd,
  });
}

/** Every note you play: sounds it when no run is going, else hands it to the run. */
function onStep(step) {
  if (state?.run) state.run.note(step);
  else tone(step, { seconds: PLAYER_SECONDS });
}

fillSelect(document.getElementById('entry'), canonOptions(), 0);
fillSelect(document.getElementById('delay'), DELAYS, 1);
fillSelect(document.getElementById('tempo'), TEMPOS, 0);
fillSelect(document.getElementById('length'), LENGTHS, 8);
document.getElementById('start').addEventListener('click', toggleStart);
drawKeys(document.getElementById('keys'));
listenForNotes({ screen: document.getElementById('keys'), onStep });
