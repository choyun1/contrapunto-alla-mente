// The imaginary-cantus diagram at the head of the canon-over-a-cantus section:
// four rows of bars for a canon at the 5th above with a delay of one bar, and
// dotted lines for how one bar of P is checked. The rows are set so that the
// pairs checked together sit next to each other: R over CF, P over ICF
// Display only: it draws boxes and lines, and holds no rule. The method is
// the one on IC pp. 5 and 10 and in src/taneyev/imaginary-cantus.js.

const BARS = 6;
const BAR_WIDTH = 82;
const ROW_HEIGHT = 46;
const LEFT = 78; // room for the row names
const TOP = 16;
const FOCUS = 3; // the bar of P the lines follow, counted from 1

/** The rows top to bottom: name, and each bar's label (null for a bar not yet sounding). */
const ROWS = [
  { name: 'R', bars: (bar) => (bar === 1 ? null : `P${bar - 1} +5th`) },
  { name: 'CF', bars: (bar) => `CF${bar}` },
  { name: 'P', bars: (bar) => `P${bar}` },
  { name: 'ICF', bars: (bar) => (bar === BARS ? null : `CF${bar + 1} −5th`) },
];

/** The steps the dotted lines show, numbered as on the diagram. */
export const ICF_STEPS = [
  'Check P against the ICF under it, now.',
  'R copies P a bar later, a 5th up.',
  'So R against the CF was checked already, in step 1.',
  'That is because the ICF is the CF a bar early, a 5th down.',
];

const NUMBERS = '①②③④';

/** The x of a bar's left edge, counted from 1. */
const xOf = (bar) => LEFT + (bar - 1) * BAR_WIDTH;

/** The y of a row's middle, counted from 0. */
const yOf = (row) => TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2;

/** One bar's box with its label, highlighted when `focus`. */
function box(row, bar, label, focus) {
  const x = xOf(bar) + 4;
  const y = yOf(row) - 15;
  const cls = focus ? 'icf-box icf-focus' : 'icf-box';
  return `<rect class="${cls}" x="${x}" y="${y}" width="${BAR_WIDTH - 8}" height="30" rx="5"/>`
    + `<text class="icf-label" x="${x + (BAR_WIDTH - 8) / 2}" y="${y + 19}">${label}</text>`;
}

/** A dotted line from (x1, y1) to (x2, y2), with its number (from 1) set at (x, y). */
function link([x1, y1, x2, y2], number, [x, y]) {
  const label = `<text class="icf-number" x="${x}" y="${y}">${NUMBERS[number - 1]}</text>`;
  return `<line class="icf-link" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${label}`;
}

/** The middle of a bar, and the gap between it and the next, in x. */
const middleOf = (bar) => xOf(bar) + BAR_WIDTH / 2;
const gapAfter = (bar) => xOf(bar + 1);

/** The top and bottom edges of a row's boxes, in y. */
const topOf = (row) => yOf(row) - 15;
const bottomOf = (row) => yOf(row) + 15;

/** Is a row's bar one of the four the lines join? */
function isFocus(row, bar) {
  const name = ROWS[row].name;
  if (name === 'P' || name === 'ICF') return bar === FOCUS;
  return bar === FOCUS + 1;
}

/** The whole diagram, as an SVG string, with its numbered steps as a list after it. */
export function icfDiagram() {
  const width = LEFT + BARS * BAR_WIDTH + 10;
  const height = TOP + ROWS.length * ROW_HEIGHT + 10;
  const parts = [];
  ROWS.forEach((row, index) => {
    parts.push(`<text class="icf-name" x="${LEFT - 10}" y="${yOf(index) + 5}">${row.name}</text>`);
    for (let bar = 1; bar <= BARS; bar++) {
      const label = row.bars(bar);
      if (label) parts.push(box(index, bar, label, isFocus(index, bar)));
    }
  });
  const [R, CF, P, ICF] = [0, 1, 2, 3];
  const gap = gapAfter(FOCUS); // the diagonals pass through the gap between the two bars
  parts.push(link([middleOf(FOCUS), bottomOf(P), middleOf(FOCUS), topOf(ICF)], 1, [middleOf(FOCUS) + 6, yOf(P) + 26]));
  parts.push(link([gap - 6, topOf(P), gap + 6, bottomOf(R)], 2, [gap - 20, yOf(R) + 28]));
  parts.push(link([middleOf(FOCUS + 1), bottomOf(R), middleOf(FOCUS + 1), topOf(CF)], 3, [middleOf(FOCUS + 1) + 6, yOf(R) + 28]));
  parts.push(link([gap + 6, bottomOf(CF), gap - 6, topOf(ICF)], 4, [gap + 8, yOf(P) + 26]));
  const svg = `<svg class="icf-diagram" viewBox="0 0 ${width} ${height}" role="img" `
    + 'aria-label="Rows R, CF, P and ICF by bar, with dotted lines for the four steps listed below">'
    + `${parts.join('')}</svg>`;
  const steps = ICF_STEPS.map((step, i) => `<li><span class="icf-number">${NUMBERS[i]}</span> ${step}</li>`).join('');
  return `${svg}<ul class="icf-steps">${steps}</ul>`;
}
