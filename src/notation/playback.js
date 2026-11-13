// Notation and playback for generated examples, with abcjs (loaded as the
// global ABCJS by each page). Page code calls block() to make a titled box
// with a play button, then show() to draw abc into it. Only one example
// plays at a time.
//
// This runs only in the browser; it holds no music theory.

import { staffSpotAt } from './staff-click.js';

const RENDER_OPTIONS = {
  add_classes: true,
  foregroundColor: 'currentColor', // follows the page's light or dark theme
  responsive: 'resize',
  staffwidth: 640,
};

/** A titled block with a play button and a box for the score. Returns the block. */
export function block(parent, title, caption) {
  const wrap = document.createElement('div');
  wrap.className = 'example';
  wrap.innerHTML = `<div class="example-head"><h3>${title}</h3><button type="button">▶ Play</button></div>
    <div class="score"></div>${caption ? `<p class="note">${caption}</p>` : ''}`;
  parent.append(wrap);
  return wrap;
}

/** Draws a small score with no play button, `width` pixels of staff wide. */
export function drawSmall(element, abc, width) {
  ABCJS.renderAbc(element, abc, { ...RENDER_OPTIONS, responsive: undefined, staffwidth: width });
}

/**
 * Renders abc into a block and wires its play button. `sound` is a General
 * MIDI program from SOUND; music examples keep the flute default. `tempo` is
 * one of TEMPO; music examples keep the slower default.
 */
export function show(wrap, abc, colorMeasure, sound = SOUND.FLUTE, tempo = TEMPO.EXAMPLE) {
  const [tune] = ABCJS.renderAbc(wrap.querySelector('.score'), abc, RENDER_OPTIONS);
  if (colorMeasure) {
    wrap.querySelectorAll('.abcjs-note').forEach((note) => {
      const measure = Number(note.getAttribute('class').match(/abcjs-mm(\d+)/)[1]);
      note.style.color = colorMeasure(measure);
    });
  }
  const button = wrap.querySelector('button');
  button.addEventListener('click', () => toggle(tune, button, sound, tempo));
}

/**
 * Renders an editable score into a block. A click on or near a staff calls
 * `onSpot(spot)` with where it landed: { voice, bar, stepsAboveBottom } (see
 * staff-click.js). The play button plays `audioAbc` instead of what is drawn,
 * so a voice can be shown without being heard.
 */
export function showEditable(wrap, abc, audioAbc, onSpot) {
  const score = wrap.querySelector('.score');
  ABCJS.renderAbc(score, abc, RENDER_OPTIONS);
  score.addEventListener('click', (event) => {
    const spot = staffSpotAt(score.querySelector('svg'), event.clientX, event.clientY);
    if (spot) onSpot(spot);
  });
  const tune = audioTune(audioAbc);
  const button = wrap.querySelector('button');
  button.addEventListener('click', () => toggle(tune, button, SOUND.FLUTE, TEMPO.EXAMPLE));
}

/**
 * Line breaks for long hand-written scores: abcjs breaks the systems itself,
 * about five bars to a line, so busy bars of eighth notes stay readable.
 */
const LINE_BREAKS = { minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 5 };

/**
 * Renders abc into a block, drawing staff `silentVoice` (counted from 0, top
 * down) in gray, and wires the play button to `audioAbc`: the same music
 * without that voice, so it is seen but not heard (the imaginary cantus).
 * The playback tune is made at the first click, so a page of many examples
 * draws only what it shows.
 */
export function showWithSilentVoice(wrap, abc, audioAbc, silentVoice) {
  const score = wrap.querySelector('.score');
  ABCJS.renderAbc(score, abc, { ...RENDER_OPTIONS, wrap: LINE_BREAKS });
  score.querySelectorAll(`.abcjs-v${silentVoice}`).forEach((element) => element.classList.add('silent-voice'));
  const button = wrap.querySelector('button');
  button.addEventListener('click', () => toggle(audioTune(audioAbc), button, SOUND.FLUTE, TEMPO.EXAMPLE));
}

let audioBox = null; // the off-page box that playback-only tunes are drawn into

/**
 * A tune for playback only, drawn into a box off the page: abcjs needs a
 * drawn tune to play, but this one is never seen. Each call reuses the box.
 */
function audioTune(abc) {
  if (!audioBox) {
    audioBox = document.createElement('div');
    audioBox.style.cssText = 'position:absolute;left:-10000px;top:0;width:800px';
    audioBox.setAttribute('aria-hidden', 'true');
    document.body.append(audioBox);
  }
  const [tune] = ABCJS.renderAbc(audioBox, abc, RENDER_OPTIONS);
  return tune;
}

/**
 * Playback tempos, in quarter notes per minute. Music examples play a whole
 * note every 1.125 s (213); the interval demonstrations over a held note play
 * one every 0.56 s (426), since each dyad is heard on its own.
 */
export const TEMPO = {
  EXAMPLE: 213,
  DEMO: 426,
};

/**
 * General MIDI programs for playback, counted from 0. Music examples use the
 * flute, the nearest General MIDI sound to an organ flute stop; the interval
 * demonstrations use the piano. (Church organ and choir aahs were tried and
 * were too much.)
 */
export const SOUND = {
  FLUTE: 73,
  PIANO: 0,
};

let current = null; // { synth, button, timer } for the tune that is playing
let audioContext = null;

const PLAY_LABEL = '▶ Play';
const STOP_LABEL = '■ Stop';

/** Stops whatever is playing and resets its button. */
function stop() {
  if (!current) return;
  current.synth.stop();
  clearTimeout(current.timer);
  current.button.textContent = PLAY_LABEL;
  current = null;
}

/** Play button handler: stops this tune if it is playing, otherwise plays it. */
function toggle(tune, button, sound, tempo) {
  const wasThisOne = current?.button === button;
  stop();
  if (!wasThisOne) play(tune, button, sound, tempo);
}

/**
 * Plays one tune and turns its button into a stop button until it ends.
 * The audio context is created and resumed inside the click itself, before any
 * await, because Safari only allows sound to start from a user gesture.
 */
function play(tune, button, program, qpm) {
  if (!ABCJS.synth.supportsAudio()) return;
  audioContext ??= new AudioContext();
  audioContext.resume();
  const synth = new ABCJS.synth.CreateSynth();
  const playing = { synth, button, timer: null };
  current = playing;
  button.textContent = STOP_LABEL;
  // abcjs 6.4.4 reads options.swing in prime(), so options must be an object.
  // Tempo and instrument are set here, so no tempo or MIDI line is printed.
  synth.init({ visualObj: tune, audioContext, options: { qpm, program } })
    .then(() => synth.prime())
    .then(({ duration }) => {
      if (current !== playing) return; // stopped while loading
      synth.start();
      playing.timer = setTimeout(stop, duration * 1000);
    })
    .catch((error) => console.error('Playback failed:', error));
}
