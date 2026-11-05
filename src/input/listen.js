// Listens for notes from every source at once and reports each as a diatonic
// step: computer keys (key-map.js), clicks or taps on an on-screen keyboard,
// and a MIDI keyboard through the browser's Web MIDI, where it exists
// (Chrome and Edge; not Safari).
// Browser only; no theory here.

import { stepOfKey, stepOfMidi } from './key-map.js';

/** MIDI status byte for note on, channel ignored (0x90–0x9F). */
const NOTE_ON = 0x90;

/** Is this key press one the drills should leave alone (typing in a field, shortcuts)? */
function ignoredPress(event) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return true;
  return event.target.closest?.('input, select, textarea') != null;
}

/** Computer keys: calls onStep(step) for each key that plays a note. */
function listenToKeys(onStep) {
  document.addEventListener('keydown', (event) => {
    if (ignoredPress(event)) return;
    const step = stepOfKey(event.key);
    if (step === null) return;
    event.preventDefault();
    onStep(step);
  });
}

/** On-screen keyboard: calls onStep(step) for a press on any key with data-step inside `box`. */
function listenToScreen(box, onStep) {
  box.addEventListener('pointerdown', (event) => {
    const key = event.target.closest('[data-step]');
    if (!key) return;
    event.preventDefault();
    onStep(Number(key.dataset.step));
  });
}

let midiStarted = false;

/**
 * MIDI keyboards: calls onStep(step) for each white-key note on, and
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
  const step = stepOfMidi(note);
  if (step !== null) onStep(step);
}

/**
 * Starts listening to the computer keys and the on-screen keyboard. `screen`
 * is the element holding the on-screen keyboard; `onStep(step)` gets every
 * note. MIDI is added with connectMidi.
 */
export function listenForNotes({ screen, onStep }) {
  listenToKeys(onStep);
  listenToScreen(screen, onStep);
}
