// The canon over a cantus firmus page: MuseScore-style note entry. A cursor
// sits on one bar of the cantus (CF) or proposta (P); clicks and key presses
// change the notes under it. Page logic only: the keys are read by
// src/notation/note-entry.js and the theory lives in src/taneyev/.
// Pitches are diatonic steps (C4 = 28).
//
// `state` is the page's state ({ cantus, proposta, cursor, delay, generated });
// `hooks` gives { startNote(bar), cantusChanged() } so this file needn't know
// how the page finds a first note or refills the framework.

import { COMMAND, nearestWithLetter } from '../src/notation/note-entry.js';
import { VOICE } from '../src/taneyev/canon-voices.js';

/** The voices the cursor can sit on; Alt+↑/↓ switches between them. */
const EDITABLE = [VOICE.PROPOSTA, VOICE.CANTUS];

/** The list of notes for an editable voice. */
const notesOf = (state, voice) => (voice === VOICE.CANTUS ? state.cantus : state.proposta);

/**
 * The last bar the cursor may reach in a voice. The cantus has one extra
 * slot after its end, where typing a letter adds a bar.
 */
const lastBar = (state, voice) => (voice === VOICE.CANTUS ? state.cantus.length : state.cantus.length - 1);

/** Writes a pitch into a bar of the cantus or proposta (adding a cantus bar at the end). */
function write(state, voice, bar, pitch, hooks) {
  if (voice === VOICE.CANTUS) {
    state.cantus[bar] = pitch;
    if (state.proposta.length < state.cantus.length) state.proposta.push(null);
    hooks.cantusChanged();
  } else {
    state.proposta[bar] = pitch;
    state.generated = false;
  }
}

/** Puts a note where the score was clicked, and the cursor on it. Ignores R and ICF */
export function placeNote(state, bar, voice, pitch, hooks) {
  if (!EDITABLE.includes(voice)) return false;
  state.cursor = { voice, bar };
  write(state, voice, bar, pitch, hooks);
  return true;
}

/** The note a typed letter is measured from: the one before the cursor, else the one under it, else a first guess. */
function referenceNote(state, hooks) {
  const { voice, bar } = state.cursor;
  const notes = notesOf(state, voice);
  for (let k = bar - 1; k >= 0; k -= 1) {
    if (notes[k] !== null) return notes[k];
  }
  if (notes[bar] !== null && notes[bar] !== undefined) return notes[bar];
  return voice === VOICE.CANTUS ? state.cantus[0] : hooks.startNote(bar);
}

/** Typing a letter: writes that note in the nearest octave and moves to the next bar (MuseScore). */
function typeLetter(state, letter, hooks) {
  const { voice, bar } = state.cursor;
  write(state, voice, bar, nearestWithLetter(letter, referenceNote(state, hooks)), hooks);
  state.cursor = { voice, bar: Math.min(bar + 1, lastBar(state, voice)) };
}

/** Up or down by `by` steps; an empty proposta bar gets a first note instead. */
function stepNote(state, by, hooks) {
  const { voice, bar } = state.cursor;
  const note = notesOf(state, voice)[bar];
  if (note === undefined) return;
  write(state, voice, bar, note === null ? hooks.startNote(bar) : note + by, hooks);
}

/** Backspace: empties a proposta bar, or removes a cantus bar while enough remain. */
function erase(state, hooks) {
  const { voice, bar } = state.cursor;
  if (voice === VOICE.PROPOSTA) {
    state.proposta[bar] = null;
    state.generated = false;
    return;
  }
  if (bar >= state.cantus.length || state.cantus.length <= state.delay + 1) return;
  state.cantus.splice(bar, 1);
  state.proposta.splice(bar, 1);
  state.cursor = { voice, bar: Math.min(bar, state.cantus.length - 1) };
  hooks.cantusChanged();
}

/** Moves the cursor along its voice, or to the other editable voice. */
function moveCursor(state, command) {
  const { voice, bar } = state.cursor;
  if (command.type === COMMAND.SWITCH) {
    const next = voice === VOICE.PROPOSTA ? VOICE.CANTUS : VOICE.PROPOSTA;
    state.cursor = { voice: next, bar: Math.min(bar, lastBar(state, next)) };
    return;
  }
  state.cursor = { voice, bar: Math.max(0, Math.min(bar + command.by, lastBar(state, voice))) };
}

/** Carries out one keyboard command (note-entry.js) on the state. */
export function runCommand(state, command, hooks) {
  if (command.type === COMMAND.LETTER) typeLetter(state, command.letter, hooks);
  else if (command.type === COMMAND.STEP) stepNote(state, command.by, hooks);
  else if (command.type === COMMAND.ERASE) erase(state, hooks);
  else moveCursor(state, command);
}

/** The cursor in words for the status line, e.g. "P, bar 4 (B3)" or "CF, after the last bar". */
export function cursorName(state, nameOf) {
  const { voice, bar } = state.cursor;
  const label = voice === VOICE.CANTUS ? 'CF' : 'P';
  const note = notesOf(state, voice)[bar];
  if (note === undefined) return `${label}, after the last bar (type a letter to add one)`;
  return `${label}, bar ${bar + 1} (${note === null ? 'empty' : nameOf(note)})`;
}
