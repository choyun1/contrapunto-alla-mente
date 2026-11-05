import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepOfKey, stepOfMidi, midiOfStep, keyLabels } from '../src/input/key-map.js';
import { parsePitch, pitchName } from '../src/common/diatonic.js';

// Pitches are diatonic steps: C4 (middle C) = 28.

test('the home row starts on middle C, one octave per row', () => {
  assert.equal(pitchName(stepOfKey('a')), 'C4');
  assert.equal(pitchName(stepOfKey('J')), 'B4');
  assert.equal(pitchName(stepOfKey('z')), 'C3');
  assert.equal(pitchName(stepOfKey('q')), 'C5');
  assert.equal(pitchName(stepOfKey('i')), 'C6');
  assert.equal(stepOfKey('k'), null);
});

test('each step has at most one key label', () => {
  assert.equal(keyLabels().get(parsePitch('E4')), 'D');
  assert.equal(keyLabels().size, 22);
});

test('MIDI note 60 is middle C, and white keys round-trip', () => {
  assert.equal(midiOfStep(parsePitch('C4')), 60);
  assert.equal(midiOfStep(parsePitch('A4')), 69);
  for (let step = parsePitch('C2'); step <= parsePitch('C7'); step += 1) assert.equal(stepOfMidi(midiOfStep(step)), step);
});

test('black keys are not read (the drills are in C major)', () => {
  assert.equal(stepOfMidi(61), null); // C♯4
  assert.equal(stepOfMidi(70), null); // B♭4
  assert.equal(stepOfMidi(59), parsePitch('B3'));
});
