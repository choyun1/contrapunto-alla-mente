// Runs the canon over a cantus firmus page (over-cantus.html): the setup
// form, the editable score and the guide table. It keeps the cantus and the
// proposta the composer is writing, and redraws everything when either or the
// setup changes. All the theory is in src/taneyev/ (imaginary-cantus.js,
// canon-voices.js, canon-check.js, canon-over-cantus.js); this file only
// handles the page.
// Intervals are zero-indexed (step 1, 3rd 2, octave 7, 12th 11).

import { propostaChoices, SIDE } from '../src/taneyev/imaginary-cantus.js';
import { ORDERS, orderName, setupFor, VOICE } from '../src/taneyev/canon-voices.js';
import { checkCanon } from '../src/taneyev/canon-check.js';
import { canonOverCantus, fittingSetups } from '../src/taneyev/canon-over-cantus.js';
import { intervalName } from '../src/taneyev/rules.js';
import { parsePitch, pitchName } from '../src/common/diatonic.js';
import { keyCommand } from '../src/notation/note-entry.js';
import { renderScore } from './over-cantus-score.js';
import { placeNote, runCommand, cursorName } from './over-cantus-entry.js';
import { guideTableHtml, setupButtonsHtml, setupName } from './over-cantus-table.js';

const $ = (id) => document.getElementById(id);

/** What the page is working on. The proposta has null for bars not yet written. */
const state = {
  cantus: [],
  proposta: [],
  order: ORDERS[0],
  size: 11, // a 12th
  delay: 3,
  generated: true, // the proposta is the computer's framework, not yet edited
  cursor: { voice: VOICE.PROPOSTA, bar: 0 }, // where typed notes go
};

/** The setup for the current state (canon-voices.js). */
const currentSetup = () => setupFor(state);

/** Reads pitch names, with "-" for an empty bar. Returns { steps } or { error }. */
function readNotes(text, { allowEmpty }) {
  const names = text.split(/[\s,]+/).filter(Boolean);
  const steps = names.map((name) => (allowEmpty && name === '-' ? null : parsePitch(name)));
  const bad = names.filter((name, k) => steps[k] === null && !(allowEmpty && name === '-'));
  const hint = allowEmpty ? 'Use names like D4 or g3, or - for an empty bar.' : 'Use names like D4 or g3.';
  if (bad.length) return { error: `Can’t read: ${bad.join(', ')}. ${hint}` };
  return { steps };
}

/** The proposta resized to the cantus: extra bars cut, missing ones empty. */
const fitted = (proposta, length) => Array.from({ length }, (_, bar) => proposta[bar] ?? null);

/** Replaces the proposta with the computer's framework, or empty bars if there is none. */
function fillFramework() {
  const canon = canonOverCantus(currentSetup());
  state.proposta = canon ? canon.proposta : state.cantus.map(() => null);
  state.generated = true;
}

/** A first note for an empty proposta bar: the nearest that fits, or a 3rd from the cantus. */
function startNote(bar) {
  const setup = currentSetup();
  const [nearest] = propostaChoices(setup, bar);
  if (nearest !== undefined) return nearest;
  return setup.cantus[bar] + (setup.side === SIDE.ABOVE ? 2 : -2);
}

/** What the entry code (over-cantus-entry.js) needs from the page. */
const hooks = {
  startNote,
  cantusChanged: () => {
    if (state.generated) fillFramework();
  },
};

/** Handles a click on the score: puts the note there, if it's in CF or P. */
function clickNote(bar, voice, pitch) {
  if (placeNote(state, bar, voice, pitch, hooks)) render({ focus: true });
}

/** Handles a key press on the score, MuseScore style (note-entry.js). */
function pressKey(event) {
  const command = keyCommand(event);
  if (!command) return;
  event.preventDefault();
  runCommand(state, command, hooks);
  render({ focus: true });
}

/** The score's title and caption for the current proposta. */
function scoreText(setup) {
  const title = `Your canon: ${setupName(state)}`;
  const who = state.generated ? 'The proposta shown is a framework the page found; change any note. ' : '';
  const caption = `${who}Click a line or space on the CF or P staff to put a note there, or type: `
    + 'A–G writes that note in the nearest octave and moves on, ↑/↓ moves it a step, Ctrl+↑/↓ (⌘ on a Mac) an octave, '
    + '←/→ moves the cursor, Alt+↑/↓ switches between P and CF, Backspace empties a P bar or removes a CF bar. '
    + 'R follows from P, and the gray I.C.F. staff is drawn but not played. '
    + 'The number over each P bar is the J<sub>v</sub> it is written in. Red bars break a rule.';
  return { title, caption: setup.cantus.length ? caption : '' };
}

