// Notation and playback for generated examples, with abcjs (loaded as the
// global ABCJS by each page). Page code calls block() to make a titled box
// with a play button, then show() to draw abc into it. Only one example
// plays at a time.
//
// This runs only in the browser; it holds no music theory.

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

/** Renders abc into a block and wires its play button. */
export function show(wrap, abc, colorMeasure) {
  const [tune] = ABCJS.renderAbc(wrap.querySelector('.score'), abc, RENDER_OPTIONS);
  if (colorMeasure) {
    wrap.querySelectorAll('.abcjs-note').forEach((note) => {
      const measure = Number(note.getAttribute('class').match(/abcjs-mm(\d+)/)[1]);
      note.style.color = colorMeasure(measure);
    });
  }
  const button = wrap.querySelector('button');
  button.addEventListener('click', () => toggle(tune, button));
}

/** Quarter notes per minute on playback: 213 plays a whole note every 1.125 s. */
const PLAYBACK_QPM = 213;

/**
 * General MIDI program for playback, counted from 0: 52 is choir "aahs",
 * a sung vowel sound, softer than the church organ (19) used before.
 */
const CHOIR_AAHS = 52;

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
function toggle(tune, button) {
  const wasThisOne = current?.button === button;
  stop();
  if (!wasThisOne) play(tune, button);
}

/**
 * Plays one tune and turns its button into a stop button until it ends.
 * The audio context is created and resumed inside the click itself, before any
 * await, because Safari only allows sound to start from a user gesture.
 */
function play(tune, button) {
  if (!ABCJS.synth.supportsAudio()) return;
  audioContext ??= new AudioContext();
  audioContext.resume();
  const synth = new ABCJS.synth.CreateSynth();
  const playing = { synth, button, timer: null };
  current = playing;
  button.textContent = STOP_LABEL;
  // abcjs 6.4.4 reads options.swing in prime(), so options must be an object.
  // Tempo and instrument are set here, so no tempo or MIDI line is printed.
  synth.init({ visualObj: tune, audioContext, options: { qpm: PLAYBACK_QPM, program: CHOIR_AAHS } })
    .then(() => synth.prime())
    .then(({ duration }) => {
      if (current !== playing) return; // stopped while loading
      synth.start();
      playing.timer = setTimeout(stop, duration * 1000);
    })
    .catch((error) => console.error('Playback failed:', error));
}
