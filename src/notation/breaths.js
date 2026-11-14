// Playback shaping for breaths: a voice can take a breath at a given point,
// which cuts the note ending there a little short, so a small silence comes
// before the next note, as a singer or string player would breathe (Cho,
// 2026-11-14). Nothing is drawn and the written lengths are unchanged; only
// the sound changes.
//
// An example lists its breaths by voice, bar and beat:
//   breaths: { P: [[4, 1]], R: [[5, 1]] }   // after beat 1 of P's bar 4, R's bar 5
// Bars count from 1 and beats are quarter notes, counted from 1, so [4, 1]
// is the moment between beats 1 and 2 of bar 4.
//
// Like final-chord.js, it works on the note map abcjs makes just before it
// renders the sound: one list per voice of notes as { start, end, ... },
// times in whole notes. This holds no music theory.

/** How much silence a breath takes from the note before it, in whole notes (5/64, a bit over a sixteenth). */
export const BREATH = 5 / 64;

/** A quarter-note beat, in whole notes. */
const BEAT = 1 / 4;

/** How close two times must be to count as the same, in whole notes. */
const EPS = 1e-6;

/**
 * The breath times of each voice, in whole notes from the start, in the
 * order of `voiceIds` (the order abcjs makes its tracks in). `barLength` is
 * one bar in whole notes (1 in common time). Returns an array of arrays.
 */
export function breathTimes(breaths, voiceIds, barLength = 1) {
  return voiceIds.map((id) => (breaths?.[id] ?? []).map(([bar, beat]) => (bar - 1) * barLength + beat * BEAT));
}

/**
 * Shortens each note that ends at one of its voice's breath times by
 * BREATH, but never by more than half the note. Changes the note map in
 * place and returns it.
 */
export function breatheAt(voices, times) {
  voices.forEach((notes, index) => {
    for (const time of times[index] ?? []) {
      const note = notes.find((n) => Math.abs(n.end - time) < EPS);
      if (note) note.end -= Math.min(BREATH, (note.end - note.start) / 2);
    }
  });
  return voices;
}
