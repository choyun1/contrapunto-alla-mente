// Bathe's canon table page: Cho's 0–6 wheel (IC p. 27), beside the fold.
// The seven steps sit around a circle, counted mod 7 and zero-indexed. The
// inner dots are the consonances above the plain song (0 2 4 5); the outer
// ring is the same set turned back by Jv. Where both are marked is one cell of
// Bathe's table. Display only: the marks come from wheel() in
// src/taneyev/bathe.js.

import { wheel } from '../src/taneyev/bathe.js';
import { CONSONANT_STEPS } from '../src/taneyev/symmetry.js';
import { sign } from '../taneyev/chart-card.js';

const SIZE = 220; // the drawing's width and height, px
const MID = SIZE / 2;
const R_LABEL = 34; // radius of the step numbers
const R_INNER = 60; // radius of the consonances above the plain song
const R_OUTER = 86; // radius of the turned ring

/** The angle of corner m, in degrees clockwise from the top. */
const angle = (m) => (m * 360) / 7;

/** The x, y of corner m at radius r. */
function at(m, r) {
  const rad = ((angle(m) - 90) * Math.PI) / 180;
  return { x: MID + r * Math.cos(rad), y: MID + r * Math.sin(rad) };
}

/** The heptagon through the inner dots, as an SVG points list. */
const heptagon = () => [0, 1, 2, 3, 4, 5, 6].map((m) => { const p = at(m, R_INNER); return `${p.x},${p.y}`; }).join(' ');

/** The SVG: numbers, inner dots for the consonances, and the outer ring to turn. */
function svg() {
  const labels = [0, 1, 2, 3, 4, 5, 6].map((m) => {
    const p = at(m, R_LABEL);
    return `<g class="wh-corner" data-m="${m}"><circle cx="${p.x}" cy="${p.y}" r="11"/><text x="${p.x}" y="${p.y}">${m}</text></g>`;
  });
  const inner = CONSONANT_STEPS.map((m) => { const p = at(m, R_INNER); return `<circle class="wh-in" cx="${p.x}" cy="${p.y}" r="6"/>`; });
  const outer = CONSONANT_STEPS.map((m) => { const p = at(m, R_OUTER); return `<circle class="wh-out" cx="${p.x}" cy="${p.y}" r="7"/>`; });
  return `<svg class="wheel" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="The seven steps 0 to 6 around a circle">
    <polygon class="wh-line" points="${heptagon()}"/>${inner.join('')}
    <g class="wh-ring" style="transform-origin:${MID}px ${MID}px">${outer.join('')}</g>${labels.join('')}</svg>`;
}

/** The caption for one Jv: which corners both rings keep, and Bathe's cell. */
function caption(jv) {
  const both = wheel(jv).filter((c) => c.above && c.shifted).map((c) => c.m);
  const cell = both.map((m) => m + 1).join(' ');
  return `J<sub>v</sub> ${sign(jv)}: the outer ring is turned back ${jv} step${jv === 1 ? '' : 's'}. Both rings mark
    ${both.join(' ')} (from 0), so Bathe’s cell is ${cell} (from 1).`;
}

/** Turns the outer ring to `jv` and marks the corners both rings keep. */
function show(root, jv) {
  root.querySelector('.wh-ring').style.transform = `rotate(${-angle(jv)}deg)`;
  for (const { m, above, shifted } of wheel(jv)) {
    root.querySelector(`.wh-corner[data-m="${m}"]`).classList.toggle('wh-both', above && shifted);
  }
  for (const button of root.querySelectorAll('button[data-jv]')) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.jv) === jv));
  }
  root.querySelector('.wh-caption').innerHTML = caption(jv);
}

/** Mounts the wheel with one button per Jv, 0 to +6, starting at +3. */
export function mountWheel(root) {
  const buttons = [0, 1, 2, 3, 4, 5, 6].map((jv) => `<button type="button" data-jv="${jv}">${sign(jv)}</button>`).join(' ');
  root.innerHTML = `${svg()}<div class="wh-side"><div class="actions" aria-label="Jv">J<sub>v</sub> ${buttons}</div>
    <p class="note wh-caption" aria-live="polite"></p>
    <p class="note"><span class="wh-key-in">●</span> consonant above the plain song (<i>m</i>);
    <span class="wh-key-out">○</span> still consonant after the shift (<i>m</i> + J<sub>v</sub>);
    <span class="wh-key-both">green</span>: both, the cell.</p></div>`;
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-jv]');
    if (button) show(root, Number(button.dataset.jv));
  });
  show(root, 3);
}
