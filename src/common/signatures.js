// Key signatures for the C-major drills (Move chords, Lead the canon, Follow
// the leader). Their rules run on diatonic steps in C; another signature only
// moves what you see, hear and play, as a transposition. No theory here.
//
// Each signature moves C major to a major key: `steps` letters and
// `semitones` up (negative: down), kept within a 4th so the range stays put;
// `abc` is the key's name in abc notation, for drawing.
// The canons start on D (Fux's Dorian), so in F major they sound in G Dorian.

import { semitonesOf } from './diatonic.js';

/** Signatures in circle-of-fifths order, from 4 flats to 4 sharps. */
export const SIGNATURES = [
  { name: '4 flats (A♭ major, F minor)', abc: 'Ab', steps: -2, semitones: -4 },
  { name: '3 flats (E♭ major, C minor)', abc: 'Eb', steps: 2, semitones: 3 },
  { name: '2 flats (B♭ major, G minor)', abc: 'Bb', steps: -1, semitones: -2 },
  { name: '1 flat (F major, D minor)', abc: 'F', steps: 3, semitones: 5 },
  { name: 'None (C major, A minor)', abc: 'C', steps: 0, semitones: 0 },
  { name: '1 sharp (G major, E minor)', abc: 'G', steps: -3, semitones: -5 },
  { name: '2 sharps (D major, B minor)', abc: 'D', steps: 1, semitones: 2 },
  { name: '3 sharps (A major, F♯ minor)', abc: 'A', steps: -2, semitones: -3 },
  { name: '4 sharps (E major, C♯ minor)', abc: 'E', steps: 2, semitones: 4 },
];

/** The index of C major in SIGNATURES. */
export const NO_SIGNATURE = 4;

/** Where a drill's step in C is played in a signature: { step, semitones } (the real letter and pitch). */
export function sounding(step, signature) {
  return { step: step + signature.steps, semitones: semitonesOf(step) + signature.semitones };
}

/** The drill's step in C for a real letter (a computer key, which follows the signature). */
export const fromLetter = (step, signature) => step - signature.steps;

/** The drill's step in C for a played pitch, or null when the pitch is not in the signature. */
export function fromPitch(semitones, signature) {
  const inC = semitones - signature.semitones;
  const near = Math.floor(inC / 12) * 7;
  for (let step = near; step < near + 7; step += 1) if (semitonesOf(step) === inC) return step;
  return null;
}
