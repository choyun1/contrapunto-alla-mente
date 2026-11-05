// Runs a drill beat by beat, in one of two modes:
//   - wait for me (bpm 0): each beat waits until you play;
//   - on a beat (bpm > 0): a click every beat after a one-bar count-in, and a
//     note counts for the beat it lands nearest to; no note by half a beat
//     after the click is a miss.
// Not music theory: the page decides what each beat plays and how to grade it.

import { audio, click } from '../audio/tone.js';

/** Clicks before the first beat on a timed run. */
const COUNT_IN = 4;

/** Pause after you play, before the next beat in wait-for-me mode (ms). */
const AFTER_NOTE_MS = 350;

/** How long a beat with nothing to play lasts in wait-for-me mode (ms). */
const LISTEN_MS = 1000;

/** How far ahead of a beat its sounds are scheduled (s), so they land on time. */
const LOOKAHEAD = 0.06;

/**
 * Starts a run of `length` beats.
 *   bpm: 0 to wait for each note, else beats per minute;
 *   needsInput(i): does beat i wait for a note from you?
 *   onBeat(i, at, seconds): play beat i's sounds starting at audio time `at`,
 *     lasting `seconds` (null in wait-for-me mode: until the next beat);
 *   onNote(i, step): you played `step` for beat i;
 *   onMiss(i): you played nothing for beat i (timed runs only);
 *   onEnd(): the run is over.
 * Returns { note(step), stop() }: pass every note you play to note().
 */
export function startRun(options) {
  return options.bpm > 0 ? timedRun(options) : waitingRun(options);
}

/** Wait-for-me mode: each beat that needs a note waits for one. */
function waitingRun({ length, needsInput, onBeat, onNote, onEnd }) {
  let beat = -1;
  let waiting = false;
  let timer = null;
  const next = () => {
    beat += 1;
    if (beat >= length) {
      onEnd();
      return;
    }
    onBeat(beat, audio().currentTime, null);
    waiting = needsInput(beat);
    if (!waiting) timer = setTimeout(next, LISTEN_MS);
  };
  next();
  return {
    note(step) {
      if (!waiting) return;
      waiting = false;
      onNote(beat, step);
      timer = setTimeout(next, AFTER_NOTE_MS);
    },
    stop() { clearTimeout(timer); waiting = false; },
  };
}

/** Timed mode: a click every beat, and each note is matched to the nearest beat. */
function timedRun({ length, bpm, needsInput, onBeat, onNote, onMiss, onEnd }) {
  const ctx = audio();
  const seconds = 60 / bpm;
  const first = ctx.currentTime + 0.15 + COUNT_IN * seconds; // audio time of beat 0
  const timeOf = (i) => first + i * seconds;
  const answered = new Set();
  const timers = [];
  const at = (time, fn) => timers.push(setTimeout(fn, Math.max(0, (time - ctx.currentTime) * 1000)));

  for (let k = 0; k < COUNT_IN; k += 1) click(first - (COUNT_IN - k) * seconds, k === 0);
  for (let i = 0; i < length; i += 1) {
    at(timeOf(i) - LOOKAHEAD, () => {
      click(timeOf(i), i % 4 === 0);
      onBeat(i, timeOf(i), seconds);
    });
    at(timeOf(i) + seconds / 2, () => {
      if (needsInput(i) && !answered.has(i)) onMiss(i);
    });
  }
  at(timeOf(length), onEnd);
  return {
    note(step) {
      const i = Math.round((ctx.currentTime - first) / seconds);
      if (i < 0 || i >= length || !needsInput(i) || answered.has(i)) return;
      answered.add(i);
      onNote(i, step);
    },
    stop() { timers.forEach(clearTimeout); },
  };
}
