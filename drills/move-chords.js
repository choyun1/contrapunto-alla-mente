// Renders the Move chords drill: the site names a canon and the risposta's
// note, and you play every note the proposta may move to next. All the theory
// is in src/taneyev/canon-hands.js; this file runs the drill and draws it.
// Intervals are zero-indexed (3rd 2, 5th 4, octave 7); pitches are diatonic
// steps in C, played in the chosen key signature (signature.js).

import {
  handMoves, moveNames, isHandNote, rispostaNote, stackedChord, chordSymbol,
} from '../src/taneyev/canon-hands.js';
import { parsePitch, MIDDLE_C } from '../src/common/diatonic.js';
import { listenForNotes, connectMidi } from '../src/input/listen.js';
import { VOICE } from '../src/audio/tone.js';
import {
  pickWeighted, weightOf, recordAnswer, loadStats, saveStats,
} from '../src/drills/deck.js';
import { chordTune } from '../src/notation/abc.js';
import { drawSmall } from '../src/notation/playback.js';
import { CANONS, drawKeys, fillSelect, numberIn } from './common.js';
import { fillSignatures, nameOf, play, playPlayed, signature, stepOfPlayed } from './signature.js';
import { entryName } from '../canon/names.js';

/** Which canons each level asks about, easiest first (see CANONS). */
const LEVELS = [
  { value: 0, text: 'Unison and octaves', entries: [0, 7, -7] },
  { value: 1, text: 'Add 5ths and 4ths', entries: [0, 7, -7, 4, -4, 3, -3] },
  { value: 2, text: 'Add 3rds and 6ths', entries: [0, 7, -7, 4, -4, 3, -3, 2, -2, 5, -5] },
  { value: 3, text: 'Add 12ths and 10ths', entries: CANONS },
];

/** Answer-time aims, in seconds: slower than this counts as a miss for the deck. */
const TARGETS = [5, 3, 2, 1].map((seconds) => ({ value: seconds, text: `${seconds} s` }));

/**
 * The risposta's notes, A3 to E5: a hand (up to a 6th) fits on the
 * on-screen keyboard (C3–C6) on either side.
 */
const RISPOSTA_LOW = parsePitch('A3');
const RISPOSTA_HIGH = parsePitch('E5');

/** Pause after a finished prompt before the next one (ms). */
const NEXT_MS = 1800;

/** How many recent answers the running average covers. */
const RECENT = 10;

/** Name of this drill's saved stats in the browser. */
const STATS_NAME = 'move-chords';

let stats = loadStats(STATS_NAME);
let prompt = null; // { entry, from, risposta, names, found, good, bad, missed, startedAt, done }
let nextTimer = null;
const times = []; // seconds for each finished prompt, newest last

/** A step's letter as it sounds in the key signature, e.g. 'B♭'. */
const letterName = (step) => nameOf(step).replace(/-?\d+$/, '');

/** A chord symbol in the key signature: the C-major quality, on the root as it sounds, e.g. 'B♭maj7'. */
const symbolInKey = (stacked) => `${letterName(stacked[0])}${chordSymbol(stacked).slice(1)}`;

/** A random risposta note in range. */
const randomRisposta = () => RISPOSTA_LOW + Math.floor(Math.random() * (RISPOSTA_HIGH - RISPOSTA_LOW + 1));

/** Starts a new prompt: picks a canon (favoring misses) and a risposta note, and plays it. */
function newPrompt() {
  const level = LEVELS[numberIn('level')];
  const entry = pickWeighted(level.entries, (e) => weightOf(stats, e));
  const risposta = randomRisposta();
  const from = risposta - entry; // the proposta's note one delay ago
  prompt = {
    entry, from, risposta, names: moveNames(from, entry), found: new Set(),
    good: new Set(), bad: new Set(), outside: new Set(), missed: false, startedAt: performance.now(), done: false,
  };
  document.getElementById('answer').innerHTML = '';
  play(risposta, { seconds: 1.2, voice: VOICE.SITE });
  render();
}

/** The prompt line, e.g. "Canon at the 5th above: risposta on D4". */
function promptText() {
  return `Canon at the ${entryName(prompt.entry)}: risposta on ${nameOf(prompt.risposta)}`;
}

