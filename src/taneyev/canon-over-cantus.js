// A worked canon over a cantus firmus, note against note, found by search.
//
// Intervals are zero-indexed (unison 0, 5th 4, octave 7, 12th 11). Pitches are
// diatonic steps (common/diatonic.js). Every bar is one whole note.
//
// The search follows the steps of the imaginary-cantus method (Movable
// Counterpoint 4, 08:00–14:17):
//   step 3: each proposta note comes from propostaChoices, so it is consonant
//           with the cantus and with the imaginary cantus;
//   step 4: the risposta is copied from the proposta, `entry` steps higher and
//           `delay` bars later, and cut off at the last bar;
//   step 5: the three sounding voices are checked together (consonance,
//           forbidden parallels and hidden perfects, voices on their sides).
// Of every proposta that passes, the smoothest is kept. Elaborating the
// framework with faster notes (step 7) is left to the composer.
//
// The search keeps, for each possible run of the last delay + 1 proposta
// notes, only the cheapest proposta so far: every check and cost below looks
// no further back than that, so nothing better is thrown away.

import { isTritone } from '../common/diatonic.js';
import { isConsonant, isPerfect, simple } from './rules.js';
import { consecutivePerfects, similarIntoPerfect } from './canon.js';
import { isChordConsonance } from './three-voices.js';
import { propostaChoices, SIDE } from './imaginary-cantus.js';

/** Melodic moves the proposta may make, in steps: repeat, 2nd–5th, octave (Fux). */
const ALLOWED_MOVES = [0, 1, 2, 3, 4, 7];

/** Cost of each melodic move: steps are cheapest, a repeated note is a last resort. */
const MOVE_COST = { 0: 4, 1: 0, 2: 1, 3: 2, 4: 3, 7: 4 };

/** The three voices of bar k: { risposta, cantus, proposta }; risposta null before it enters. */
export function chordAt(proposta, { cantus, entry, delay }, bar) {
  const copied = proposta[bar - delay];
  return {
    risposta: copied === undefined ? null : copied + entry,
    cantus: cantus[bar],
    proposta: proposta[bar],
  };
}

/** The pairs of voices that sound in a chord, as [name, name]. */
function soundingPairs(chord) {
  const pairs = [['proposta', 'cantus']];
  if (chord.risposta !== null) pairs.push(['risposta', 'cantus'], ['risposta', 'proposta']);
  return pairs;
}

/**
 * Is one chord consonant? Each pair must be consonant and not a tritone. A
 * 4th is allowed between two voices that are both above the lowest-sounding
 * one (isChordConsonance; video 4, 10:23). No two voices share a note.
 */
export function goodChord(chord) {
  const sounding = Object.values(chord).filter((step) => step !== null);
  const lowest = Math.min(...sounding);
  return soundingPairs(chord).every(([a, b]) => {
    const upper = chord[a];
    const lower = chord[b];
    if (upper === lower || isTritone(upper, lower)) return false;
    const bothAboveLowest = Math.min(upper, lower) > lowest;
    return isChordConsonance(upper - lower, bothAboveLowest);
  });
}

/** The lowest- and highest-sounding voices of a chord, as [name, name]. */
function outerPair(chord) {
  const names = Object.keys(chord).filter((name) => chord[name] !== null);
  names.sort((a, b) => chord[b] - chord[a]);
  return [names[0], names.at(-1)];
}

/**
 * Does any pair move badly from one chord to the next? Forbidden for every
 * pair: two perfect consonances of the same size while both voices move
 * (canon.js). Forbidden for the outer voices only: similar motion into a
 * perfect consonance, a hidden 5th or octave (Fux, three-voice first species,
 * which lets the inner pairs have them).
 */
export function badMotion(before, after) {
  const [top, bottom] = outerPair(after);
  return soundingPairs(after).some(([a, b]) => {
    if (before[a] === null || before[b] === null) return false;
    const first = before[a] - before[b];
    const second = after[a] - after[b];
    const moveA = after[a] - before[a];
    const moveB = after[b] - before[b];
    if (consecutivePerfects(first, second, moveA !== 0 && moveB !== 0)) return true;
    const isOuter = [a, b].includes(top) && [a, b].includes(bottom);
    return isOuter && similarIntoPerfect(moveA, moveB, second);
  });
}

