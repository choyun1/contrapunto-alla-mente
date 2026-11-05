import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearestWithLetter, keyCommand, COMMAND } from '../src/notation/note-entry.js';
import { placeNote, runCommand, cursorName } from '../canon/over-cantus-entry.js';
import { parsePitch, pitchName } from '../src/common/diatonic.js';

const p = parsePitch;

test('a typed letter lands in the nearest octave, as in MuseScore', () => {
  assert.equal(nearestWithLetter('F', p('D4')), p('F4')); // up a 3rd
  assert.equal(nearestWithLetter('A', p('D4')), p('A3')); // down a 4th, not up a 5th
  assert.equal(nearestWithLetter('G', p('D4')), p('G4')); // up a 4th
  assert.equal(nearestWithLetter('D', p('D4')), p('D4'));
  assert.equal(nearestWithLetter('C', p('B3')), p('C4'));
});

test('keys map to commands: letters, steps, octaves, cursor moves, erase and staff switch', () => {
  assert.deepEqual(keyCommand({ key: 'e' }), { type: COMMAND.LETTER, letter: 'E' });
  assert.deepEqual(keyCommand({ key: 'ArrowUp' }), { type: COMMAND.STEP, by: 1 });
  assert.deepEqual(keyCommand({ key: 'ArrowDown', ctrlKey: true }), { type: COMMAND.STEP, by: -7 });
  assert.deepEqual(keyCommand({ key: 'ArrowUp', metaKey: true }), { type: COMMAND.STEP, by: 7 });
  assert.deepEqual(keyCommand({ key: 'ArrowLeft' }), { type: COMMAND.MOVE, by: -1 });
  assert.deepEqual(keyCommand({ key: 'Backspace' }), { type: COMMAND.ERASE });
  assert.deepEqual(keyCommand({ key: 'ArrowDown', altKey: true }), { type: COMMAND.SWITCH });
  assert.equal(keyCommand({ key: 'Tab' }), null, 'Tab still leaves the score');
  assert.equal(keyCommand({ key: 'c', ctrlKey: true }), null, 'Ctrl+C is left to the browser');
});

/** A small page state: three cantus bars, an empty proposta, the cursor on P bar 1. */
function freshState() {
  return {
    cantus: [p('D4'), p('F4'), p('E4')],
    proposta: [null, null, null],
    cursor: { voice: 'proposta', bar: 0 },
    delay: 1,
    generated: true,
  };
}

const hooks = { startNote: () => p('B3'), cantusChanged: () => {} };

test('typing letters writes the proposta and moves on, each note near the one before', () => {
  const state = freshState();
  for (const letter of ['G', 'A', 'B']) runCommand(state, { type: COMMAND.LETTER, letter }, hooks);
  assert.deepEqual(state.proposta.map(pitchName), ['G3', 'A3', 'B3']);
  assert.equal(state.generated, false);
  assert.deepEqual(state.cursor, { voice: 'proposta', bar: 2 }, 'the cursor stops at the last bar');
});

test('arrows move the note under the cursor; an empty bar gets a first note', () => {
  const state = freshState();
  runCommand(state, { type: COMMAND.STEP, by: 1 }, hooks);
  assert.equal(state.proposta[0], p('B3'));
  runCommand(state, { type: COMMAND.STEP, by: -7 }, hooks);
  assert.equal(state.proposta[0], p('B2'));
});

test('backspace empties a proposta bar but removes a cantus bar', () => {
  const state = freshState();
  placeNote(state, 1, 'proposta', p('A3'), hooks);
  runCommand(state, { type: COMMAND.ERASE }, hooks);
  assert.equal(state.proposta[1], null);
  state.cantus.push(p('D4'));
  state.proposta.push(null);
  placeNote(state, 0, 'cantus', p('C4'), hooks);
  runCommand(state, { type: COMMAND.ERASE }, hooks);
  assert.deepEqual(state.cantus.map(pitchName), ['F4', 'E4', 'D4']);
  assert.equal(state.proposta.length, 3);
});

test('typing after the last cantus bar adds a bar to the cantus and an empty proposta bar', () => {
  const state = freshState();
  runCommand(state, { type: COMMAND.SWITCH }, hooks);
  for (let k = 0; k < 5; k += 1) runCommand(state, { type: COMMAND.MOVE, by: 1 }, hooks);
  assert.equal(cursorName(state, pitchName), 'CF, after the last bar (type a letter to add one)');
  runCommand(state, { type: COMMAND.LETTER, letter: 'D' }, hooks);
  assert.deepEqual(state.cantus.map(pitchName), ['D4', 'F4', 'E4', 'D4']);
  assert.equal(state.proposta.length, 4);
});

test('clicks on the risposta or imaginary cantus change nothing', () => {
  const state = freshState();
  assert.equal(placeNote(state, 1, 'risposta', p('A5'), hooks), false);
  assert.equal(placeNote(state, 1, 'imaginary', p('A2'), hooks), false);
  assert.deepEqual(state.proposta, [null, null, null]);
});
