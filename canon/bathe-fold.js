// Bathe's canon table page: the animation that folds Bathe's 8 × 7 grid into
// Taneyev's seven rows. Each of the 56 cells is a box that moves between
// stages; CSS transitions do the motion (and are switched off for reduced
// motion). Display only: the cells and their Jv come from src/taneyev/bathe.js.
// Bathe's numbers are 1-indexed; Jv is zero-indexed.

import { PLACES, COURSES, batheTable, batheGuide, batheCell } from '../src/taneyev/bathe.js';
import { sign } from '../taneyev/chart-card.js';

const W = 62; // a cell's width, px
const H = 30; // a cell's height, px
const GAP = 4;
const LEFT = 70; // room for the row heads
const TOP = 34; // room for the column heads

/** The stages, in order: what the caption says, and where each cell goes. */
export const STAGES = [
  { caption: 'Bathe’s table as printed: rows are the course (the plain song’s move), columns the place (the canon’s interval), both counted from 1.' },
  { caption: 'Count both from 0 and subtract: J<sub>v</sub> = (place − 1) − (course − 1), within the octave. Cells with the same J<sub>v</sub> get the same color, and they run in diagonals.' },
  { caption: 'Slide each row so that cells with the same J<sub>v</sub> line up in one column. Every column holds the same cell eight times.' },
  { caption: 'Stack each column: the eight copies are one cell, so the 56 cells are only seven.' },
  { caption: 'Turn the seven into rows, one per J<sub>v</sub> from 0 to +6. In Taneyev’s numbers (from 0) each row keeps the intervals <i>m</i> whose shift <i>n</i> = <i>m</i> + J<sub>v</sub> is still consonant: the fixed consonances of that shift’s chart, as in the table below.' },
];

/** The pixel spot of grid slot (col, row). */
const spot = (col, row) => ({ x: LEFT + col * (W + GAP), y: TOP + row * (H + GAP) });

/** Where a cell sits at a stage, from its course row and place column. */
function placeAt(stage, row, col, jv) {
  if (stage <= 1) return spot(col, row);
  if (stage === 2) return spot(jv, row);
  if (stage === 3) { const s = spot(jv, 0); return { x: s.x + row * 1.5, y: s.y + row * 1.5 }; }
  const s = spot(0, jv);
  return { x: s.x + row * 1.5, y: s.y + row * 1.5 };
}

/** Taneyev's reading of one row, zero-indexed: each m that stays consonant, as m → m + Jv. */
function taneyevText(jv) {
  const fits = batheCell(jv + 1, 1).map((leader) => leader - 1);
  return `m → n: ${fits.map((m) => `${m} → ${m + jv}`).join(', ')}`;
}

/** Builds the boxes for the 56 cells and the heads, inside `box`. Returns the cell elements with their data. */
function build(box) {
  const table = batheTable();
  box.style.height = `${TOP + 8 * (H + GAP) + 10}px`;
  const heads = PLACES.map(({ up }, col) => `<div class="fold-head fold-col" style="left:${spot(col, 0).x}px;width:${W}px">${up}</div>`)
    .concat(COURSES.map(({ up }, row) => `<div class="fold-head fold-row" style="top:${spot(0, row).y}px;height:${H}px">${up}</div>`))
    .concat([0, 1, 2, 3, 4, 5, 6].map((jv) => `<div class="fold-head fold-jv" style="top:${spot(0, jv).y}px;height:${H}px">J<sub>v</sub> ${sign(jv)}</div>`))
    .concat([0, 1, 2, 3, 4, 5, 6].map((jv) => `<div class="fold-head fold-jv fold-tan" style="top:${spot(0, jv).y}px;left:${spot(1, 0).x + 8}px;height:${H}px">${taneyevText(jv)}</div>`));
  box.innerHTML = heads.join('');
  const cells = [];
  COURSES.forEach(({ up: course }, row) => PLACES.forEach(({ up: place }, col) => {
    const jv = batheGuide(place, course);
    const el = document.createElement('div');
    el.className = `fold-cell jvc${jv}`;
    el.style.width = `${W}px`;
    el.style.height = `${H}px`;
    el.style.zIndex = String(10 + 8 - row);
    el.innerHTML = `<span class="fold-num">${table[row][col].join(' ')}</span><span class="fold-jvtag">${sign(jv)}</span>`;
    box.append(el);
    cells.push({ el, row, col, jv });
  }));
  return cells;
}

/** Moves every cell to its place at `stage` and sets the box's stage class. */
function show(box, cells, stage) {
  box.dataset.stage = String(stage);
  for (const { el, row, col, jv } of cells) {
    const { x, y } = placeAt(stage, row, col, jv);
    el.style.transform = `translate(${x}px, ${y}px)`;
  }
}

/** Mounts the animation: the stage box, its caption and Back / Next / Play buttons. */
export function mountFold(root) {
  root.innerHTML = `<div class="fold-box"></div><p class="note fold-caption" aria-live="polite"></p>
    <div class="actions"><button type="button" data-go="back">Back</button> <button type="button" data-go="next">Next</button>
    <button type="button" data-go="play">Play the fold</button> <span class="note fold-count"></span></div>`;
  const box = root.querySelector('.fold-box');
  const cells = build(box);
  let stage = 0;
  let timer = null;
  const go = (to) => {
    stage = Math.max(0, Math.min(STAGES.length - 1, to));
    show(box, cells, stage);
    root.querySelector('.fold-caption').innerHTML = STAGES[stage].caption;
    root.querySelector('.fold-count').textContent = `${stage + 1} of ${STAGES.length}`;
  };
  const stop = () => { clearInterval(timer); timer = null; };
  root.querySelector('[data-go="back"]').onclick = () => { stop(); go(stage - 1); };
  root.querySelector('[data-go="next"]').onclick = () => { stop(); go(stage + 1); };
  root.querySelector('[data-go="play"]').onclick = () => {
    stop();
    go(0);
    timer = setInterval(() => (stage >= STAGES.length - 1 ? stop() : go(stage + 1)), 2200);
  };
  go(0);
}
