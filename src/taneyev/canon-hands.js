// Two-voice canon: the proposta's allowed moves as a hand shape and a chord.
//
// Intervals are zero-indexed, as everywhere in this project: unison 0, 3rd 2,
// 5th 4, 6th 5, octave 7. Pitches are diatonic steps (src/common/diatonic.js).
//
// The rule (Cho's handshape mnemonic, 2026-11-05). One delay after the
// proposta plays a note, the risposta plays that note moved by the interval of
// entrance. The proposta's next note must be consonant with it, so:
//
//   Put the thumb on the risposta's note. If the proposta is above, the right
//   hand covers unison, 3rd, 5th, 6th going up (C E G A from C). If it is
//   below, the left hand covers the same shape going down (C A F E from C).
//   At the unison either voice may be on top, so both hands count.
//
// Why there are always four note names: the voices sound n = entry − span
// (canon.js), and up to octaves the consonances are four names (unison, 3rd,
// 5th, 6th). The allowed spans are that set turned upside down and moved, which
// keeps its size. At the unison the two sides share unison, 3rd and 6th
// (inversion at the octave swaps 3rd and 6th) and differ in the 5th, so there
// are five names: every name except a step away.
//
// Why it is a chord: on the chain of thirds C E G B D F A (closed in a circle)
// the four consonances seen from one note are four neighbors in a row, so the
// allowed names always stack in thirds as a seventh chord (a ninth chord at
// the unison).
//
// Derived from the rules core, not quoted from Taneyev.

import { canonInterval } from './canon.js';
import { semitonesOf, letterOf } from '../common/diatonic.js';

/**
 * The hand shape, thumb first: the consonances counted from the risposta's
 * note toward the proposta. Thumb and middle finger are perfect.
 */
export const HAND = [
  { finger: 1, interval: 0, perfect: true }, // thumb: unison or octave
  { finger: 2, interval: 2, perfect: false }, // index: 3rd
  { finger: 3, interval: 4, perfect: true }, // middle: 5th
  { finger: 4, interval: 5, perfect: false }, // ring: 6th
];

/** Where the proposta sits against the risposta. */
export const SIDE = { ABOVE: 1, BELOW: -1 };

/** The risposta's note one delay after the proposta plays `from`. */
export const rispostaNote = (from, entry) => from + entry;

/** The sides the proposta may take: below when the risposta enters above, and both at the unison. */
export function propostaSides(entry) {
  if (entry > 0) return [SIDE.BELOW];
  if (entry < 0) return [SIDE.ABOVE];
  return [SIDE.BELOW, SIDE.ABOVE];
}

/** The keys one hand covers from the risposta's note: [{ step, finger, interval, perfect }]. */
export function handKeys(risposta, side) {
  return HAND.map((key) => ({ ...key, step: risposta + side * key.interval }));
}

/**
 * The proposta's consonant next notes for one canon, lowest first, with both
 * hands merged at the unison (they share the thumb).
 * Returns [{ step, finger, perfect, span, n }]: span is the move from `from`,
 * n the interval between the voices (canon.js).
 */
export function handMoves(from, entry) {
  const risposta = rispostaNote(from, entry);
  const byStep = new Map();
  for (const side of propostaSides(entry)) {
    for (const key of handKeys(risposta, side)) {
      if (!byStep.has(key.step)) byStep.set(key.step, key);
    }
  }
  return [...byStep.values()]
    .map((key) => ({ step: key.step, finger: key.finger, perfect: key.perfect,
      span: key.step - from, n: canonInterval(key.step - from, entry) }))
    .sort((a, b) => a.step - b.step);
}

/**
 * The same note names stacked in thirds, root first: a seventh chord, or a
 * ninth chord at the unison. The risposta's note is the chord's 5th when the
 * proposta is below, its 3rd when the proposta is above, and the middle note
 * of the ninth chord at the unison.
 */
export function stackedChord(from, entry) {
  const risposta = rispostaNote(from, entry);
  const root = entry < 0 ? risposta - 2 : risposta - 4;
  const size = entry === 0 ? 5 : 4;
  return Array.from({ length: size }, (_, k) => root + 2 * k);
}

// Chord quality from the semitones above the root of its 3rd, 5th and 7th.
const SEVENTH_QUALITY = {
  '4,7,11': 'maj7',
  '4,7,10': '7',
  '3,7,10': 'm7',
  '3,6,10': 'ø7',
};

// Ninth-chord names: the seventh quality, then the 9th's semitones above the root.
const NINTH_NAME = {
  'maj7,14': 'maj9',
  '7,14': '9',
  'm7,14': 'm9',
  'm7,13': 'm7♭9',
  'ø7,13': 'ø7♭9',
};

/** A chord symbol for a stackedChord in C major, e.g. "Fmaj7", "Am7", "G9". */
export function chordSymbol(steps) {
  const above = steps.map((step) => semitonesOf(step) - semitonesOf(steps[0]));
  const seventh = SEVENTH_QUALITY[above.slice(1, 4).join(',')];
  const quality = steps.length === 5 ? NINTH_NAME[`${seventh},${above[4]}`] : seventh;
  return `${letterOf(steps[0])}${quality}`;
}

/** Note names the proposta may reach from `from` in one canon, e.g. ['C', 'E', 'G', 'B']. */
export function moveNames(from, entry) {
  const names = handMoves(from, entry).map((move) => letterOf(move.step));
  return [...new Set(names)];
}

/**
 * For a risposta above at simple interval `size` (1–7), the simple interval
 * below that gives the same note names, from any starting note. The two always
 * stack to a 10th or a 3rd (inversion at the 10th).
 */
export function sameNamesBelow(size) {
  const above = moveNames(0, size).sort().join();
  for (let below = 1; below <= 7; below += 1) {
    if (moveNames(0, -below).sort().join() === above) return below;
  }
  return null;
}
