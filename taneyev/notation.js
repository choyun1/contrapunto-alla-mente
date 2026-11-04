// Draws the generated examples for one consonance chart with abcjs (loaded as
// the global ABCJS by charts.html). All the music comes from
// src/taneyev/examples.js and src/taneyev/first-species.js; this file only
// turns it into notation and sound.

import { twoVoiceTune } from '../src/notation/abc.js';
import { block, show } from '../src/notation/playback.js';
import { intervalStrip, parallelChain, intoSingingRange } from '../src/taneyev/examples.js';
import { firstSpeciesExample } from '../src/taneyev/first-species.js';

const KIND_COLORS = {
  'fixed-consonance': 'var(--fc-ink)',
  'variable-consonance': 'var(--vc-ink)',
  'variable-dissonance': 'var(--vd-ink)',
  'fixed-dissonance': 'var(--fd-ink)',
};

const minus = (n) => (n < 0 ? `−${-n}` : String(n));

/** Text over a dyad: "m = 0 → n = −7" on the first, "1 → −6" after that. */
function transitionLabel(dyad, first) {
  if (first) return `m = ${dyad.m} →\\nn = ${minus(dyad.n)}`; // abc text "\\n" is a line break
  return `${dyad.m} → ${minus(dyad.n)}`;
}

/**
 * Every original interval after the shift, labelled m→n. The original strip
 * is the same for every chart, so it is drawn only for Jv = 0.
 */
function renderStrip(parent, jv) {
  const strip = intervalStrip(jv);
  const color = (measure) => KIND_COLORS[strip[measure].kind];
  if (jv === 0) {
    const original = strip.map((d, k) => ({ ...d.original, textI: k === 0 ? `m = ${d.m}` : d.m }));
    show(block(parent, 'Every interval', 'Voice II holds middle C; the number above is the interval.'),
      twoVoiceTune(original), color);
    return;
  }
  const labelled = strip.map((d, k) => ({ ...d.derivative, textI: transitionLabel(d, k === 0) }));
  const derivative = intoSingingRange(labelled);
  show(block(parent, `Every interval after shifting voice I by ${minus(jv)}`,
    'Above each dyad: the original interval m → the derivative n. Colours match the chart.'),
  twoVoiceTune(derivative), color);
}

/** Parallel 3rds, 6ths and 10ths, before and after the shift. */
function renderChains(parent, jv) {
  for (const [m, label] of [[2, '3rds'], [5, '6ths'], [9, '10ths']]) {
    const chain = parallelChain(m, jv);
    const dyads = [
      ...chain.original.map((d, k) => ({ ...d, textI: k === 0 ? 'original' : undefined })),
      ...intoSingingRange(chain.derivative).map((d, k) => ({ ...d, textI: k === 0 ? 'shifted' : undefined })),
    ];
    dyads[chain.original.length - 1].doubleBarAfter = true;
    const color = (measure) => (measure < chain.original.length || chain.survives
      ? 'var(--ink)' : 'var(--no)');
    show(block(parent, `Parallel ${label} → ${chain.verdict}`), twoVoiceTune(dyads), color);
  }
}

/** Labels a version's dyads with its intervals: "original: 7" first, then just the numbers. */
function labelIntervals(dyads, intervals, name) {
  return dyads.map((d, k) => ({ ...d, textI: k === 0 ? `${name}: ${minus(intervals[k])}` : minus(intervals[k]) }));
}

/** A four-bar first-species phrase, then the same phrase after the shift. */
function renderFirstSpecies(parent, jv) {
  const example = firstSpeciesExample(jv);
  if (!example) return;
  const caption = 'Voice II is the cantus firmus. The numbers are the intervals: m in the original, n after the shift.';
  const original = labelIntervals(example.original, example.m, 'm');
  if (jv === 0) {
    show(block(parent, 'First species, four bars', caption), twoVoiceTune(original));
    return;
  }
  const derivative = labelIntervals(example.derivative, example.n, 'n');
  original[original.length - 1].doubleBarAfter = true;
  // Lift both halves together, so the cantus stays in one octave throughout.
  show(block(parent, 'First species, four bars: original ‖ shifted', caption),
    twoVoiceTune(intoSingingRange([...original, ...derivative])));
}

/** Fills a chart's notation panel. */
export function renderNotation(parent, jv) {
  renderFirstSpecies(parent, jv);
  renderStrip(parent, jv);
  if (jv !== 0) renderChains(parent, jv);
}
