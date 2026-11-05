// Short tones for the drills, made with Web Audio so a note sounds the moment
// a key is pressed (abcjs, in src/notation/playback.js, plays whole scores).
// Browser only; no theory here. Pitches are diatonic steps (C4 = 28).

import { midiOfStep } from '../input/key-map.js';

let context = null;

/**
 * The shared audio context, created and resumed on first use. Call it from a
 * click or key press first, because browsers only start sound from a gesture.
 */
export function audio() {
  context ??= new AudioContext();
  if (context.state === 'suspended') context.resume();
  return context;
}

/** Frequency in hertz of a step, at A4 = 440. */
const frequencyOf = (step) => 440 * 2 ** ((midiOfStep(step) - 69) / 12);

/**
 * Two sounds, so the two voices of a canon are easy to tell apart:
 *   PLAYER, what you play: a soft piano-like tone that fades;
 *   SITE, what the site plays: a flute-like tone that holds.
 */
export const VOICE = {
  PLAYER: { wave: 'triangle', attack: 0.005, level: 0.25, fade: true },
  SITE: { wave: 'sine', attack: 0.04, level: 0.22, fade: false },
};

/**
 * Plays one step. `seconds` is how long it lasts; `at` is when to start, in
 * audio-context time (default now). Returns { stop() } to cut it short.
 */
export function tone(step, { seconds = 1, at = 0, voice = VOICE.PLAYER } = {}) {
  const ctx = audio();
  const start = Math.max(at, ctx.currentTime);
  const end = start + seconds;
  const oscillator = new OscillatorNode(ctx, { type: voice.wave, frequency: frequencyOf(step) });
  const gain = new GainNode(ctx, { gain: 0 });
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(voice.level, start + voice.attack);
  if (voice.fade) gain.gain.exponentialRampToValueAtTime(voice.level * 0.2, end);
  else gain.gain.setValueAtTime(voice.level, end - 0.08);
  gain.gain.linearRampToValueAtTime(0, end);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.05);
  return {
    stop() {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      oscillator.stop(now + 0.1);
    },
  };
}

/** A metronome click at audio-context time `at`; `accent` for the first beat of a group. */
export function click(at, accent = false) {
  const ctx = audio();
  const oscillator = new OscillatorNode(ctx, { type: 'square', frequency: accent ? 1760 : 1320 });
  const gain = new GainNode(ctx, { gain: 0 });
  gain.gain.setValueAtTime(0.06, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + 0.05);
}
