// Listens for notes from every source at once: computer keys (key-map.js),
// clicks or taps on an on-screen keyboard, and a MIDI keyboard through the
// browser's Web MIDI, where it exists (Chrome and Edge; not Safari).
//
// Each note is reported as a played pitch, one of:
//   { step }       a computer key: a letter, which the drill plays in its key signature;
//   { semitones }  an on-screen or MIDI key, black keys included (C4 = 48).
// Browser only; no theory here.

import { stepOfKey, semitonesOfMidi } from './key-map.js';

/** MIDI status byte for note on, channel ignored (0x90–0x9F). */
const NOTE_ON = 0x90;

/** Is this key press one the drills should leave alone (typing in a field, shortcuts)? */
function ignoredPress(event) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return true;
  return event.target.closest?.('input, select, textarea') != null;
}

/** Computer keys: calls onStep({ step }) for each key that plays a note, `octaves()` octaves up from key-map.js. */
function listenToKeys(onStep, octaves) {
  document.addEventListener('keydown', (event) => {
    if (ignoredPress(event)) return;
    const step = stepOfKey(event.key);
    if (step === null) return;
    event.preventDefault();
    onStep({ step: step + 7 * octaves() });
  });
}

/** On-screen keyboard: calls onStep({ semitones }) for a press on any key, white or black, inside `box`. */
function listenToScreen(box, onStep) {
  box.addEventListener('pointerdown', (event) => {
    const key = event.target.closest('[data-semitones]');
    if (!key) return;
    event.preventDefault();
    onStep({ semitones: Number(key.dataset.semitones) });
  });
}

let midiStarted = false;

/**
 * MIDI keyboards: calls onStep({ semitones }) for each note on, and
 * onStatus(text) to say whether a MIDI keyboard is connected. The browser may
 * ask for permission, so pages call this from a button (Start), not on load.
 * Calling it again does nothing.
 */
export async function connectMidi(onStep, onStatus = () => {}) {
  if (midiStarted) return;
  midiStarted = true;
  if (!navigator.requestMIDIAccess) {
    onStatus('This browser has no MIDI; use the keys below.');
    return;
  }
  try {
    const access = await navigator.requestMIDIAccess();
    const attach = () => {
      const inputs = [...access.inputs.values()];
      inputs.forEach((input) => { input.onmidimessage = (message) => onMidiMessage(message, onStep); });
      onStatus(inputs.length ? `MIDI: ${inputs.map((input) => input.name).join(', ')}` : 'No MIDI keyboard connected.');
    };
    access.onstatechange = attach;
    attach();
  } catch {
    onStatus('MIDI was not allowed; use the keys below.');
  }
}

/** One MIDI message: a note on with velocity above 0 is a key press. */
function onMidiMessage({ data }, onStep) {
  const [status, note, velocity] = data;
  if ((status & 0xf0) !== NOTE_ON || velocity === 0) return;
  onStep({ semitones: semitonesOfMidi(note) });
}

/**
 * Starts listening to the computer keys and the on-screen keyboard. `screen`
 * is the element holding the on-screen keyboard; `onStep(pitch)` gets every
 * note, as above. `octaves()`, when given, moves the computer keys that many octaves up
 * (negative: down), for a drill whose voice sits lower or higher. MIDI is
 * added with connectMidi.
 */
export function listenForNotes({ screen, onStep, octaves = () => 0 }) {
  listenToKeys(onStep, octaves);
  listenToScreen(screen, onStep);
}
