// Playback shaping for breath marks. A breath is written as `!breath!y`
// between two notes: a breath mark on an abc spacer, so the comma is drawn
// between the notes, not over one of them. In playback the note before it is
// cut short, leaving a small silence, as a singer or string player would
// breathe (Cho, 2026-11-14). The written length is unchanged.
// (`!breath!` on a note itself, drawn above that note, also works.)
//
// Like final-chord.js, it works on the note map abcjs makes just before it
// renders the sound: one list per voice of notes as { start, end, startChar,
// ... }, times in whole notes. This holds no music theory.

/** How much silence a breath takes from the note before it, in whole notes (a sixteenth). */
export const BREATH = 1 / 16;

/** Whether an abcjs element is a spacer (`y`), which abcjs keeps as a rest of type 'spacer'. */
function isSpacer(element) {
  return element.el_type === 'note' && element.rest?.type === 'spacer';
}

/**
 * The text positions (startChar) of the notes in a drawn abcjs tune that
 * take a breath: the note before a breath-marked spacer, or a note that
 * carries the mark itself. Returns a Set.
 */
export function breathMarks(tune) {
  const marks = new Set();
  for (const line of tune.lines ?? []) {
    for (const staff of line.staff ?? []) {
      for (const voice of staff.voices ?? []) {
        let previousNote = null;
        for (const element of voice) {
          const breath = element.el_type === 'note' && element.decoration?.includes('breath');
          if (breath && isSpacer(element) && previousNote) marks.add(previousNote.startChar);
          if (breath && !isSpacer(element)) marks.add(element.startChar);
          if (element.el_type === 'note' && !isSpacer(element)) previousNote = element;
        }
      }
    }
  }
  return marks;
}

/**
 * Shortens each note whose startChar is in `marks` by BREATH, but never by
 * more than half the note. Changes the note map in place and returns it.
 */
export function breatheAfter(voices, marks) {
  for (const notes of voices) {
    for (const note of notes) {
      if (!marks.has(note.startChar)) continue;
      const length = note.end - note.start;
      note.end -= Math.min(BREATH, length / 2);
    }
  }
  return voices;
}
