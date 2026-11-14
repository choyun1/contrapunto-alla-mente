// Draws a small piano keyboard as SVG, with letter tags and lit keys.
// Display only: which keys to mark comes from the rules core. No finger
// marks on the keys (Cho, 2026-11-14: keep hand shapes off the keys).
// Keys are diatonic steps (src/common/diatonic.js): white keys only are
// marked, since every step is a white key in C major.

import { letterOf, pitchName } from '../common/diatonic.js';

const KEY_WIDTH = 30;
const KEY_HEIGHT = 130;
const BLACK_WIDTH = 18;
const HAS_BLACK_AFTER = ['C', 'D', 'F', 'G', 'A']; // a black key sits to the right of these

/** x of the left edge of the white key for `step`. */
const keyX = (step, low) => 1 + (step - low) * KEY_WIDTH;

/**
 * SVG for the white keys, with a C label under each C. `lit` maps a step to
 * a class that colors its key; `labels` maps a step to a short text printed
 * near the bottom of the key (the computer key that plays it).
 */
function whiteKeys(low, high, lit, labels) {
  let svg = '';
  for (let step = low; step <= high; step += 1) {
    const x = keyX(step, low);
    const kind = lit.get(step) ? ` ${lit.get(step)}` : '';
    svg += `<rect class="kb-white${kind}" data-step="${step}" x="${x}" y="1" width="${KEY_WIDTH}" height="${KEY_HEIGHT}"/>`;
    if (labels.has(step)) {
      svg += `<text class="kb-label" x="${x + KEY_WIDTH / 2}" y="${KEY_HEIGHT - 6}">${labels.get(step)}</text>`;
    }
    if (letterOf(step) === 'C') {
      svg += `<text class="kb-name" x="${x + KEY_WIDTH / 2}" y="${KEY_HEIGHT + 20}">${pitchName(step)}</text>`;
    }
  }
  return svg;
}

/** SVG for the black keys between the white ones. */
function blackKeys(low, high) {
  let svg = '';
  for (let step = low; step < high; step += 1) {
    if (!HAS_BLACK_AFTER.includes(letterOf(step))) continue;
    const x = keyX(step + 1, low) - BLACK_WIDTH / 2;
    svg += `<rect class="kb-black" x="${x}" y="1" width="${BLACK_WIDTH}" height="${KEY_HEIGHT * 0.6}"/>`;
  }
  return svg;
}

/**
 * SVG keyboard from step `low` to `high`.
 * tags: [{ step, text, kind }] drawn as letters on the keys (kind: 'r' or 'p').
 * options.lit: Map of step to a key color class ('kb-good', 'kb-bad', 'kb-on');
 * options.labels: Map of step to a label near the bottom of the key.
 * Each white key carries data-step, so a page can tell which one was clicked.
 */
export function keyboard(low, high, tags = [], { lit = new Map(), labels = new Map() } = {}) {
  const width = (high - low + 1) * KEY_WIDTH + 2;
  const height = KEY_HEIGHT + 28;
  let svg = `<svg class="keyboard" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Keyboard">`;
  svg += whiteKeys(low, high, lit, labels) + blackKeys(low, high);
  for (const tag of tags) {
    const cx = keyX(tag.step, low) + KEY_WIDTH / 2;
    svg += `<text class="kb-tag ${tag.kind}" x="${cx}" y="${KEY_HEIGHT - 44}">${tag.text}</text>`;
  }
  return `${svg}</svg>`;
}
