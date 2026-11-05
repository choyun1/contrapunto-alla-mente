// The shift as a 3D motion, under each chart: a seven-sided coin (one octave)
// and the interval helix (every register). Drag to turn the model.
//
// Each numbered label is an original interval m, colored by its kind in this
// chart (the same colors as the chart's bottom row). It carries its own
// suspension marks above and below. It moves by the motion symmetry.js gives
// it: a turn when the voices stay in order, a half-turn (flip) when they
// cross, so a flip puts the upper voice's mark underneath (§90). Where it
// lands, the slot shows the derivative's marks: compare top with top and
// bottom with bottom, and the stricter is the chart's rule (§128).

import { combine, baseMarks, intervalName, isConsonant } from '../src/taneyev/rules.js';
import { motion, landing, mirrorStep, rotationSteps, consonancesKept } from '../src/taneyev/symmetry.js';
import { TAU, STEP, onCircle, rotY, turnAboutLevelAxis, ease, camera, screenDirection } from './shift-geometry.js';

const UP = [0, 1, 0];
const RIM = 1.12; // where the labels ride on the coin
const SLOT = 1.48; // where the coin's fixed slots sit
const PITCH = 0.13; // helix rise per step
const HELIX_LOW = -12;
const HELIX_HIGH = 13;
const VIEWS = {
  coin: { yaw: 0.45, pitch: 1.15, distance: 7, focal: 1.7 },
  helix: { yaw: 0.6, pitch: 0.32, distance: 9.5, focal: 1.85 },
};
const KIND_TOKENS = {
  'fixed-consonance': ['--fc', '--fc-ink'],
  'variable-consonance': ['--vc', '--vc-ink'],
  'variable-dissonance': ['--vd', '--vd-ink'],
  'fixed-dissonance': ['--fd', '--fd-ink'],
};
const models = new Set();

/** Reads the site's color and font tokens, so the canvas follows the theme. */
function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  const kinds = {};
  for (const [kind, [bg, ink]] of Object.entries(KIND_TOKENS)) kinds[kind] = [v(bg), v(ink)];
  return { panel: v('--panel'), ink: v('--ink'), muted: v('--muted'), line: v('--line'), accent: v('--accent'), body: v('--body'), kinds };
}

/** A label's place and up direction on the coin at progress t. */
function coinPose(m, jv, t) {
  const start = onCircle(m, RIM);
  if (motion(m, jv) === 'flip') {
    const phi = (Math.PI * -jv) / 7;
    return { p: turnAboutLevelAxis(start, phi, Math.PI * t), up: turnAboutLevelAxis(UP, phi, Math.PI * t) };
  }
  return { p: rotY(start, rotationSteps(jv) * STEP * t), up: UP };
}

/** A point of the helix: interval n at its step angle and height. */
const helixPoint = (n) => onCircle(n, 1, n * PITCH);

/** A label's place on the helix: phase 0 slides it to n, phase 1 folds a crossed n up to |n|. */
function helixPose(m, jv, phase, t) {
  if (phase === 0) return { p: helixPoint(m + jv * t), up: UP };
  const end = helixPoint(m + jv);
  if (m + jv >= 0) return { p: end, up: UP };
  return { p: turnAboutLevelAxis(end, 0, Math.PI * t), up: turnAboutLevelAxis(UP, 0, Math.PI * t) };
}

/** Writes one line of text centered at (x, y). */
function text(ctx, words, x, y, { size = 12, weight = 400, color, font }) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(words, x, y);
}

/** Writes a pair of marks above and below a screen point, along the screen direction `dir` of "up". */
function marks(ctx, pal, pair, s, dir, gap, color) {
  text(ctx, pair.above, s[0] + dir[0] * gap, s[1] + dir[1] * gap, { size: 12, weight: 700, color, font: pal.body });
  text(ctx, pair.below, s[0] - dir[0] * gap, s[1] - dir[1] * gap, { size: 12, weight: 700, color, font: pal.body });
}

/** Draws one moving label: a disc in its kind's color, its number, and its own marks. */
function label(ctx, pal, project, m, jv, pose) {
  const s = project(pose.p);
  const [bg, ink] = pal.kinds[combine(m, [jv]).kind];
  ctx.beginPath();
  ctx.arc(s[0], s[1], 12, 0, TAU);
  ctx.fillStyle = bg;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  text(ctx, String(m), s[0], s[1] + 0.5, { size: 13, weight: 700, color: ink, font: pal.body });
  marks(ctx, pal, baseMarks(m), s, screenDirection(project, pose.p, pose.up), 22, pal.ink);
}

