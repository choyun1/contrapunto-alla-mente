// Playback shaping for long notes. Each recorded note in the site's
// soundfont (abcjs's default, FluidR3) lasts only about 3.2 seconds, so a
// note held longer than that falls silent before its end. That happened to
// the held final notes in canons whose voices enter two or more bars apart
// (Cho, 2026-11-14): the voice that finishes first holds for several bars.
//
// A note longer than MAX_NOTE_SECONDS is played as a few equal, tied
// restrikes of the same pitch, like a string player's bow changes, so it
// sounds all the way through. Nothing changes in the score.
//
// It works on the note map abcjs makes just before it renders the sound:
// one list per voice of notes as { start, end, ... }, times in whole notes.
// This holds no music theory.

/** The longest a note may sound before it is restruck, in seconds (the samples last about 3.2). */
export const MAX_NOTE_SECONDS = 2.8;

/**
 * Splits every note longer than `maxLength` (whole notes) into the fewest
 * equal parts no longer than that, each a copy of the note. Changes the note
 * map in place and returns it.
 */
export function restrikeLongNotes(voices, maxLength) {
  for (const notes of voices) {
    const split = [];
    for (const note of notes) {
      const length = note.end - note.start;
      const parts = Math.ceil(length / maxLength - 1e-9);
      if (parts <= 1) { split.push(note); continue; }
      for (let i = 0; i < parts; i += 1) {
        split.push({ ...note, start: note.start + (length * i) / parts, end: note.start + (length * (i + 1)) / parts });
      }
    }
    notes.splice(0, notes.length, ...split);
  }
  return voices;
}
