// Draws and plays the three-voice example for one split of the outer shift,
// with abcjs (loaded as the global ABCJS by three-voices.html). All the music
// comes from src/taneyev/three-voice-pick.js: strict first species, or mixed
// species with suspensions and passing tones when that finds nothing. This
// file only turns it into notation and sound.

import { voicesTune } from '../src/notation/abc.js';
import { block, show } from '../src/notation/playback.js';
import { RHYTHM } from '../src/taneyev/three-voice-species.js';
import { KIND } from '../src/taneyev/three-voice-pick.js';
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

/** Returns the score: original, a bar's rest, shifted, with each version labeled over its first bar. */
function score(original, shifted) {
  const label = (bars, text) => bars.map((bar, k) => ({ ...bar, text: k === 0 ? text : undefined }));
  const first = label(original, 'original');
  first[first.length - 1].doubleBarAfter = true;
  return [...first, BAR_REST, ...label(shifted, 'shifted')];
}

/** Shows a strict first-species example. */
function showFirstSpecies(parent, example, split) {
  const title = 'First species, four bars in three voices: original ‖ shifted';
  show(block(parent, title, caption(split)), voicesTune(score(example.original, example.shifted), VOICES, { sortByPitch: false }));
}

/**
 * One version of a mixed-species example as abc measures: a voice with
 * [downbeat, upbeat] becomes two half notes, and a syncopated voice's upbeat
 * is tied to the next bar's downbeat when that bar has one.
 */
function halfNoteBars(bars, texture) {
  return bars.map((bar, k) => {
    const out = { ...bar };
    for (const v of ['upper', 'middle']) {
      if (!Array.isArray(bar[v])) continue;
      const tie = texture[v] === RHYTHM.SYNCOPATED && Array.isArray(bars[k + 1]?.[v]);
      const [down, up] = bar[v];
      out[v] = [{ step: down, length: '1/2' }, { step: up, length: '1/2', tie }];
    }
    return out;
  });
}

/** What each rhythm is called in a caption. */
const RHYTHM_NAMES = {
  [RHYTHM.HALVES]: 'moves in half notes (second species)',
  [RHYTHM.SYNCOPATED]: 'is syncopated (fourth species)',
};

/** Returns 'bar 2' or 'bars 2 and 3'. */
const barList = (bars) => (bars.length === 1 ? `bar ${bars[0]}` : `bars ${bars.slice(0, -1).join(', ')} and ${bars.at(-1)}`);

/** Returns the caption for a mixed-species example: which voice does what, and where the dissonances fall. */
function speciesCaption(example, split) {
  const parts = ['upper', 'middle']
    .filter((v) => example.texture[v] !== RHYTHM.WHOLE)
    .map((v) => `the ${v} voice ${RHYTHM_NAMES[example.texture[v]]}`);
  const dissonances = [];
  if (example.suspensions.length) dissonances.push(`suspensions in ${barList(example.suspensions)}`);
  if (example.passingTones.length) dissonances.push(`passing tones in ${barList(example.passingTones)}`);
  const where = dissonances.length ? ` It has ${dissonances.join(' and ')}.` : '';
  return `Strict first species has no example for this split, so here ${parts.join(' and ')}.${where} ${caption(split)}`;
}

/** Shows a mixed-species example (suspensions and passing tones). */
function showSpecies(parent, example, split) {
  const original = halfNoteBars(example.original, example.texture);
  const shifted = halfNoteBars(example.shifted, example.texture);
  const title = 'Mixed species, four bars in three voices: original ‖ shifted';
  show(block(parent, title, speciesCaption(example, split)), voicesTune(score(original, shifted), VOICES, { sortByPitch: false }));
}

/** The note shown when no example exists, even with suspensions and passing tones. */
const NO_EXAMPLE = '<p class="note">No four-bar example exists for this split on this starting note, even with suspensions and passing tones. Note against note, every interval in both versions must be a fixed consonance, and the three pairs share too few of them. A suspension lets a variable interval stand on a downbeat (the — marks on the charts) and a passing tone on an upbeat, but the voices still need a consonant chord, in both versions, wherever a suspension resolves, and this split has almost none.</p>';

/**
 * Fills a box with the example for a split: `found` is what exampleForSplit
 * returned (src/taneyev/three-voice-pick.js), or null for a note that none exists.
 */
export function renderThreeVoiceExample(parent, split, found) {
  parent.replaceChildren();
  if (!found) parent.innerHTML = NO_EXAMPLE;
  else if (found.kind === KIND.FIRST) showFirstSpecies(parent, found.example, split);
  else showSpecies(parent, found.example, split);
}
