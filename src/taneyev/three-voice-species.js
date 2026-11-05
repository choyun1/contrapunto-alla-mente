// A four-bar three-voice example in mixed species (half notes, suspensions,
// passing tones), for splits where strict first species finds nothing
// (three-voice-examples.js).
//
// Note against note, every chord must be consonant in both versions, and for
// many splits almost no chord is. Strict style allows two kinds of dissonance
// (dissonance.js), and both survive a shift when the chart marks allow:
//
//   a suspension  an upper voice in syncopation (Fux's fourth species) holds a
//                 note over the bar line; dissonant on the downbeat in either
//                 version, it steps down to a consonance on the upbeat, and its
//                 mark may not be (—) (§128, §135);
//   a passing tone an upper voice in half notes (second species) may be
//                 dissonant on the upbeat if it passes by step between two
//                 notes.
//
// Each upper voice takes one rhythm for the whole example: whole notes, half
// notes, or syncopation. The lower voice is the cantus firmus in whole notes.
// Bar 1 opens with a half rest in a syncopated voice, and all three voices
// close together in whole notes in bar 4. Any four-note cantus from the
// starting note is tried (fourNoteCanti), not only the four of first species.
//
// The example is a list of seven beats, numbered from 0: a downbeat and an
// upbeat in each of bars 1–3, then the closing downbeat. Intervals are
// zero-indexed (unison 0, 5th 4, octave 7); pitches are diatonic steps in C
// major (src/common/diatonic.js).

import { MIDDLE_C, isTritone } from '../common/diatonic.js';
import { isConsonant, isPerfect, simple } from './rules.js';
import { moveSurvivesShift } from './motion.js';
import { maySuspend, isPassingTone } from './dissonance.js';
import { fourNoteCanti } from './first-species.js';
import { pairShifts } from './three-voices.js';
import { PAIRS, voiceMoves, goodMelody, leapCost, spacingsOver } from './three-voice-chords.js';

/** The rhythm an upper voice keeps for the whole example. */
export const RHYTHM = { WHOLE: 'whole', HALVES: 'halves', SYNCOPATED: 'syncopated' };

/** Beats in a four-bar example: two in each of bars 1–3, one closing beat. */
const BEATS = 7;
const LAST = BEATS - 1;

/** Extra cost of a rhythm, so plainer textures win a tie. */
const RHYTHM_COST = { [RHYTHM.WHOLE]: 0, [RHYTHM.SYNCOPATED]: 1, [RHYTHM.HALVES]: 2 };

/** Every { upper, middle } pair of rhythms with at least one voice moving faster than the cantus. */
const TEXTURES = Object.values(RHYTHM)
  .flatMap((upper) => Object.values(RHYTHM).map((middle) => ({ upper, middle, lower: RHYTHM.WHOLE })))
  .filter((t) => t.upper !== RHYTHM.WHOLE || t.middle !== RHYTHM.WHOLE);

const isUpbeat = (beat) => beat % 2 === 1;
const barOf = (beat) => Math.floor(beat / 2);

/** Does a voice with this rhythm sing a new note on this beat? */
function strikes(rhythm, beat) {
  if (beat === LAST) return true;
  if (rhythm === RHYTHM.HALVES) return true;
  if (rhythm === RHYTHM.SYNCOPATED) return isUpbeat(beat);
  return !isUpbeat(beat);
}

/** Is a voice silent on this beat? Only a syncopated voice, on the first downbeat. */
const isSilent = (rhythm, beat) => rhythm === RHYTHM.SYNCOPATED && beat === 0;

/** A chord moved into the shifted version; silent voices stay null. */
function shifted(chord, split) {
  const moves = voiceMoves(split);
  const out = {};
  for (const v of ['upper', 'middle', 'lower']) out[v] = chord[v] === null ? null : chord[v] + moves[v];
  return out;
}

/** The Jv of each pair, keyed like PAIRS. */
function pairJvs(split) {
  const { upperMiddle, middleLower, upperLower } = pairShifts(split);
  return [upperMiddle, middleLower, upperLower];
}

/**
 * Is a–b consonant within `chord` (one version)? By the two-voice rules, or a
 * 4th between two voices above the lowest when both are consonant with it
 * (Movable Counterpoint 4, 10:23). A tritone never is.
 */
function consonantInChord(chord, a, b) {
  if (isTritone(a, b)) return false;
  if (isConsonant(a - b)) return true;
  const lowest = Math.min(...Object.values(chord).filter((p) => p !== null));
  if (simple(a - b) !== 3 || Math.min(a, b) <= lowest) return false;
  return isConsonant(a - lowest) && isConsonant(b - lowest);
}

