// Renders the Follow the leader drill: the site plays a proposta, and you
// answer as the risposta, playing (checked) or singing (heard back at the end).
// The prompts come from src/taneyev/canon-walk.js; this file runs the drill.
// Intervals are zero-indexed (3rd 2, 5th 4, octave 7); pitches are diatonic
// steps in C, played in the chosen key signature (signature.js).

import { randomProposta, rispostaFor } from '../src/taneyev/canon-walk.js';
import { letterOf } from '../src/common/diatonic.js';
import { listenForNotes, connectMidi } from '../src/input/listen.js';
import { VOICE } from '../src/audio/tone.js';
import {
  abcInKey, fillSignatures, measuresInKey, nameOf, outsideName, play, playPlayed, stepOfPlayed,
} from './signature.js';
import { startRun } from '../src/drills/run.js';
import { twoVoiceTune } from '../src/notation/abc.js';
import { block, show } from '../src/notation/playback.js';
import {
  canonOptions, DELAYS, TEMPOS, LENGTHS, LOW, HIGH, fillSelect, numberIn, drawKeys, stripCell,
} from './common.js';
import { entryName, withArticle } from '../canon/names.js';

/** How you answer: by playing (checked note by note) or singing (checked by ear at the end). */
const ANSWERS = [{ value: 0, text: 'playing' }, { value: 1, text: 'singing' }];
const SINGING = 1;

/** Singing needs a steady beat, so "wait for me" runs at this tempo when singing. */
const SINGING_BPM = 50;

/** How far the proposta may go either side of its first note, in steps (a 6th). */
const SPREAD = 5;

/** How long the proposta holds a note in wait-for-me mode, at most (s); the next beat cuts it. */
const HOLD = 30;

let state = null; // { entry, delay, length, proposta, risposta, cells, run, held, singing }

/**
 * The proposta's first note: a C or G near the middle of the room both
 * voices have on the C3–C6 keyboard, so the risposta fits too.
 */
function startNote(entry) {
  const low = Math.max(LOW, LOW - entry) + SPREAD;
  const high = Math.min(HIGH, HIGH - entry) - SPREAD;
  const middle = Math.round((low + high) / 2);
  for (let distance = 0; distance <= 3; distance += 1) {
    for (const step of [middle - distance, middle + distance]) {
      if (letterOf(step) === 'C' || letterOf(step) === 'G') return step;
    }
  }
  return middle;
}

/** A fresh proposta for the chosen canon, or null if none fits. */
function newProposta(entry, delay, length) {
  const start = startNote(entry);
  const range = {
    low: Math.max(LOW, LOW - entry, start - SPREAD),
    high: Math.min(HIGH, HIGH - entry, start + SPREAD),
  };
  return randomProposta({ start, entry, delay, length, range });
}

/** The prompt line for beat i. */
function promptFor(i) {
  if (i < state.delay) return `Listen: the proposta starts alone (${i + 1} of ${state.delay}).`;
  const verb = state.singing ? 'Sing' : 'Play';
  const back = state.delay === 1 ? 'one note' : `${state.delay} notes`;
  const moved = state.entry === 0 ? 'at the unison' : withArticle(entryName(state.entry));
  return `${verb} the proposta’s note from ${back} back, ${moved}.`;
}

/** The proposta's note on beat k as the strip shows it: its name, ♪ while hidden, — once it has ended. */
function propostaLabel(k) {
  if (k >= state.length) return '—';
  const showNotes = document.getElementById('hints').checked || !state.run;
  return showNotes ? nameOf(state.proposta[k]) : '♪';
}

/** Redraws the strip: one cell per beat so far, proposta on top, your answer below. */
function drawStrip(now) {
  const cells = state.cells.map((cell, k) => stripCell({
    top: propostaLabel(k),
    middle: cell.middle,
    bottom: cell.bottom,
    kind: `${cell.kind}${k === now ? ' now' : ''}`,
  }));
  document.getElementById('strip').innerHTML = cells.join('');
}

/** Beat i starts: the proposta sounds its next note (until it has finished). */
function onBeat(i, at, seconds) {
  state.held?.stop();
  state.held = null;
  if (i < state.length) {
    state.held = play(state.proposta[i], { at, seconds: seconds ?? HOLD, voice: VOICE.SITE });
  }
  state.cells[i] = { middle: '…', bottom: i < state.delay ? 'listen' : '', kind: '' };
  if (state.singing && i >= state.delay) state.cells[i] = { middle: 'sing', bottom: '', kind: '' };
  document.getElementById('prompt').textContent = promptFor(i);
  drawStrip(i);
}

