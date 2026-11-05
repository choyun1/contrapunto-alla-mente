// Draws and plays the three-voice example for one split of the outer shift,
// with abcjs (loaded as the global ABCJS by three-voices.html). All the music
// comes from src/taneyev/three-voice-examples.js; this file only turns it into
// notation and sound.

import { voicesTune } from '../src/notation/abc.js';
import { block, show } from '../src/notation/playback.js';
import { threeVoiceExample } from '../src/taneyev/three-voice-examples.js';
import { pairShifts } from '../src/taneyev/three-voices.js';

/** The three staves, top to bottom as in the original. They keep this order after the shift, so crossings show. */
const VOICES = [
  { id: 'U', key: 'upper', textKey: 'text', name: 'Upper' },
  { id: 'M', key: 'middle', name: 'Middle' },
  { id: 'L', key: 'lower', name: 'Lower' },
];

/** A whole bar (4 beats) of silence between the original and the shifted version. */
const BAR_REST = { upper: null, middle: null, lower: null };

const minus = (n) => (n < 0 ? `−${-n}` : `+${n}`);

/** Returns the caption: how far each voice moves in the shifted version. */
function caption(split) {
  const { middleLower, upperLower } = pairShifts(split);
  return `The lower voice is the cantus firmus and stays put. In the shifted version the middle voice moves ${minus(middleLower)} and the upper voice ${minus(upperLower)}, so every pair shifts by its own J<sub>v</sub>.`;
}

/** Fills a box with the example for a split, the lower voice starting on `lowerStep`, or a note when none exists. */
export function renderThreeVoiceExample(parent, split, lowerStep) {
  parent.replaceChildren();
  const example = threeVoiceExample(split, { start: lowerStep });
  if (!example) {
    parent.innerHTML = '<p class="note">No four-bar example in strict first species exists for this split on this starting note: note against note, every interval in both versions must be a fixed consonance, and the three pairs share too few of them, or every way between them makes forbidden parallels. Later species can still use this split: variable intervals can stand on weak beats as passing or neighbour tones, or on downbeats as suspensions (the — marks on the charts).</p>';
    return;
  }
  const original = example.original.map((c, k) => ({ ...c, text: k === 0 ? 'original' : undefined }));
  const shifted = example.shifted.map((c, k) => ({ ...c, text: k === 0 ? 'shifted' : undefined }));
  original[original.length - 1].doubleBarAfter = true;
  const chords = [...original, BAR_REST, ...shifted];
  show(block(parent, 'First species, four bars in three voices: original ‖ shifted', caption(split)), voicesTune(chords, VOICES, { sortByPitch: false }));
}
