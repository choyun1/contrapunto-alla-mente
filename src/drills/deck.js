// A practice deck: picks the next prompt, favoring the ones you miss, and
// remembers your misses between visits. Not music theory: any drill can use it.
//
// Stats are { [key]: { seen, missed, weight } }. A miss raises a prompt's
// weight, a clean answer lowers it back toward 1, and prompts are drawn in
// proportion to their weight.

/** Weight a prompt starts with, and the lowest it goes. */
const BASE_WEIGHT = 1;

/** Added to a prompt's weight for each miss, and the most it can reach. */
const MISS_BOOST = 2;
const MAX_WEIGHT = 8;

/** A clean answer multiplies the weight by this, down to BASE_WEIGHT. */
const CLEAN_DECAY = 0.6;

/** One prompt's weight in the stats (BASE_WEIGHT if never seen). */
export const weightOf = (stats, key) => stats[key]?.weight ?? BASE_WEIGHT;

/**
 * One item from `items`, drawn in proportion to `weight(item)`.
 * `random` returns numbers in [0, 1), like Math.random.
 */
export function pickWeighted(items, weight, random = Math.random) {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let target = random() * total;
  for (const item of items) {
    target -= weight(item);
    if (target < 0) return item;
  }
  return items.at(-1);
}

/** New stats with one answer recorded for `key`: missed or clean. */
export function recordAnswer(stats, key, missed) {
  const old = stats[key] ?? { seen: 0, missed: 0, weight: BASE_WEIGHT };
  const weight = missed
    ? Math.min(MAX_WEIGHT, old.weight + MISS_BOOST)
    : Math.max(BASE_WEIGHT, old.weight * CLEAN_DECAY);
  return { ...stats, [key]: { seen: old.seen + 1, missed: old.missed + (missed ? 1 : 0), weight } };
}

/** Stats saved in this browser under `name`, or {} (also when storage is blocked). */
export function loadStats(name) {
  try {
    return JSON.parse(localStorage.getItem(`drills.${name}`)) ?? {};
  } catch {
    return {};
  }
}

/** Saves stats in this browser under `name`; does nothing when storage is blocked. */
export function saveStats(name, stats) {
  try {
    localStorage.setItem(`drills.${name}`, JSON.stringify(stats));
  } catch {
    // Private windows can block storage; the drill still works without it.
  }
}