/** Keeps the cursor inside the music after the cantus got shorter. Returns it. */
function clampedCursor() {
  const { voice, bar } = state.cursor;
  const last = voice === VOICE.CANTUS ? state.cantus.length : state.cantus.length - 1;
  state.cursor = { voice, bar: Math.min(bar, last) };
  return state.cursor;
}

/** Redraws the text fields, score and table from the state; `focus` keeps typing on the score. */
function render({ focus = false } = {}) {
  const setup = currentSetup();
  $('cf-notes').value = state.cantus.map(pitchName).join(' ');
  $('p-notes').value = state.proposta.map((note) => (note === null ? '-' : pitchName(note))).join(' ');
  const problems = checkCanon(state.proposta, setup);
  const cursor = clampedCursor();
  renderScore($('cf-score'), { proposta: state.proposta, setup, problems, cursor, ...scoreText(setup) }, clickNote);
  $('cf-cursor').textContent = `Cursor: ${cursorName(state, pitchName)}`;
  if (focus) $('cf-score').focus();
  const none = state.generated && state.proposta.every((note) => note === null);
  $('cf-none').hidden = !none;
  $('cf-table').innerHTML = guideTableHtml(setup);
}

/** Reads the setup controls into the state, refilling the framework if it was untouched. */
function readSetup() {
  state.order = ORDERS[Number($('cf-order').value)];
  state.size = Number($('cf-size').value);
  state.delay = Math.max(1, Number($('cf-delay').value));
  if (state.generated) fillFramework();
}

/** Reads the cantus field; on success the proposta is fitted or refilled. Returns an error or ''. */
function readCantus() {
  const { steps, error } = readNotes($('cf-notes').value, { allowEmpty: false });
  if (error) return error;
  if (steps.length <= state.delay) return 'Add more cantus notes than the delay.';
  state.cantus = steps;
  state.proposta = fitted(state.proposta, steps.length);
  if (state.generated) fillFramework();
  return '';
}

/** Reads the proposta field. Returns an error or ''. */
function readProposta() {
  const { steps, error } = readNotes($('p-notes').value, { allowEmpty: true });
  if (error) return error;
  state.proposta = fitted(steps, state.cantus.length);
  state.generated = false;
  return '';
}

/** Runs one of the read functions, then shows its error or redraws. */
function apply(read) {
  const error = read();
  $('cf-error').textContent = error;
  if (!error) render();
}

/** Fills the setup controls with options and the state's values. */
function initControls() {
  $('cf-order').innerHTML = ORDERS.map((order, k) => `<option value="${k}">${orderName(order)}</option>`).join('');
  $('cf-size').innerHTML = Array.from({ length: 15 }, (_, size) => `<option value="${size}">${intervalName(size)}</option>`).join('');
  $('cf-order').value = String(ORDERS.indexOf(state.order));
  $('cf-size').value = String(state.size);
  $('cf-delay').value = String(state.delay);
}

/** Sets the controls from a setup button ("work backwards") and redraws. */
function useSetup(button) {
  state.order = ORDERS.find((order) => order.join(' ') === button.dataset.order);
  state.size = Number(button.dataset.size);
  state.delay = Number(button.dataset.delay);
  initControls();
  fillFramework();
  render();
}

/** Reads the setup controls. Returns '' (they can't be wrong). */
function changeSetup() {
  readSetup();
  return '';
}

/** Puts the computer's framework back as the proposta. Returns ''. */
function useFramework() {
  fillFramework();
  return '';
}

/** Empties every bar of the proposta, to write it from scratch. Returns ''. */
function clearProposta() {
  state.proposta = state.cantus.map(() => null);
  state.generated = false;
  return '';
}

/** Lists every setup that has a framework over this cantus, as buttons. */
function showFittingSetups() {
  $('cf-setups').innerHTML = setupButtonsHtml(fittingSetups(state.cantus));
}

/** Wires every control on the page. */
function wire() {
  for (const id of ['cf-order', 'cf-size', 'cf-delay']) {
    $(id).addEventListener('change', () => apply(changeSetup));
  }
  $('cf-notes').addEventListener('change', () => apply(readCantus));
  $('p-notes').addEventListener('change', () => apply(readProposta));
  $('cf-fill').addEventListener('click', () => apply(useFramework));
  $('cf-clear').addEventListener('click', () => apply(clearProposta));
  $('cf-find').addEventListener('click', showFittingSetups);
  $('cf-score').addEventListener('keydown', pressKey);
  $('cf-setups').addEventListener('click', (event) => {
    if (event.target.matches('.setups button')) useSetup(event.target);
  });
}

initControls();
wire();
apply(readCantus);
