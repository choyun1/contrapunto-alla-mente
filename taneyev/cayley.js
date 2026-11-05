// How the charts fit together: the Cayley graph of the shift group (D7),
// drawn as a heptagonal prism you can turn. The top ring holds the seven
// shifts with the voices in order, the bottom ring the seven inversions.
// Solid edges are one step of shift, dashed edges the octave flip.
// Each chart on the page sits on one dot (octave pairs such as −11 and −4
// share a dot, since the graph counts modulo the octave).
//
// The group itself (element, compose, consonancesKept) lives in
// src/taneyev/symmetry.js; this file only draws it.

import { intervalName } from '../src/taneyev/rules.js';
import { element, compose, consonancesKept, ALL_ELEMENTS, word, tiName } from '../src/taneyev/symmetry.js';
import { TAU, onCircle, camera } from './shift-geometry.js';

const VIEW = { yaw: 0.35, pitch: 0.42, distance: 9, focal: 1.6 };
const RING = 1.3;
const LEVEL = 1.25; // height of the shift ring; the inversion ring sits at −LEVEL

const same = (x, y) => x.kind === y.kind && x.step === y.step;
const where = (e) => onCircle(e.step, RING, e.kind === 'turn' ? LEVEL : -LEVEL);

/** A representative Jv for a dot: the shift itself, or the inversion at the octave and above. */
const jvOf = (e) => (e.kind === 'turn' ? e.step : -(7 + e.step));

/** The dot's name in the charts' terms. */
function nameOf(e) {
  if (e.kind === 'turn') return e.step === 0 ? 'no shift (Jv = 0, T₀ = e)' : `a shift up a ${intervalName(e.step)} (${tiName(e)} = ${word(e)})`;
  return `inversion at the ${intervalName(7 + e.step)} (${tiName(e)} = ${word(e)})`;
}

/** The short label drawn beside a dot. */
const shortName = (e) => {
  if (e.kind === 'turn') return e.step === 0 ? '0' : `+${e.step}`;
  return `inv ${intervalName(7 + e.step)}`;
};

/** Reads the site's color and font tokens. */
function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  return { panel: v('--panel'), ink: v('--ink'), muted: v('--muted'), accent: v('--accent'), fc: v('--fc'), warm: v('--vc-ink'), body: v('--body') };
}

/** Draws the graph and returns the dots' screen positions, nearest last. */
function drawGraph(ctx, project, pal, picks, onPage) {
  for (const e of ALL_ELEMENTS) {
    const next = { kind: e.kind, step: (e.step + 1) % 7 };
    const edges = [{ to: next, flip: false }];
    if (e.kind === 'turn') edges.push({ to: { kind: 'flip', step: e.step }, flip: true });
    for (const edge of edges) {
      const a = project(where(e));
      const b = project(where(edge.to));
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.strokeStyle = edge.flip ? pal.warm : pal.accent;
      ctx.lineWidth = 1.5;
      ctx.setLineDash(edge.flip ? [5, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  const dots = ALL_ELEMENTS.map((e) => ({ e, s: project(where(e)) })).sort((x, y) => x.s[2] - y.s[2]);
  for (const { e, s } of dots) {
    const picked = picks.some((p) => same(p, e));
    ctx.beginPath();
    ctx.arc(s[0], s[1], 13, 0, TAU);
    ctx.fillStyle = onPage(e).length ? pal.fc : pal.panel;
    ctx.strokeStyle = picked ? pal.ink : e.kind === 'turn' ? pal.accent : pal.warm;
    ctx.lineWidth = picked ? 3 : 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.font = `700 11px ${pal.body}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = pal.ink;
    ctx.fillText(String(consonancesKept(jvOf(e))), s[0], s[1] + 0.5);
    ctx.font = `${picked ? 700 : 400} 12px ${pal.body}`;
    ctx.fillStyle = picked ? pal.ink : pal.muted;
    ctx.fillText(shortName(e), s[0], s[1] + (e.kind === 'turn' ? -22 : 24));
  }
  return dots;
}

/**
 * Builds the graph inside `box`. `jvs` are the shifts whose dots are filled; `href(jv)` links to one.
 * With `bare`, the long how-to-read note is left out (the docked model links to the guide instead).
 * Returns { highlight(jv) }, which picks that shift's dot as the first pick.
 */
export function renderCayley(box, jvs, href, { bare = false } = {}) {
  const help = bare ? '' : `<p class="model-note">Top ring: the seven shifts with the voices in order. Bottom ring: the seven inversions.
    Solid lines are one step of shift; dashed lines are the octave flip. The number on each dot is how many of
    the four consonances that shift keeps; filled dots hold shifts Taneyev works through. Drag to turn. Tap a dot, then
    another, to see what the two make together.</p>`;
  box.innerHTML = `<canvas aria-label="Cayley graph of the shifts: a heptagonal prism"></canvas>
    ${help}<p class="model-note" data-readout></p>`;
  const canvas = box.querySelector('canvas');
  const readout = box.querySelector('[data-readout]');
  const ctx = canvas.getContext('2d');
  const state = { ...VIEW, first: element(-7), second: element(-9), next: 'first', dots: [] };
  const onPage = (e) => jvs.filter((jv) => same(element(jv), e));

  const links = (e) => onPage(e).map((jv) => `<a href="${href(jv)}">${jv > 0 ? '+' : ''}${String(jv).replace('-', '−')}</a>`).join(', ') || 'none Taneyev works through';
  const describe = () => {
    if (!state.second) {
      readout.innerHTML = `In view: <b>${nameOf(state.first)}</b>, which keeps ${consonancesKept(jvOf(state.first))} of the
        four consonances (charts: ${links(state.first)}). Tap another dot to see what it makes after this one.`;
      return;
    }
    const made = compose(state.second, state.first);
    readout.innerHTML = `<b>${nameOf(state.second)}</b> after <b>${nameOf(state.first)}</b> makes
      <b>${nameOf(made)}</b> (charts: ${links(made)}). First pick’s charts: ${links(state.first)}.
      Second pick’s charts: ${links(state.second)}.`;
  };

  const draw = () => {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const project = camera({ ...state, focal: Math.min(width, height) * state.focal, width, height });
    ctx.clearRect(0, 0, width, height);
    state.dots = drawGraph(ctx, project, palette(), [state.first, state.second].filter(Boolean), onPage);
  };

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
  canvas.addEventListener('pointerup', (e) => {
    const tapped = drag && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5;
    drag = null;
    if (!tapped) return;
    const rect = canvas.getBoundingClientRect();
    const hit = [...state.dots].reverse()
      .find((d) => Math.hypot(d.s[0] - (e.clientX - rect.left), d.s[1] - (e.clientY - rect.top)) < 16);
    if (!hit) return;
    state[state.next] = hit.e;
    state.next = state.next === 'first' ? 'second' : 'first';
    describe();
    draw();
  });
  canvas.addEventListener('pointercancel', () => { drag = null; });

  window.addEventListener('resize', draw);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const highlight = (jv) => {
    state.first = element(jv);
    state.second = null;
    state.next = 'second';
    describe();
    draw();
  };
  describe();
  draw();
  return { highlight };
}

