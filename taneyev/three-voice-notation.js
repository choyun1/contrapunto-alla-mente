// Draws and plays the three-voice example for one split of the outer shift,
// with abcjs (loaded as the global ABCJS by three-voices.html). All the music
// comes from src/taneyev/three-voice-examples.js; this file only turns it into
// notation and sound.

import { voicesTune } from '../src/notation/abc.js';
import { block, show } from '../src/notation/playback.js';
import { octaveShiftFor } from '../src/notation/range.js';
import { threeVoiceExample } from '../src/taneyev/three-voice-examples.js';
import { pairShifts } from '../src/taneyev/three-voices.js';

/** The three staves, top to bottom as in the original. They keep this order after the shift, so crossings show. */
const VOICES = [
  { id: 'U', key: 'upper', textKey: 'text', name: 'Upper' },
  { id: 'M', key: 'middle', name: 'Middle' },
  { id: 'L', key: 'lower', name: 'Lower' },
];

/** Half a bar of silence between the original and the shifted version. */
const HALF_BAR_REST = { upper: null, middle: null, lower: null, length: '1/2' };

const minus = (n) => (n < 0 ? `−${-n}` : `+${n}`);

/** Every pitch in a list of chords, skipping rests. */
const pitchesOf = (chords) => chords
  .flatMap((c) => [c.upper, c.middle, c.lower])
  .filter((step) => step !== null);

/** Moves every voice of every chord by the same number of steps (rests stay rests). */
function moveAll(chords, shift) {
  const move = (step) => (step === null ? null : step + shift);
  return chords.map((c) => ({ ...c, upper: move(c.upper), middle: move(c.middle), lower: move(c.lower) }));
}

/** Returns the caption: how far each voice moves in the shifted version. */
function caption(split) {
  const { middleLower, upperLower } = pairShifts(split);
  return `The lower voice is the cantus firmus and stays put. In the shifted version the middle voice moves ${minus(middleLower)} and the upper voice ${minus(upperLower)}, so every pair shifts by its own J<sub>v</sub>.`;
}

/** Fills a box with the example for a split, or a note when none exists. */
export function renderThreeVoiceExample(parent, split) {
  parent.replaceChildren();
  const example = threeVoiceExample(split);
  if (!example) {
    parent.innerHTML = '<p class="note">No four-bar example exists for this split under the two-voice rules: the three pairs share too few fixed consonances, or every way between them makes forbidden parallels.</p>';
    return;
  }
  const original = example.original.map((c, k) => ({ ...c, text: k === 0 ? 'original' : undefined }));
  const shifted = example.shifted.map((c, k) => ({ ...c, text: k === 0 ? 'shifted' : undefined }));
  original[original.length - 1].doubleBarAfter = true;
  const chords = [...original, HALF_BAR_REST, ...shifted];
  // Move everything by the same octaves, so the cantus stays where it is.
  const placed = moveAll(chords, octaveShiftFor(pitchesOf(chords)));
  show(block(parent, 'Four bars in three voices: original ‖ shifted', caption(split)), voicesTune(placed, VOICES, { sortByPitch: false }));
}
