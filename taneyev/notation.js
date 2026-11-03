// Draws the generated examples for one consonance chart with abcjs (loaded as
// the global ABCJS by charts.html). All the music comes from
// src/taneyev/examples.js; this file only turns it into notation and sound.

import { twoVoiceTune } from '../src/notation/abc.js';
import { intervalStrip, parallelChain } from '../src/taneyev/examples.js';

const RENDER_OPTIONS = {
  add_classes: true,
  foregroundColor: 'currentColor', // follows the page's light or dark theme
  responsive: 'resize',
  wrap: { minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 8 },
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
  wrap.querySelector('button').addEventListener('click', () => play(tune));
}

let current = null;
let audioContext = null;

/**
 * Plays one tune, stopping whatever was playing.
 * The audio context is created and resumed inside the click itself, before any
 * await, because Safari only allows sound to start from a user gesture.
 */
function play(tune) {
  if (!ABCJS.synth.supportsAudio()) return;
  audioContext ??= new AudioContext();
  audioContext.resume();
  if (current) current.stop();
  const synth = new ABCJS.synth.CreateSynth();
  current = synth;
  // abcjs 6.4.4 reads options.swing in prime(), so options must be an object.
  synth.init({ visualObj: tune, audioContext, options: {} })
    .then(() => synth.prime())
    .then(() => synth.start())
    .catch((error) => console.error('Playback failed:', error));
}

/** Every original interval as a dyad, then the same dyads after the shift. */
function renderStrip(parent, jv) {
  const strip = intervalStrip(jv);
  const color = (measure) => KIND_COLORS[strip[measure].kind];
  const original = strip.map((d) => ({ ...d.original, textI: d.m }));
  show(block(parent, 'Original', 'Voice II holds middle C; the number above is the interval m.'),
    twoVoiceTune(original), color);
  if (jv === 0) return;
  const derivative = strip.map((d) => ({ ...d.derivative, textI: minus(d.n) }));
  show(block(parent, `After shifting voice I by ${minus(jv)}`,
    'Same colours as the chart: each note keeps the class of its original interval.'),
  twoVoiceTune(derivative), color);
}

/** Parallel 3rds, 6ths and 10ths, before and after the shift. */
function renderChains(parent, jv) {
  for (const [m, label] of [[2, '3rds'], [5, '6ths'], [9, '10ths']]) {
    const chain = parallelChain(m, jv);
    const dyads = [
      ...chain.original.map((d, k) => ({ ...d, textI: k === 0 ? 'original' : undefined })),
      ...chain.derivative.map((d, k) => ({ ...d, textI: k === 0 ? 'shifted' : undefined })),
    ];
    dyads[chain.original.length - 1].doubleBarAfter = true;
    const color = (measure) => (measure < chain.original.length || chain.survives
      ? 'var(--ink)' : 'var(--no)');
    show(block(parent, `Parallel ${label} → ${chain.verdict}`), twoVoiceTune(dyads), color);
  }
}

/** Fills a chart's notation panel. */
export function renderNotation(parent, jv) {
  renderStrip(parent, jv);
  if (jv !== 0) renderChains(parent, jv);
}