/** Draws a fixed coin slot: a dot (filled when consonant), its marks to the side, its name further out. */
function slot(ctx, pal, project, n) {
  const p = onCircle(n, SLOT);
  const s = project(p);
  const lit = isConsonant(n);
  ctx.beginPath();
  ctx.arc(s[0], s[1], lit ? 4.5 : 3.5, 0, TAU);
  ctx.fillStyle = lit ? pal.accent : pal.panel;
  ctx.strokeStyle = lit ? pal.accent : pal.muted;
  ctx.lineWidth = 1.25;
  ctx.fill();
  ctx.stroke();
  marks(ctx, pal, baseMarks(n), [s[0] + 18, s[1]], screenDirection(project, p, UP), 10, pal.muted);
  const out = project(onCircle(n, 1.9));
  text(ctx, intervalName(n), out[0], out[1], { size: 12, weight: lit ? 600 : 400, color: lit ? pal.ink : pal.muted, font: pal.body });
}

/** Draws the mirror's axis as a dashed level line at angle phi, height h. */
function axis(ctx, pal, project, phi, h, reach) {
  const a = project([reach * Math.cos(phi), h, reach * Math.sin(phi)]);
  const b = project([-reach * Math.cos(phi), h, -reach * Math.sin(phi)]);
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** The coin body's motion when all seven labels move alike; otherwise it stays still. */
function coinBody(jv, t) {
  const kinds = new Set([0, 1, 2, 3, 4, 5, 6].map((m) => motion(m, jv)));
  if (kinds.size > 1 || kinds.has('stay')) return (p) => p;
  if (kinds.has('flip')) return (p) => turnAboutLevelAxis(p, (Math.PI * -jv) / 7, Math.PI * t);
  return (p) => rotY(p, rotationSteps(jv) * STEP * t);
}

function drawCoin(ctx, pal, project, jv, t) {
  for (let n = 0; n < 7; n += 1) slot(ctx, pal, project, n);
  const move = coinBody(jv, t);
  const top = [0, 1, 2, 3, 4, 5, 6].map((n) => project(move(onCircle(n, 1, 0.07))));
  const bottom = [0, 1, 2, 3, 4, 5, 6].map((n) => project(move(onCircle(n, 1, -0.07))));
  const faces = [{ pts: bottom, face: true }, { pts: top, face: true }];
  for (let n = 0; n < 7; n += 1) faces.push({ pts: [top[n], top[(n + 1) % 7], bottom[(n + 1) % 7], bottom[n]], face: false });
  faces.forEach((f) => { f.depth = f.pts.reduce((sum, q) => sum + q[2], 0) / f.pts.length; });
  faces.sort((a, b) => a.depth - b.depth);
  for (const f of faces) {
    ctx.beginPath();
    f.pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
    ctx.closePath();
    ctx.fillStyle = f.face ? pal.line : pal.panel;
    ctx.globalAlpha = f.face ? 0.45 : 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = pal.muted;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (jv < 0) axis(ctx, pal, project, (Math.PI * -jv) / 7, 0, 1.35);
  const poses = [0, 1, 2, 3, 4, 5, 6].map((m) => ({ m, pose: coinPose(m, jv, t) }));
  poses.sort((a, b) => project(a.pose.p)[2] - project(b.pose.p)[2]);
  for (const { m, pose } of poses) label(ctx, pal, project, m, jv, pose);
}

function drawHelix(ctx, pal, project, jv, phase, t) {
  ctx.beginPath();
  for (let s = HELIX_LOW * 8; s <= HELIX_HIGH * 8; s += 1) {
    const q = project(helixPoint(s / 8));
    if (s === HELIX_LOW * 8) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
  }
  ctx.strokeStyle = pal.muted;
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let n = HELIX_LOW; n <= HELIX_HIGH; n += 1) {
    const q = project(helixPoint(n));
    ctx.beginPath();
    ctx.arc(q[0], q[1], isConsonant(n) ? 4 : 2.5, 0, TAU);
    ctx.fillStyle = isConsonant(n) ? pal.accent : pal.muted;
    ctx.fill();
    const name = n < 0 ? `${intervalName(-n)} ↓` : intervalName(n);
    const out = project(onCircle(n, 1.38, n * PITCH));
    text(ctx, name, out[0], out[1], { size: 10.5, color: pal.muted, font: pal.body });
  }
  if (phase === 1) axis(ctx, pal, project, 0, 0, 1.7);
  const ms = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const poses = ms.map((m) => ({ m, pose: helixPose(m, jv, phase, t) }));
  poses.sort((a, b) => project(a.pose.p)[2] - project(b.pose.p)[2]);
  for (const { m, pose } of poses) label(ctx, pal, project, m, jv, pose);
}

/** One sentence on the motion for this shift, in the chart's terms. */
export function describe(jv) {
  if (jv === 0) return 'Jv = 0 moves nothing: these are the reference marks every other chart compares against.';
  if (jv > 0) return `Every interval moves up ${jv} steps and the voices stay in order: a turn of the coin by ${rotationSteps(jv)} steps, a slide up the helix.`;
  const k = -jv;
  const where = `the axis through the ${intervalName(mirrorStep(jv))} (n becomes ${k} − n)`;
  const rest = k <= 9 ? ` From ${k} up the voices stay in order, so those intervals slide down ${k} steps instead.` : '';
  return `Intervals below ${k} cross, so they flip over ${where}.${rest} Consonances kept: ${consonancesKept(jv)} of 4.`;
}

/**
 * Builds one model inside `box` for shift jv: a canvas, plus a coin/helix
 * switch and a one-line description unless `bare` is set.
 * Returns { setJv, setModel, play } so a page can drive it.
 */
export function renderModel(box, jv, { model = 'coin', bare = false } = {}) {
  const bar = bare ? '' : `<div class="model-bar">
      <button type="button" data-model="coin" aria-pressed="${model === 'coin'}">Coin (one octave)</button>
      <button type="button" data-model="helix" aria-pressed="${model === 'helix'}">Helix (every register)</button>
      <button type="button" data-again>Play again</button></div>`;
  box.innerHTML = `${bar}<canvas aria-label="3D model of the shift"></canvas>${bare ? '' : '<p class="model-note"></p>'}`;
  const canvas = box.querySelector('canvas');
  const note = box.querySelector('.model-note');
  const ctx = canvas.getContext('2d');
  const state = { jv, model, phase: 0, t: 0, ...VIEWS[model] };
  let frame = 0;

  const draw = () => {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const project = camera({ ...state, focal: Math.min(width, height) * state.focal, width, height });
    const pal = palette();
    ctx.clearRect(0, 0, width, height);
    if (state.model === 'coin') drawCoin(ctx, pal, project, state.jv, ease(state.t));
    else drawHelix(ctx, pal, project, state.jv, state.phase, ease(state.t));
  };

  const play = () => {
    cancelAnimationFrame(frame);
    const durations = state.model === 'helix' ? [1600, 1300] : [1700];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      state.phase = durations.length - 1;
      state.t = 1;
      draw();
      return;
    }
    state.phase = 0;
    let start = performance.now();
    const tick = (now) => {
      state.t = Math.max(0, Math.min(1, (now - start) / durations[state.phase]));
      if (state.t >= 1 && state.phase < durations.length - 1) {
        state.phase += 1;
        state.t = 0;
        start = now + 350;
      }
      draw();
      if (state.phase < durations.length - 1 || state.t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };

  const setModel = (name) => {
    state.model = name;
    Object.assign(state, VIEWS[name]);
    box.querySelectorAll('[data-model]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.model === name)));
    play();
  };
  const setJv = (value) => {
    state.jv = value;
    canvas.setAttribute('aria-label', `3D model of the shift Jv = ${value}`);
    if (note) note.textContent = describe(value);
    play();
  };
  box.querySelectorAll('[data-model]').forEach((button) => button.addEventListener('click', () => setModel(button.dataset.model)));
  box.querySelector('[data-again]')?.addEventListener('click', play);

  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, yaw: state.yaw, pitch: state.pitch };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    state.yaw = drag.yaw + (e.clientX - drag.x) * 0.008;
    state.pitch = Math.max(-1.5, Math.min(1.5, drag.pitch - (e.clientY - drag.y) * 0.008));
    draw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });

  models.add(draw);
  setJv(jv);
  return { setJv, setModel, play };
}

// Redraw every model when the window or the theme changes.
window.addEventListener('resize', () => models.forEach((draw) => draw()));
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => models.forEach((draw) => draw()));
new MutationObserver(() => models.forEach((draw) => draw()))
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