/** The found-so-far line: names found, how many to go, wrong notes. */
function foundText() {
  const found = [...prompt.found].join(' ') || 'none yet';
  const wrongCount = prompt.bad.size + prompt.outside.size;
  const wrong = wrongCount ? ` · ${wrongCount} wrong` : '';
  return `Found ${prompt.found.size} of ${prompt.names.length}: ${found}${wrong}`;
}

/** Draws the keyboard: R on the risposta, your notes lit, and once done the ones you missed. */
function render() {
  document.getElementById('prompt').textContent = promptText();
  document.getElementById('found').textContent = foundText();
  const lit = new Map();
  prompt.good.forEach((step) => lit.set(step, 'kb-good'));
  prompt.bad.forEach((step) => lit.set(step, 'kb-bad'));
  if (prompt.done) {
    handMoves(prompt.from, prompt.entry).forEach((move) => { if (!lit.has(move.step)) lit.set(move.step, 'kb-on'); });
  }
  const extraLit = new Map([...prompt.outside].map((semitones) => [semitones, 'kb-bad']));
  drawKeys(document.getElementById('keys'), { lit, extraLit, tags: [{ step: prompt.risposta, text: 'R', kind: 'r' }] });
}

/** Draws the answer as a chord under the hand and stacked in thirds. */
function drawAnswer() {
  const hand = handMoves(prompt.from, prompt.entry).map((move) => move.step);
  const stacked = stackedChord(prompt.from, prompt.entry);
  const box = document.getElementById('answer');
  box.innerHTML = `<figure><div class="chord-score"></div><figcaption>Under the hand</figcaption></figure>
    <figure><div class="chord-score"></div><figcaption>Stacked in thirds: <b>${symbolInKey(stacked)}</b></figcaption></figure>`;
  const clef = (steps) => (Math.min(...steps) < MIDDLE_C - 3 ? 'bass' : 'treble');
  const [handBox, stackBox] = box.querySelectorAll('.chord-score');
  const { steps: moved, abc: key } = signature();
  const inKey = (steps) => chordTune(steps.map((step) => step + moved), { clef: clef(steps), key });
  drawSmall(handBox, inKey(hand), 90);
  drawSmall(stackBox, inKey(stacked), 90);
}

/** The running tally: how many done, the last time and the recent average. */
function tallyText() {
  const recent = times.slice(-RECENT);
  const average = recent.reduce((sum, t) => sum + t, 0) / recent.length;
  return `Done ${times.length} · this one ${times.at(-1).toFixed(1)} s · last ${recent.length}: ${average.toFixed(1)} s on average`;
}

/** Ends the prompt: records it in the deck, shows the answer, and queues the next one. */
function finish() {
  const seconds = (performance.now() - prompt.startedAt) / 1000;
  prompt.done = true;
  times.push(seconds);
  const slow = seconds > numberIn('target');
  stats = recordAnswer(stats, prompt.entry, prompt.missed || slow);
  saveStats(STATS_NAME, stats);
  render();
  drawAnswer();
  document.getElementById('tally').textContent = tallyText();
  nextTimer = setTimeout(newPrompt, NEXT_MS);
}

/** One note played (src/input/listen.js): sounds it, then grades it against the prompt. */
function onStep(played) {
  playPlayed(played, { seconds: 0.8 });
  if (!prompt || prompt.done) return;
  const step = stepOfPlayed(played);
  if (step === null) {
    // a black or white key outside the key signature is never one of the answers
    prompt.outside.add(played.semitones);
    prompt.missed = true;
  } else if (isHandNote(step, prompt.from, prompt.entry)) {
    prompt.good.add(step);
    prompt.found.add(letterName(step));
  } else {
    prompt.bad.add(step);
    prompt.missed = true;
  }
  if (prompt.found.size === prompt.names.length) finish();
  else render();
}

/** Start button: starts the drill, or stops it. */
function toggleStart(button) {
  clearTimeout(nextTimer);
  if (prompt) {
    prompt = null;
    button.textContent = 'Start';
    document.getElementById('prompt').textContent = 'Press Start, then play.';
    return;
  }
  button.textContent = 'Stop';
  connectMidi(onStep, (text) => { document.getElementById('midi').textContent = text; });
  newPrompt();
}

fillSignatures();
fillSelect(document.getElementById('level'), LEVELS, 0);
fillSelect(document.getElementById('target'), TARGETS, 3);
const startButton = document.getElementById('start');
startButton.addEventListener('click', () => toggleStart(startButton));
drawKeys(document.getElementById('keys'));
listenForNotes({ screen: document.getElementById('keys'), onStep });
