// Draws a small piano keyboard as SVG, with numbered finger marks on keys.
// Display only: which keys to mark comes from the rules core.
// Keys are diatonic steps (src/common/diatonic.js): white keys only are
// marked, since every step is a white key in C major.

import { letterOf, pitchName } from '../src/common/diatonic.js';

const KEY_WIDTH = 30;
const KEY_HEIGHT = 130;
const BLACK_WIDTH = 18;
const HAS_BLACK_AFTER = ['C', 'D', 'F', 'G', 'A']; // a black key sits to the right of these

/** x of the left edge of the white key for `step`. */
const keyX = (step, low) => 1 + (step - low) * KEY_WIDTH;

/** SVG for the white keys, with a C label under each C. */
function whiteKeys(low, high) {
  let svg = '';
  for (let step = low; step <= high; step += 1) {
    const x = keyX(step, low);
    svg += `<rect class="kb-white" x="${x}" y="1" width="${KEY_WIDTH}" height="${KEY_HEIGHT}"/>`;
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
 * marks: [{ step, finger, perfect }] drawn as numbered dots;
 * tags: [{ step, text, kind }] drawn as letters above the dots (kind: 'r' or 'p').
 */
export function keyboard(low, high, marks, tags = []) {
  const width = (high - low + 1) * KEY_WIDTH + 2;
  const height = KEY_HEIGHT + 28;
  let svg = `<svg class="keyboard" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Keyboard">`;
  svg += whiteKeys(low, high) + blackKeys(low, high);
  for (const mark of marks) {
    const cx = keyX(mark.step, low) + KEY_WIDTH / 2;
    const kind = mark.perfect ? 'perfect' : 'free';
    svg += `<circle class="kb-dot ${kind}" cx="${cx}" cy="${KEY_HEIGHT - 22}" r="11"/>`;
    svg += `<text class="kb-finger ${kind}" x="${cx}" y="${KEY_HEIGHT - 18}">${mark.finger}</text>`;
  }
  for (const tag of tags) {
    const cx = keyX(tag.step, low) + KEY_WIDTH / 2;
    svg += `<text class="kb-tag ${tag.kind}" x="${cx}" y="${KEY_HEIGHT - 44}">${tag.text}</text>`;
  }
  return `${svg}</svg>`;
}
