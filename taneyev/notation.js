// Draws the generated examples for one consonance chart with abcjs (loaded as
// the global ABCJS by charts.html). All the music comes from
// src/taneyev/examples.js and src/taneyev/first-species.js; this file only
// turns it into notation and sound.

import { twoVoiceTune } from '../src/notation/abc.js';
import { intervalStrip, parallelChain, intoSingingRange } from '../src/taneyev/examples.js';
import { firstSpeciesExample } from '../src/taneyev/first-species.js';

const RENDER_OPTIONS = {
  add_classes: true,
  foregroundColor: 'currentColor', // follows the page's light or dark theme
  responsive: 'resize',
  staffwidth: 640,
};

const KIND_COLORS = {
  'fixed-consonance': 'var(--fc-ink)',
  'variable-consonance': 'var(--vc-ink)',
  'variable-dissonance': 'var(--vd-ink)',
  'fixed-dissonance': 'var(--fd-ink)',
};

const minus = (n) => (n < 0 ? `−${-n}` : String(n));

/** A titled block with a play button and a box for the score. Returns the score box. */
function block(parent, title, caption) {
  const wrap = document.createElement('div');
  wrap.className = 'example';
  wrap.innerHTML = `<div class="example-head"><h3>${title}</h3><button type="button">▶ Play</button></div>
    <div class="score"></div>${caption ? `<p class="note">${caption}</p>` : ''}`;
  parent.append(wrap);
  return wrap;
}

/** Renders abc into a block and wires its play button. */
function show(wrap, abc, colorMeasure) {
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

/** Quarter notes per minute on playback: 320 plays a whole note every 0.75 s. */
const PLAYBACK_QPM = 320;

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
  // qpm 320 = one whole note every 0.75 s, set here so no tempo mark is printed.
  synth.init({ visualObj: tune, audioContext, options: { qpm: PLAYBACK_QPM } })
    .then(() => synth.prime())
    .then(({ duration }) => {
      if (current !== playing) return; // stopped while loading
      synth.start();
      playing.timer = setTimeout(stop, duration * 1000);
    })
    .catch((error) => console.error('Playback failed:', error));
}

/** Text over a dyad: "m = 0 → n = −7" on the first, "1 → −6" after that. */
function transitionLabel(dyad, first) {
  if (first) return `m = ${dyad.m} →\\nn = ${minus(dyad.n)}`; // abc text "\\n" is a line break
  return `${dyad.m} → ${minus(dyad.n)}`;
}

/**
 * Every original interval after the shift, labelled m→n. The original strip
 * is the same for every chart, so it is drawn only for Jv = 0.
 */
function renderStrip(parent, jv) {
  const strip = intervalStrip(jv);
  const color = (measure) => KIND_COLORS[strip[measure].kind];
  if (jv === 0) {
    const original = strip.map((d, k) => ({ ...d.original, textI: k === 0 ? `m = ${d.m}` : d.m }));
    show(block(parent, 'Every interval', 'Voice II holds middle C; the number above is the interval.'),
      twoVoiceTune(original), color);
    return;
  }
  const labelled = strip.map((d, k) => ({ ...d.derivative, textI: transitionLabel(d, k === 0) }));
  const derivative = intoSingingRange(labelled);
  show(block(parent, `Every interval after shifting voice I by ${minus(jv)}`,
    'Above each dyad: the original interval m → the derivative n. Colours match the chart.'),
  twoVoiceTune(derivative), color);
}

/** Parallel 3rds, 6ths and 10ths, before and after the shift. */
function renderChains(parent, jv) {
  for (const [m, label] of [[2, '3rds'], [5, '6ths'], [9, '10ths']]) {
    const chain = parallelChain(m, jv);
    const dyads = [
      ...chain.original.map((d, k) => ({ ...d, textI: k === 0 ? 'original' : undefined })),
      ...intoSingingRange(chain.derivative).map((d, k) => ({ ...d, textI: k === 0 ? 'shifted' : undefined })),
    ];
    dyads[chain.original.length - 1].doubleBarAfter = true;
    const color = (measure) => (measure < chain.original.length || chain.survives
      ? 'var(--ink)' : 'var(--no)');
    show(block(parent, `Parallel ${label} → ${chain.verdict}`), twoVoiceTune(dyads), color);
  }
}

/** Labels a version's dyads with its intervals: "original: 7" first, then just the numbers. */
function labelIntervals(dyads, intervals, name) {
  return dyads.map((d, k) => ({ ...d, textI: k === 0 ? `${name}: ${minus(intervals[k])}` : minus(intervals[k]) }));
}

/** A four-bar first-species phrase, then the same phrase after the shift. */
function renderFirstSpecies(parent, jv) {
  const example = firstSpeciesExample(jv);
  if (!example) return;
  const caption = 'Voice II is the cantus firmus. The numbers are the intervals: m in the original, n after the shift.';
  const original = labelIntervals(example.original, example.m, 'm');
  if (jv === 0) {
    show(block(parent, 'First species, four bars', caption), twoVoiceTune(original));
    return;
  }
  const derivative = labelIntervals(example.derivative, example.n, 'n');
  original[original.length - 1].doubleBarAfter = true;
  // Lift both halves together, so the cantus stays in one octave throughout.
  show(block(parent, 'First species, four bars: original ‖ shifted', caption),
    twoVoiceTune(intoSingingRange([...original, ...derivative])));
}

/** Fills a chart's notation panel. */
export function renderNotation(parent, jv) {
  renderFirstSpecies(parent, jv);
  renderStrip(parent, jv);
  if (jv !== 0) renderChains(parent, jv);
}
