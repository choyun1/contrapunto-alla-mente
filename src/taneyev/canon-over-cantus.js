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
//   step 5: the three sounding voices are checked together by canon-check.js
//           (consonance, forbidden parallels and hidden perfects, voices in
//           the chosen order and no more than a 10th apart).
// Of every proposta that passes, the smoothest is kept. Elaborating the
// framework with faster notes (step 7) is left to the composer.
//
// The search keeps, for each possible run of the last delay + 1 proposta
// notes, only the cheapest proposta so far: every check and cost below looks
// no further back than that, so nothing better is thrown away.

import { isConsonant, isPerfect, simple } from './rules.js';
import { propostaChoices } from './imaginary-cantus.js';
import { barProblems, chordAt } from './canon-check.js';
import { ORDERS, setupFor } from './canon-voices.js';

/** Cost of each melodic move: steps are cheapest, a repeated note is a last resort. */
const MOVE_COST = { 0: 4, 1: 0, 2: 1, 3: 2, 4: 3, 7: 4 };

/** Is the proposta, just extended to bar k, still correct up to bar k? */
const passesBar = (proposta, setup, bar) => barProblems(proposta, setup, bar).length === 0;

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
 * setup: from setupFor in canon-voices.js.
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
 * "work backwards" (video 4, 07:45): try each order of the voices, each size
 * of interval of entrance up to `widest` (a 15th, 14) and each delay up to
 * `longest` bars. Returns [{ order, size, delay }], easiest first: shortest
 * delay, then smallest interval.
 */
export function fittingSetups(cantus, { widest = 14, longest = 3 } = {}) {
  const found = [];
  for (let delay = 1; delay <= longest; delay += 1) {
    for (let size = 0; size <= widest; size += 1) {
      for (const order of ORDERS) {
        if (canonOverCantus(setupFor({ cantus, order, size, delay }))) found.push({ order, size, delay });
      }
    }
  }
  return found;
}
