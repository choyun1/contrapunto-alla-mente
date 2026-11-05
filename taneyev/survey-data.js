// Reads the precomputed answer key for the three-voice page,
// data/three-voice-survey.json (made by `npm run build-survey`): for each
// starting note, every split of every total Jv that has a four-bar example,
// and whether it is first species or mixed species. Nothing is searched here.

const survey = await fetch(new URL('../data/three-voice-survey.json', import.meta.url)).then((r) => r.json());

/** Every split with an example from `start`: [{ total, split: { upper, lower }, kind }], in number order. */
export function examplesFrom(start) {
  const byStart = survey[start] ?? {};
  const all = Object.entries(byStart).flatMap(([kind, rows]) => rows.map(([total, upper, lower]) => ({ total, split: { upper, lower }, kind })));
  return all.sort((a, b) => a.total - b.total || b.split.upper - a.split.upper);
}

/** The kind of example ('first' or 'mixed') a split has from `start`, or null for none. */
export function kindFor(start, split) {
  const byStart = survey[start] ?? {};
  for (const [kind, rows] of Object.entries(byStart)) {
    if (rows.some(([, upper, lower]) => upper === split.upper && lower === split.lower)) return kind;
  }
  return null;
}
