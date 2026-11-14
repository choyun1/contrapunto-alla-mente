// The key-signature setting of the C-major drills (Move chords, Lead the
// canon, Follow the leader). The drills think in diatonic steps in C; this
// file moves what you see, hear and play into the chosen signature, and back.
// Display and input only; the transposition table is src/common/signatures.js.

import { SIGNATURES, NO_SIGNATURE, sounding, fromLetter, fromPitch } from '../src/common/signatures.js';
import { spelledName, spellInKey, semitonesOf } from '../src/common/diatonic.js';
import { tone } from '../src/audio/tone.js';

/** The signature picked in the page's #signature select, or C major when the page has none. */
export function signature() {
  const select = document.getElementById('signature');
  return SIGNATURES[select ? Number(select.value) : NO_SIGNATURE];
}

/** Fills the #signature select, C major picked. */
export function fillSignatures() {
  const select = document.getElementById('signature');
  select.innerHTML = SIGNATURES.map((s, k) => `<option value="${k}">${s.name}</option>`).join('');
  select.value = String(NO_SIGNATURE);
}

/** Plays a drill step as it sounds in the signature; options as for tone(). */
export function play(step, options = {}) {
  const real = sounding(step, signature());
  return tone(real.step, { ...options, alter: real.semitones - semitonesOf(real.step) });
}

/** A drill step's name as it sounds in the signature, e.g. 'B♭4'. */
export const nameOf = (step) => spelledName(sounding(step, signature()));

/** The pitch (semitones) on the keyboard for a drill step. */
export const keyOf = (step) => sounding(step, signature()).semitones;

/**
 * The drill step for a note you played (src/input/listen.js): a computer key
 * is a letter in the signature; a pressed key is a pitch, which is null when
 * it is not in the signature.
 */
export function stepOfPlayed(pitch) {
  if (pitch.semitones === undefined) return fromLetter(pitch.step, signature());
  return fromPitch(pitch.semitones, signature());
}

/** Plays a note you played, as you played it (a pitch outside the signature included). */
export function playPlayed(pitch, options = {}) {
  if (pitch.semitones === undefined) return play(stepOfPlayed(pitch), options);
  const near = Math.floor(pitch.semitones / 12) * 7;
  return tone(near, { ...options, alter: pitch.semitones - semitonesOf(near) });
}

/** Two-voice measures ({ voiceI, voiceII } steps in C) moved to the signature's letters, for drawing. */
export function measuresInKey(measures) {
  const moved = signature().steps;
  const move = (step) => (step === null || step === undefined ? null : step + moved);
  return measures.map((m) => ({ ...m, voiceI: move(m.voiceI), voiceII: move(m.voiceII) }));
}

/** An abc tune written in C given the signature's key line instead. */
export const abcInKey = (abc) => abc.replace(/^K:C$/m, `K:${signature().abc}`);

/** The name of a pitch outside the signature (semitones), spelled as ficta, e.g. 'F♯4'. */
export const outsideName = (semitones) => spelledName(spellInKey(semitones));