/**
 * You played a note as the risposta on beat i: right if it is the proposta's
 * note `delay` back, moved. `played` is a step, or { outside } (semitones)
 * for a pitch outside the key signature, which is always wrong.
 */
function onNote(i, played) {
  const outside = typeof played === 'object';
  const expected = state.risposta[i];
  const right = !outside && played === expected;
  const name = outside ? outsideName(played.outside) : nameOf(played);
  state.cells[i] = right
    ? { middle: name, bottom: 'right', kind: 'free' }
    : { middle: name, bottom: `not ${nameOf(expected)}`, kind: 'miss' };
  const lit = new Map(right ? [[played, 'kb-good']] : [[expected, 'kb-on']]);
  if (!right && !outside) lit.set(played, 'kb-bad');
  const extraLit = new Map(outside ? [[played.outside, 'kb-bad']] : []);
  drawKeys(document.getElementById('keys'), { lit, extraLit });
  drawStrip(i);
}

/** No note on beat i (timed runs). */
function onMiss(i) {
  state.cells[i] = { middle: '—', bottom: `not ${nameOf(state.risposta[i])}`, kind: 'miss' };
  drawStrip(i);
}

/** The run is over: shows both voices on the staff, with a Play button to check by ear. */
function onEnd() {
  const { proposta, risposta, entry, delay, length, cells, singing } = state;
  const measures = Array.from({ length: length + delay }, (_, k) => ({ voiceI: risposta[k], voiceII: proposta[k] ?? null }));
  const answered = cells.slice(delay);
  const right = answered.filter((cell) => cell.kind === 'free').length;
  document.getElementById('summary').textContent = singing
    ? `Canon at the ${entryName(entry)}, delay ${delay}. Press Play and sing the risposta along to check it.`
    : `Canon at the ${entryName(entry)}, delay ${delay}: ${right} of ${answered.length} notes right.`;
  const score = document.getElementById('score');
  score.innerHTML = '';
  show(block(score, 'Proposta and risposta'), abcInKey(twoVoiceTune(measuresInKey(measures), { names: ['Risposta', 'Proposta'] })));
  document.getElementById('result').hidden = false;
  stopRun('Done. Press Start for a new proposta.');
  drawStrip(-1);
}

/** Stops the run and resets the Start button; keeps the strip for a last look. */
function stopRun(message) {
  state?.run?.stop();
  state?.held?.stop();
  if (state) state.run = null;
  document.getElementById('start').textContent = 'Start';
  document.getElementById('prompt').textContent = message;
}

/** Start button: makes a proposta and starts the run, or stops the one going. */
function toggleStart() {
  if (state?.run) {
    stopRun('Stopped. Press Start to begin again.');
    return;
  }
  connectMidi(onStep, (text) => { document.getElementById('midi').textContent = text; });
  const entry = numberIn('entry');
  const delay = numberIn('delay');
  const length = numberIn('length');
  const proposta = newProposta(entry, delay, length);
  if (!proposta) {
    document.getElementById('prompt').textContent = 'No canon fits these settings. Try a longer delay or another interval.';
    return;
  }
  const singing = numberIn('answer') === SINGING;
  const bpm = singing && numberIn('tempo') === 0 ? SINGING_BPM : numberIn('tempo');
  const risposta = [...rispostaFor(proposta, entry, delay), ...proposta.slice(length - delay).map((step) => step + entry)];
  state = { entry, delay, length, proposta, risposta, cells: [], held: null, singing, run: null };
  document.getElementById('start').textContent = 'Stop';
  document.getElementById('result').hidden = true;
  drawKeys(document.getElementById('keys'));
  // The risposta goes on `delay` beats after the proposta's last note, to finish the canon.
  state.run = startRun({
    length: length + delay, bpm, needsInput: (i) => !singing && i >= delay, onBeat, onNote, onMiss, onEnd,
  });
}

/** Every note you play: sounds it when no run is going, else hands it to the run. */
function onStep(played) {
  playPlayed(played, { seconds: 1 });
  const step = stepOfPlayed(played);
  if (state?.run) state.run.note(step ?? { outside: played.semitones });
}

fillSignatures();
fillSelect(document.getElementById('entry'), canonOptions(), 0);
fillSelect(document.getElementById('delay'), DELAYS, 1);
fillSelect(document.getElementById('tempo'), TEMPOS, 0);
fillSelect(document.getElementById('length'), LENGTHS, 8);
fillSelect(document.getElementById('answer'), ANSWERS, 0);
document.getElementById('start').addEventListener('click', toggleStart);
drawKeys(document.getElementById('keys'));
listenForNotes({ screen: document.getElementById('keys'), onStep });
