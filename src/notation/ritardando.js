// A playback-only ritardando: a slight, gradual slowing through one bar,
// heard but not drawn (Cho, 2026-11-14, IC p. 19).
//
// It stretches time in the note map abcjs makes just before it renders the
// sound (as final-chord.js and breaths.js do), so every voice slows together,
// long notes included. Through the bar the tempo falls in a straight line
// from the starting tempo to SLOWEST of it; after the bar it stays there, for
// the final chord. Times are in whole notes. This holds no music theory.
//
// An example asks for one with `ritardando: 8`, the bar to slow through,
// counted from 1, in common time.

/** The tempo at the end of the ritardando, as a share of the starting tempo. */
export const SLOWEST = 0.85;

/**
 * A function from written time to played time, for a ritardando from
 * `from` to `to` (whole notes). Written time t is played at a tempo of
 * r(t) = 1 − k·(t − from) of the original, so its played length is the
 * integral of 1 / r, which is −ln(r) / k. Returns the function.
 */
export function ritardandoTime(from, to, slowest = SLOWEST) {
  const k = (1 - slowest) / (to - from);
  return (t) => {
    if (t <= from) return t;
    const inside = Math.min(t, to) - from;
    const played = from - Math.log(1 - k * inside) / k;
    return t <= to ? played : played + (t - to) / slowest;
  };
}

/** The played-time function for a ritardando through `bar` (from 1), with bars `barLength` whole notes long. */
export function ritardandoInBar(bar, barLength = 1, slowest = SLOWEST) {
  return ritardandoTime((bar - 1) * barLength, bar * barLength, slowest);
}

/** Moves every note's start and end to played time. Changes the note map in place and returns it. */
export function stretchNotes(voices, playedTime) {
  for (const notes of voices) {
    for (const note of notes) {
      note.start = playedTime(note.start);
      note.end = playedTime(note.end);
    }
  }
  return voices;
}
