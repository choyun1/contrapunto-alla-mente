// Draws a small piano keyboard as SVG, with letter tags and lit keys.
// Display only: which keys to mark comes from the rules core. No finger
// marks on the keys (Cho, 2026-11-14: keep hand shapes off the keys).
// White keys span diatonic steps (src/common/diatonic.js); every key, white
// or black, is named by its pitch in semitones from C0 (C4 = 48), so tags and
// lit keys can sit on black keys too. Each key carries data-semitones, and a
// white key also data-step, so a page can tell which one was pressed.

import { letterOf, pitchName, semitonesOf } from '../common/diatonic.js';

const KEY_WIDTH = 30;
const KEY_HEIGHT = 130;
const BLACK_WIDTH = 18;
const BLACK_HEIGHT = KEY_HEIGHT * 0.6;
const HAS_BLACK_AFTER = ['C', 'D', 'F', 'G', 'A']; // a black key sits to the right of these

/** x of the left edge of the white key for `step`. */
const keyX = (step, low) => 1 + (step - low) * KEY_WIDTH;

/** The class for a key from `lit` (semitones to class), with its leading space, or ''. */
const litClass = (lit, semitones) => (lit.get(semitones) ? ` ${lit.get(semitones)}` : '');

/**
 * SVG for the white keys, with a C label under each C. `labels` maps a step
 * to a short text printed near the bottom of the key (the computer key that
 * plays it).
 */
function whiteKeys(low, high, lit, labels) {
  let svg = '';
  for (let step = low; step <= high; step += 1) {
    const x = keyX(step, low);
    const semitones = semitonesOf(step);
    svg += `<rect class="kb-white${litClass(lit, semitones)}" data-step="${step}" data-semitones="${semitones}" `
      + `x="${x}" y="1" width="${KEY_WIDTH}" height="${KEY_HEIGHT}"/>`;
    if (labels.has(step)) {
      svg += `<text class="kb-label" x="${x + KEY_WIDTH / 2}" y="${KEY_HEIGHT - 6}">${labels.get(step)}</text>`;
    }
    if (letterOf(step) === 'C') {
      svg += `<text class="kb-name" x="${x + KEY_WIDTH / 2}" y="${KEY_HEIGHT + 20}">${pitchName(step)}</text>`;
    }
  }
  return svg;
}

/** Every black key from `low` to `high`: [{ semitones, x }], x its left edge. */
function blackKeyList(low, high) {
  const keys = [];
  for (let step = low; step < high; step += 1) {
    if (HAS_BLACK_AFTER.includes(letterOf(step))) {
      keys.push({ semitones: semitonesOf(step) + 1, x: keyX(step + 1, low) - BLACK_WIDTH / 2 });
    }
  }
  return keys;
}

/** SVG for the black keys between the white ones. */
function blackKeys(low, high, lit) {
  return blackKeyList(low, high).map(({ semitones, x }) => `<rect class="kb-black${litClass(lit, semitones)}" `
    + `data-semitones="${semitones}" x="${x}" y="1" width="${BLACK_WIDTH}" height="${BLACK_HEIGHT}"/>`).join('');
}

/** Where a tag for `semitones` goes: { x, y } on its white key, or just below its black key; null off the keyboard. */
function tagPlace(semitones, low, high) {
  for (let step = low; step <= high; step += 1) {
    if (semitonesOf(step) === semitones) return { x: keyX(step, low) + KEY_WIDTH / 2, y: KEY_HEIGHT - 44 };
  }
  const black = blackKeyList(low, high).find((key) => key.semitones === semitones);
  return black ? { x: black.x + BLACK_WIDTH / 2, y: BLACK_HEIGHT + 18 } : null;
}

/**
 * SVG keyboard from step `low` to `high` (white keys).
 * tags: [{ semitones, text, kind }] drawn as letters on the keys (kind: 'r' or 'p');
 * options.lit: Map of semitones to a key color class ('kb-good', 'kb-bad', 'kb-on');
 * options.labels: Map of step to a label near the bottom of a white key.
 */
export function keyboard(low, high, tags = [], { lit = new Map(), labels = new Map() } = {}) {
  const width = (high - low + 1) * KEY_WIDTH + 2;
  const height = KEY_HEIGHT + 28;
  let svg = `<svg class="keyboard" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Keyboard">`;
  svg += whiteKeys(low, high, lit, labels) + blackKeys(low, high, lit);
  for (const tag of tags) {
    const place = tagPlace(tag.semitones, low, high);
    if (place) svg += `<text class="kb-tag ${tag.kind}" x="${place.x}" y="${place.y}">${tag.text}</text>`;
  }
  return `${svg}</svg>`;
}
