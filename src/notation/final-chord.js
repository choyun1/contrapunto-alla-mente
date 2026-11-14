// Playback shaping for the final chord: a voice that finishes early holds its
// last note until every voice has come to rest, so the piece ends on one
// chord sounding together (Cho, 2026-11-14). No notes are added, and only
// the sound changes: the score is drawn as written.
//
// It works on the note map abcjs makes just before it renders the sound (the
// `sequenceCallback` of synth.init): one list per voice of notes as
// { pitch, start, end, ... }, with times in whole notes. This holds no music
// theory and runs in the browser and in Node.

/** The latest time any note in the list stops sounding, or 0 for none. */
function lastEnd(notes) {
  return notes.reduce((latest, note) => Math.max(latest, note.end), 0);
}

/**
 * Lengthens the last note of each voice (every note of it, for a chord) to
 * the end of the whole piece. Changes the note map in place and returns it.
 */
export function holdFinalNotes(voices) {
  const pieceEnd = Math.max(0, ...voices.map(lastEnd));
  for (const notes of voices) {
    const voiceEnd = lastEnd(notes);
    if (voiceEnd === 0 || voiceEnd === pieceEnd) continue;
    for (const note of notes) {
      if (note.end === voiceEnd) note.end = pieceEnd;
    }
  }
  return voices;
}

/**
 * Lets the final chord ring `extra` whole notes past the end of the piece, so
 * there is sound left for the fade-out (fade-out.js) to taper. Changes the
 * note map in place and returns it.
 */
export function ringOn(voices, extra) {
  const pieceEnd = Math.max(0, ...voices.map(lastEnd));
  for (const notes of voices) {
    for (const note of notes) {
      if (note.end === pieceEnd) note.end += extra;
    }
  }
  return voices;
}