/**
 * The dissonances on one beat, or null if the beat is not usable. `excusable`
 * maps a voice to the excuse it may claim here ('suspension' or 'passing').
 * A pair that is not consonant in some version must hold exactly one excusable
 * voice; a suspension also needs its mark to allow it and no tritone.
 * Returns { suspension: Set, passing: Set } of the voices that needed it.
 * A unison belongs on the first or the last beat, or on an upbeat (Fux,
 * second species), never on an inner downbeat.
 */
function dissonancesOn(chord, beat, excusable, split) {
  const found = { suspension: new Set(), passing: new Set() };
  const versions = [chord, shifted(chord, split)];
  const jvs = pairJvs(split);
  for (const [k, [high, low]] of PAIRS.entries()) {
    if (chord[high] === null || chord[low] === null) continue;
    for (const version of versions) {
      const a = version[high];
      const b = version[low];
      if (a === b && !isUpbeat(beat) && beat !== 0 && beat !== LAST) return null;
      if (consonantInChord(version, a, b)) continue;
      const excused = [high, low].filter((v) => excusable[v]);
      if (excused.length !== 1) return null;
      const [v] = excused;
      if (excusable[v] === 'suspension') {
        const role = v === high ? 'above' : 'below';
        if (isTritone(a, b) || !maySuspend(chord[high] - chord[low], jvs[k], role)) return null;
      }
      found[excusable[v]].add(v);
    }
  }
  return found;
}

/**
 * Same perfect consonance on two accented beats in a row, in a pair with a
 * faster voice? Downbeats for half notes (Fux, second species), upbeats (the
 * resolutions) for syncopation: a tie does not excuse 9–8 chains (fourth species).
 */
function accentedParallels(earlier, chord, beat, texture, split) {
  const watched = isUpbeat(beat) ? RHYTHM.SYNCOPATED : RHYTHM.HALVES;
  const pairs = [[earlier, chord], [shifted(earlier, split), shifted(chord, split)]];
  return pairs.some(([from, to]) => PAIRS.some(([high, low]) => {
    if (texture[high] !== watched && texture[low] !== watched) return false;
    if ([from[high], from[low], to[high], to[low]].includes(null)) return false;
    const a = from[high] - from[low];
    const b = to[high] - to[low];
    return isPerfect(a) && isPerfect(b) && simple(a) === simple(b);
  }));
}

/**
 * Can every voice move from the previous beat to this one? Each upper voice
 * sings an allowed leap with no tritone in either version; a voice in half
 * notes or syncopation never repeats a note it strikes again (Fux); a passing
 * tone goes on by step, and a suspension steps down. Every pair obeys the
 * motion rules in both versions (Fux; §101).
 */
function goodStep(beats, chord, texture, split) {
  const beat = beats.length;
  const before = beats[beat - 1];
  const moves = voiceMoves(split);
  for (const v of ['upper', 'middle']) {
    const from = before.chord[v];
    const to = chord[v];
    if (from === null) continue;
    if (from === to && texture[v] !== RHYTHM.WHOLE && strikes(texture[v], beat) && beat !== LAST) return false;
    if (!goodMelody(from, to, moves[v])) return false;
    if (before.passing.has(v) && !isPassingTone(beats[beat - 2].chord[v], from, to)) return false;
    if (before.suspension.has(v) && to !== from - 1) return false;
  }
  const jvs = pairJvs(split);
  return PAIRS.every(([high, low], k) => {
    if ([before.chord[high], before.chord[low]].includes(null)) return true;
    const dyad = (c) => ({ voiceI: c[high], voiceII: c[low] });
    return moveSurvivesShift(dyad(before.chord), dyad(chord), jvs[k]);
  });
}

/** Every chord that may sound on a beat: voices that do not strike hold their note. */
function chordsOn(beat, cantus, beats, texture) {
  const seen = new Set();
  const chords = [];
  for (const spacing of spacingsOver(cantus[barOf(beat)])) {
    const chord = { ...spacing };
    let holds = true;
    for (const v of ['upper', 'middle']) {
      if (isSilent(texture[v], beat)) chord[v] = null;
      else if (!strikes(texture[v], beat) && beat > 0 && chord[v] !== beats[beat - 1].chord[v]) holds = false;
    }
    const key = `${chord.upper} ${chord.middle} ${chord.lower}`;
    if (holds && !seen.has(key)) chords.push(chord);
    seen.add(key);
  }
  return chords;
}

