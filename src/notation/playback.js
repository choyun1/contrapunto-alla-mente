// Notation and playback for generated examples, with abcjs (loaded as the
// global ABCJS by each page). Page code calls block() to make a titled box
// with a play button, then show() to draw abc into it. Only one example
// plays at a time.
//
// This runs only in the browser; it holds no music theory.

import { staffSpotAt } from './staff-click.js';
import { holdFinalNotes } from './final-chord.js';
import { breathTimes, breatheAt } from './breaths.js';
import { voiceIds } from './abc-read.js';
import { withRitardando } from './ritardando.js';

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
 * Renders abc into a block and wires the play button to `audioAbc`, which
 * may differ from what is drawn, played by a string trio (inStrings). Staff `silentVoice` (counted from 0, top
 * down), when given, is drawn in gray: the audio leaves it out, so it is seen
 * but not heard (the imaginary cantus). It plays at `tempo`, TEMPO.NOTEBOOK
 * unless an example asks for its own, with any `breaths` the example lists
 * (breaths.js) and a `ritardando` through the bar it names (ritardando.js). The
 * playback tune is made at the first click, so a page of many examples draws
 * only what it shows.
 */
export function showWithAudio(wrap, abc, audioAbc, { silentVoice, tempo = TEMPO.NOTEBOOK, breaths, ritardando } = {}) {
  const score = wrap.querySelector('.score');
  const [tune] = ABCJS.renderAbc(score, abc, { ...RENDER_OPTIONS, wrap: LINE_BREAKS });
  if (silentVoice !== undefined) {
    score.querySelectorAll(`.abcjs-v${silentVoice}`).forEach((element) => element.classList.add('silent-voice'));
  }
  const button = wrap.querySelector('button');
  const times = breathTimes(breaths, voiceIds(audioAbc));
  const shape = (voices) => holdFinalNotes(breatheAt(voices, times));
  const heard = ritardando ? withRitardando(audioAbc, ritardando, tempo) : audioAbc;
  button.addEventListener('click', () => toggle(audioTune(inStrings(heard)), button, STRINGS.treble, tempo, shape));
  return tune;
}

let audioBox = null; // the box that playback-only tunes are drawn into, inside an off-page holder

/**
 * A tune for playback only, drawn off the page: abcjs needs a drawn tune to
 * play, but this one is never seen. Each call reuses the box. abcjs makes the
 * box it draws into position: relative, so the box sits inside a holder that is
 * the one taken out of the page; drawing straight into the holder left a tall
 * empty space below the page (canon over a CF).
 */
function audioTune(abc) {
  if (!audioBox) {
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;left:-10000px;top:0;width:800px;height:0;overflow:hidden';
    holder.setAttribute('aria-hidden', 'true');
    audioBox = document.createElement('div');
    holder.append(audioBox);
    document.body.append(holder);
  }
  const [tune] = ABCJS.renderAbc(audioBox, abc, RENDER_OPTIONS);
  return tune;
}

/**
 * Playback tempos, in quarter notes per minute. Music examples play a whole
 * note every 1.125 s (213); the interval demonstrations over a held note play
 * one every 0.56 s (426), since each dyad is heard on its own. The notebook's
 * hand-written examples, busy with eighth notes, play at a bit over half the
 * example tempo (118), a whole note about every 2 s.
 */
export const TEMPO = {
  EXAMPLE: 213,
  NOTEBOOK: 118,
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

/**
 * The string trio the notebook plays in, by staff clef: violin for the
 * treble, viola for the alto and tenor, cello for the bass (General MIDI
 * 40–42). The flute's wide vibrato blurred the eighth notes.
 */
const STRINGS = { treble: 40, alto: 41, tenor: 41, bass: 42 };

/**
 * The abc with each voice set to its string instrument: a `%%MIDI program`
 * line ahead of the voice's first music line, chosen by the clef on its
 * `V:` header line.
 */
export function inStrings(abc) {
  const clefs = Object.fromEntries([...abc.matchAll(/^V:\s*(\S+).*?clef=(\w+)/gm)].map((m) => [m[1], m[2]]));
  const seen = new Set();
  return abc.split('\n').map((line) => {
    const id = /^\[V:\s*([^\]\s]+)\]/.exec(line)?.[1];
    if (!id || seen.has(id)) return line;
    seen.add(id);
    const program = STRINGS[clefs[id]] ?? STRINGS.treble;
    return `[V:${id}]\n%%MIDI program ${program}\n${line.replace(/^\[V:[^\]]+\]\s*/, '')}`;
  }).join('\n');
}

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
function toggle(tune, button, sound, tempo, shape) {
  const wasThisOne = current?.button === button;
  stop();
  if (!wasThisOne) play(tune, button, sound, tempo, shape);
}

/**
 * Plays one tune and turns its button into a stop button until it ends.
 * The audio context is created and resumed inside the click itself, before any
 * await, because Safari only allows sound to start from a user gesture.
 */
function play(tune, button, program, qpm, shape = holdFinalNotes) {
  if (!ABCJS.synth.supportsAudio()) return;
  audioContext ??= new AudioContext();
  audioContext.resume();
  const synth = new ABCJS.synth.CreateSynth();
  const playing = { synth, button, timer: null };
  current = playing;
  button.textContent = STOP_LABEL;
  // abcjs 6.4.4 reads options.swing in prime(), so options must be an object.
  // Tempo and instrument are set here, so no tempo or MIDI line is printed.
  // `shape` changes the notes just before they sound: by default, voices that
  // end early hold their last note to the end (final-chord.js).
  const options = { qpm, program, sequenceCallback: shape };
  synth.init({ visualObj: tune, audioContext, options })
    .then(() => synth.prime())
    .then(({ duration }) => {
      if (current !== playing) return; // stopped while loading
      synth.start();
      playing.timer = setTimeout(stop, duration * 1000);
    })
    .catch((error) => console.error('Playback failed:', error));
}