/** Does the risposta stay on its own side of the proposta (above for a positive entry)? */
function keepsSide(chord, entry) {
  if (chord.risposta === null || entry === 0) return true;
  return Math.sign(chord.risposta - chord.proposta) === Math.sign(entry);
}

/** Is a melodic move singable: an allowed size and not a tritone? */
function goodMove(from, to) {
  return ALLOWED_MOVES.includes(Math.abs(to - from)) && !isTritone(from, to);
}

/** Is the proposta, just extended to bar k, still correct up to bar k? */
function passesBar(proposta, setup, bar) {
  if (bar > 0 && !goodMove(proposta[bar - 1], proposta[bar])) return false;
  const chord = chordAt(proposta, setup, bar);
  if (!goodChord(chord) || !keepsSide(chord, setup.entry)) return false;
  return bar === 0 || !badMotion(chordAt(proposta, setup, bar - 1), chord);
}

/** Extra cost for melodic habits Fux avoids: back-and-forth, two leaps the same way. */
function contourCost(proposta, bar) {
  if (bar < 2) return 0;
  const before = proposta[bar - 1] - proposta[bar - 2];
  const after = proposta[bar] - proposta[bar - 1];
  let cost = 0;
  if (proposta[bar] === proposta[bar - 2] && after !== 0) cost += 2;
  if (Math.abs(before) > 1 && Math.abs(after) > 1 && Math.sign(before) === Math.sign(after)) cost += 3;
  return cost;
}

/**
 * Fux begins on a perfect consonance with the cantus and ends on an octave or
 * unison with its final; charge for anything else.
 */
function edgeCost(proposta, setup, bar) {
  const interval = proposta[bar] - setup.cantus[bar];
  if (bar === 0) return isConsonant(interval) && isPerfect(interval) ? 0 : 3;
  if (bar === setup.cantus.length - 1) return simple(interval) === 0 ? 0 : 3;
  return 0;
}

/** The cost of adding bar k to the proposta. */
function barCost(proposta, setup, bar) {
  const move = bar === 0 ? 0 : MOVE_COST[Math.abs(proposta[bar] - proposta[bar - 1])];
  return move + contourCost(proposta, bar) + edgeCost(proposta, setup, bar);
}

/** The key the search keeps one proposta for: its last delay + 1 notes. */
const tailKey = (proposta, delay) => proposta.slice(-(delay + 1)).join(' ');

/**
 * The smoothest proposta over the cantus, or null if none exists.
 * setup: { cantus: [steps], entry, delay, side } as in imaginary-cantus.js.
 * Returns { proposta, risposta, chords } where risposta has null before it
 * enters and chords are the sounding { risposta, cantus, proposta } per bar.
 */
export function canonOverCantus(setup) {
  let best = new Map([['', { proposta: [], cost: 0 }]]);
  for (let bar = 0; bar < setup.cantus.length; bar += 1) {
    const next = new Map();
    for (const { proposta, cost } of best.values()) {
      for (const note of propostaChoices(setup, bar, { allowFourth: true })) {
        const longer = [...proposta, note];
        if (!passesBar(longer, setup, bar)) continue;
        const total = cost + barCost(longer, setup, bar);
        const key = tailKey(longer, setup.delay);
        if (!next.has(key) || total < next.get(key).cost) next.set(key, { proposta: longer, cost: total });
      }
    }
    best = next;
  }
  const winner = [...best.values()].sort((a, b) => a.cost - b.cost)[0];
  if (!winner) return null;
  const chords = setup.cantus.map((_, bar) => chordAt(winner.proposta, setup, bar));
  return { proposta: winner.proposta, risposta: chords.map((c) => c.risposta), chords };
}

/**
 * Every canon setup that has a whole-note solution over this cantus, for
 * "work backwards" (video 4, 07:45): try each interval of entrance from
 * −`widest` to `widest`, each delay up to `longest` bars, and the proposta on
 * each side of the cantus. Returns [{ entry, delay, side }], easiest first:
 * shortest delay, then smallest interval.
 */
export function fittingSetups(cantus, { widest = 14, longest = 3 } = {}) {
  const found = [];
  for (let delay = 1; delay <= longest; delay += 1) {
    for (let size = 0; size <= widest; size += 1) {
      const entries = size === 0 ? [0] : [size, 0 - size];
      for (const entry of entries) {
        for (const side of Object.values(SIDE)) {
          if (canonOverCantus({ cantus, entry, delay, side })) found.push({ entry, delay, side });
        }
      }
    }
  }
  return found;
}