/** The excuses each voice may claim on a beat: a tied syncopation, or a half note reached by step. */
function excusesOn(beat, chord, beats, texture) {
  const excusable = {};
  if (beat === 0 || beat === LAST) return excusable;
  for (const v of ['upper', 'middle']) {
    const tied = texture[v] === RHYTHM.SYNCOPATED && !isUpbeat(beat);
    const byStep = Math.abs(chord[v] - beats[beat - 1].chord[v]) === 1;
    if (tied) excusable[v] = 'suspension';
    if (texture[v] === RHYTHM.HALVES && isUpbeat(beat) && byStep) excusable[v] = 'passing';
  }
  return excusable;
}

/** Every legal example over one cantus in one texture: lists of { chord, suspension, passing }. */
function legalExamples(cantus, texture, split) {
  const found = [];
  const extend = (beats) => {
    const beat = beats.length;
    if (beat === BEATS) {
      found.push(beats);
      return;
    }
    for (const chord of chordsOn(beat, cantus, beats, texture)) {
      if (beat > 0 && !goodStep(beats, chord, texture, split)) continue;
      if (beat >= 2 && accentedParallels(beats[beat - 2].chord, chord, beat, texture, split)) continue;
      const dissonances = dissonancesOn(chord, beat, excusesOn(beat, chord, beats, texture), split);
      if (dissonances) extend([...beats, { chord, ...dissonances }]);
    }
  };
  extend([]);
  return found;
}

/** Cost of an example: smoothness of the upper voices, plainer rhythms, then a perfect close (Fux). */
function exampleCost(beats, texture, split) {
  let cost = RHYTHM_COST[texture.upper] + RHYTHM_COST[texture.middle];
  for (let k = 1; k < BEATS; k += 1) {
    for (const v of ['upper', 'middle']) {
      const from = beats[k - 1].chord[v];
      const to = beats[k].chord[v];
      if (from !== null && from !== to) cost += leapCost(from, to);
    }
  }
  const close = beats[LAST].chord;
  if (!isPerfect(close.upper - close.lower)) cost += 2;
  const shiftedClose = shifted(close, split);
  if (!isPerfect(shiftedClose.upper - shiftedClose.lower)) cost += 2;
  return cost;
}

/**
 * One version of an example as four bars of { upper, middle, lower }. A voice
 * in whole notes has a number; a faster voice has [downbeat, upbeat] half
 * notes (null for a rest). In a syncopated voice each downbeat is the upbeat
 * before it, tied over the bar line. The closing bar is all whole notes.
 */
function toBars(beats, texture, chordOf) {
  const bars = [];
  for (let bar = 0; bar * 2 < LAST; bar += 1) {
    const down = chordOf(beats[bar * 2].chord);
    const up = chordOf(beats[bar * 2 + 1].chord);
    const out = { ...down };
    for (const v of ['upper', 'middle']) if (texture[v] !== RHYTHM.WHOLE) out[v] = [down[v], up[v]];
    bars.push(out);
  }
  bars.push(chordOf(beats[LAST].chord));
  return bars;
}

/** Bars (counted from 1) holding a dissonance of one kind. */
function barsWith(beats, kind) {
  const bars = beats.flatMap((beat, k) => (beat[kind]?.size ? [barOf(k) + 1] : []));
  return [...new Set(bars)];
}

/**
 * The smoothest four-bar mixed-species example for a split, or null when none
 * exists (the split has too few consonant chords even with suspensions and
 * passing tones). The cantus starts on `start` (a diatonic step; middle C by
 * default) and may be any of fourNoteCanti. Returns { cantus, texture, suspensions, passingTones, original,
 * shifted }: `texture` gives each voice's rhythm (RHYTHM), `suspensions` and
 * `passingTones` the bars (from 1) where they fall, and original and shifted
 * are bars as in toBars.
 */
export function speciesExample(split, { start = MIDDLE_C } = {}) {
  let best = null;
  for (const cantus of fourNoteCanti(start)) {
    for (const texture of TEXTURES) {
      for (const beats of legalExamples(cantus, texture, split)) {
        const cost = exampleCost(beats, texture, split);
        if (!best || cost < best.cost) best = { cost, cantus, texture, beats };
      }
    }
  }
  if (!best) return null;
  const { cantus, texture, beats } = best;
  return {
    cantus,
    texture,
    suspensions: barsWith(beats, 'suspension'),
    passingTones: barsWith(beats, 'passing'),
    original: toBars(beats, texture, (chord) => chord),
    shifted: toBars(beats, texture, (chord) => shifted(chord, split)),
  };
}
