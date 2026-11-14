// The note-length picker for Continue the proposta in your own rhythm: buttons
// for whole to 16th, a dot, and a rest, also on the computer's number keys
// (1 whole, 2 half, 3 quarter, 4 eighth, 5 16th, period for the dot, 0 for a
// rest), and times and lengths in words. Display and input only; lengths are
// in whole notes, a bar of 4/4 each.

import { LENGTHS } from '../src/drills/continue-drill.js';

/** The plain note values, by number key. */
const VALUES = [
  { key: '1', length: 1, name: 'Whole' },
  { key: '2', length: 0.5, name: 'Half' },
  { key: '3', length: 0.25, name: 'Quarter' },
  { key: '4', length: 0.125, name: 'Eighth' },
  { key: '5', length: 0.0625, name: '16th' },
];

const picked = { length: 0.25, dotted: false };

/** The length the next note gets, in whole notes: the picked value, half again if dotted. */
export const pickedLength = () => (picked.dotted ? picked.length * 1.5 : picked.length);

/** Can a note of this length be written: a value the drill allows, that fits in `room`? */
const fits = (length, room) => LENGTHS.includes(length) && length <= room + 1e-9;

/**
 * Draws the picker into `box` for `room` whole notes left. A value too long
 * for the room is disabled; if the picked one no longer fits, the longest that
 * does is picked instead.
 */
export function drawLengths(box, room) {
  if (!fits(pickedLength(), room)) {
    picked.dotted = false;
    picked.length = VALUES.find((value) => fits(value.length, room))?.length ?? picked.length;
  }
  const buttons = VALUES.map((value) => {
    const on = value.length === picked.length ? ' aria-pressed="true"' : ' aria-pressed="false"';
    const off = fits(value.length, room) ? '' : ' disabled';
    return `<button type="button" class="plain" data-length="${value.length}"${on}${off}>${value.name} <kbd>${value.key}</kbd></button>`;
  });
  const dotOff = fits(picked.length * 1.5, room) ? '' : ' disabled';
  buttons.push(`<button type="button" class="plain" data-dot aria-pressed="${picked.dotted}"${dotOff}>Dotted <kbd>.</kbd></button>`);
  buttons.push('<button type="button" class="plain" data-rest>Rest <kbd>0</kbd></button>');
  box.innerHTML = buttons.join('');
}

/** Picks a plain value or toggles the dot; returns true if anything changed. */
function choose({ length, dot }) {
  if (dot) {
    picked.dotted = !picked.dotted;
  } else if (length) {
    picked.length = length; // a new value starts plain; the dot is added after it
    picked.dotted = false;
  } else {
    return false;
  }
  return true;
}

/**
 * Listens for the picker's buttons in `box` and the number keys. `onChange()`
 * runs after a new length is picked, `onRest()` when a rest is asked for;
 * `isOn()` says whether your own rhythm is in use.
 */
export function listenForLengths(box, { onChange, onRest, isOn }) {
  box.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.hasAttribute('data-rest')) onRest();
    else if (choose({ length: Number(button.dataset.length), dot: button.hasAttribute('data-dot') })) onChange();
  });
  document.addEventListener('keydown', (event) => {
    if (!isOn() || event.target.closest?.('input, select, textarea')) return;
    const value = VALUES.find((entry) => entry.key === event.key);
    const button = value ? box.querySelector(`[data-length="${value.length}"]`) : null;
    const dotOn = event.key === '.' && !box.querySelector('[data-dot]')?.disabled;
    if (event.key === '0') {
      onRest();
    } else if (dotOn || (button && !button.disabled)) {
      choose(dotOn ? { dot: true } : { length: value.length });
      onChange();
    }
  });
}

/** A time in a bar in words: "bar 4, beat 2", "bar 4, beat 2½", "bar 4, beat 2 (last 16th)". */
export function whereName(t) {
  const bar = Math.floor(t + 1e-9);
  const beats = (t - bar) * 4;
  const beat = Math.floor(beats + 1e-9) + 1;
  const rest = beats - (beat - 1);
  let part = '';
  if (Math.abs(rest - 0.5) < 1e-9) part = '½';
  else if (rest > 1e-9) part = rest < 0.5 ? ' (2nd 16th)' : ' (4th 16th)';
  return `bar ${bar + 1}, beat ${beat}${part}`;
}

/** Note values by length in whole notes. */
const NAMES = new Map([[1, 'whole note'], [0.75, 'dotted half'], [0.5, 'half note'], [0.375, 'dotted quarter'],
  [0.25, 'quarter'], [0.1875, 'dotted eighth'], [0.125, 'eighth'], [0.0625, '16th']]);

/** The note value of a length in words, e.g. "dotted quarter", or the length in whole notes. */
export const valueName = (length) => NAMES.get(length) ?? `${length} of a bar`;

/** Fractions of a beat as written. */
const FRACTION = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

/** A number of beats as written: 2, 1½, ¾. */
function beatsText(beats) {
  const whole = Math.floor(beats);
  return `${whole || ''}${FRACTION[beats - whole] ?? ''}`;
}

/** Room left in bars and beats, e.g. "2 bars and 1½ beats". */
export function roomName(room) {
  const bars = Math.floor(room + 1e-9);
  const beats = Math.round((room - bars) * 16) / 4;
  const parts = [];
  if (bars) parts.push(bars === 1 ? '1 bar' : `${bars} bars`);
  if (beats) parts.push(`${beatsText(beats)} beat${beats === 1 ? '' : 's'}`);
  return parts.join(' and ');
}
