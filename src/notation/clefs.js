// Picks clefs so whole-note examples stay off long stacks of ledger lines.
// Pitches are diatonic steps (C4 = 28; see src/common/diatonic.js).

/** Bottom and top staff lines of each clef, as diatonic steps. */
export const CLEFS = {
  treble: { bottom: 30, top: 38 }, // E4 to F5
  alto: { bottom: 24, top: 32 }, // F3 to G4
  bass: { bottom: 18, top: 26 }, // G2 to A3
};

/** Cost of one clef change, in ledger lines saved. */
const SWITCH_COST = 3;

/** Small extra cost per note, so a tie goes to treble, then bass, then alto. */
const FAMILIARITY = { treble: 0, bass: 0.1, alto: 0.5 };

/** Number of ledger lines a pitch needs in a clef (C4 in treble → 1). */
export function ledgerLines(step, clef) {
  const { bottom, top } = CLEFS[clef];
  if (step < bottom) return Math.floor((bottom - step) / 2);
  if (step > top) return Math.floor((step - top) / 2);
  return 0;
}

/** Cost of writing one note in a clef. */
const noteCost = (step, clef) => ledgerLines(step, clef) + FAMILIARITY[clef];

/**
 * One clef per note of a voice, keeping ledger lines and clef changes few.
 * Finds the cheapest sequence over all clef choices (a shortest path, one
 * column per note), where each note costs its ledger lines and each change
 * costs SWITCH_COST.
 */
export function clefsForVoice(steps) {
  const names = Object.keys(CLEFS);
  // best[k][clef] = { cost, previous clef } of the cheapest path ending there.
  const best = [Object.fromEntries(names.map((c) => [c, { cost: noteCost(steps[0], c), from: null }]))];
  for (let k = 1; k < steps.length; k++) {
    const column = {};
    for (const clef of names) {
      let choice = null;
      for (const prev of names) {
        const cost = best[k - 1][prev].cost + (prev === clef ? 0 : SWITCH_COST);
        if (!choice || cost < choice.cost) choice = { cost, from: prev };
      }
      column[clef] = { cost: choice.cost + noteCost(steps[k], clef), from: choice.from };
    }
    best.push(column);
  }
  // Walk back from the cheapest final clef.
  let clef = names.reduce((a, b) => (best.at(-1)[b].cost < best.at(-1)[a].cost ? b : a));
  const clefs = [];
  for (let k = steps.length - 1; k >= 0; k--) {
    clefs.unshift(clef);
    clef = best[k][clef].from;
  }
  return clefs;
}
