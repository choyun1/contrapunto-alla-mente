// The notebook page's scores: an example's abc as drawn, with the imaginary
// cantus added as its own staff. The file's own abc is what is heard, except
// for an example of alternative staves (see heardAbc). No DOM here, so
// the tests can use it too. The imaginary cantus itself comes from the rules
// core, src/taneyev/imaginary-cantus.js.
// Intervals are zero-indexed (5th 4, octave 7, 12th 11).

import { readVoices, unitLength, voiceMusic, withVoice } from '../src/notation/abc-read.js';
import { abcPitch } from '../src/notation/abc.js';
import { clefsForVoice } from '../src/notation/clefs.js';
import { imaginaryCantus } from '../src/taneyev/imaginary-cantus.js';
import { dissonances, worthShowing } from '../src/taneyev/florid.js';

/** The id and staff name of the imaginary cantus voice. */
export const ICF = { id: 'ICF', name: 'ICF' };

/** The first pitch a bar sounds, or null for a bar of rests. */
const firstStep = (bar) => bar.find((note) => note.step !== null)?.step ?? null;

/**
 * The delay in force at bar `bar` (counted from 0): that of the span holding
 * it, or of the last span before it (a cadence or free passage keeps the
 * delay of the canon it ends), or else of the first span.
 */
export function delayAt(canon, bar) {
  const started = canon.spans.filter(([first]) => first <= bar + 1);
  const span = started.at(-1) ?? canon.spans[0];
  return span[2] ?? canon.delay;
}

/**
 * The imaginary cantus, one whole note per bar: the cantus moved against the
 * canon (`entry` steps the other way, one delay earlier, with the delay in
 * force at that bar). A bar where the proposta is silent, or past the
 * cantus's end, gets null.
 */
export function imaginaryBars(abc, canon) {
  const voices = readVoices(abc);
  const cantus = voices.CF.map(firstStep);
  return cantus.map((_, bar) => {
    const proposta = voices[canon.lead][bar];
    if (!proposta || firstStep(proposta) === null) return null;
    return imaginaryCantus(cantus, canon.entry, delayAt(canon, bar))[bar];
  });
}

/** abc music for whole notes, one per bar, with a whole-bar rest for null. */
function wholeNotes(steps, unit) {
  const whole = String(1 / unit);
  return steps.map((step) => (step === null ? `z${whole}` : `${abcPitch(step)}${whole}`)).join(' | ');
}

/** The voices that copy the leader: the canon's follower, and the second answer of alternative staves. */
function followers(example) {
  const second = example.alternatives?.lower;
  return second && second !== example.canon.follow ? [example.canon.follow, second] : [example.canon.follow];
}

/** Is bar `bar` (counted from 1) strict canon in a voice: inside a span for the leader, or a span moved by its delay for a follower? */
function isStrict(canon, bar, following) {
  return canon.spans.some(([first, last, delay = canon.delay]) => {
    const shift = following ? delay : 0;
    return bar >= first + shift && bar <= last + shift;
  });
}

/**
 * Where each canonic voice leaves the strict canon: { voice: { bar: label } },
 * bars counted from 1. A stretch where every canonic voice is free is marked
 * 'cadence' when it is three bars or less and 'free' when longer; bars where
 * only one voice has left the canon are marked 'free'. Only a stretch's
 * first bar is marked, and only once the voice has entered.
 */
export function canonMarks(abc, example) {
  if (!example.canon) return {};
  const voices = readVoices(abc);
  const ids = [example.canon.lead, ...followers(example)];
  const bars = Math.max(...ids.map((id) => voices[id].length));
  if (example.rounds) {
    // an infinite canon is strict all the way round its repeat; only the ending is free
    return Object.fromEntries(ids.map((id) => [id, { [bars]: 'cadence' }]));
  }
  const entry = Object.fromEntries(ids.map((id) => [id, 1 + voices[id].findIndex((bar) => firstStep(bar) !== null)]));
  const free = (id, bar) => bar >= entry[id] && !isStrict(example.canon, bar, id !== example.canon.lead);
  const allFree = (bar) => ids.every((id) => free(id, bar));
  const stretch = (bar) => { // how many bars of all-free start here
    let end = bar;
    while (end <= bars && allFree(end)) end += 1;
    return end - bar;
  };
  const marks = {};
  for (const id of ids) {
    marks[id] = {};
    let previous = null;
    for (let bar = 1; bar <= bars; bar++) {
      let label = null;
      if (free(id, bar)) label = allFree(bar) ? 'cadence' : 'free';
      if (label === 'cadence' && (previous !== 'cadence' || !allFree(bar - 1))) {
        marks[id][bar] = stretch(bar) <= 3 ? 'cadence' : 'free';
      } else if (label === 'free' && previous !== 'free') marks[id][bar] = 'free';
      previous = label;
    }
  }
  return marks;
}

/** One token of a music line: a bar line (possibly a repeat), or anything else up to the next space or bar line. */
const BAR_OR_WORD = /(:?\|[|\]:]?)|([^\s|:]+)|(\s+|:)/gy;

/** The abc with each mark written as an annotation above the first note or rest of its bar: "^free". */
export function withMarks(abc, marks) {
  const barOf = {}; // the bar each voice has reached, counted from 1
  return abc.split('\n').map((line) => {
    const match = /^(\[V:\s*([^\]\s]+)\]\s*)(.*)$/.exec(line);
    if (!match || !marks[match[2]]) return line;
    const id = match[2];
    barOf[id] ??= 1;
    let atBarStart = true;
    let out = '';
    for (const [token, bar, word] of match[3].matchAll(BAR_OR_WORD)) {
      if (bar) { barOf[id] += 1; atBarStart = true; out += token; continue; }
      if (word && atBarStart) {
        const label = marks[id][barOf[id]];
        out += label ? `"^${label}"${token}` : token;
        atBarStart = false;
        continue;
      }
      out += token;
    }
    return match[1] + out;
  }).join('\n');
}

/**
 * Where a voice takes a new role, as marks: { voice: { bar: 'now P' } }, from
 * an example's `roles` ({ R: { 12: 'P' } }: the staff named R leads, as P, from bar 12).
 */
export function roleMarks(example) {
  const roles = example.roles ?? {};
  return Object.fromEntries(Object.entries(roles).map(([id, bars]) => [id,
    Object.fromEntries(Object.entries(bars).map(([bar, role]) => [bar, `now ${role}`]))]));
}

/** Two sets of marks as one; where both mark the same bar, the labels are joined: 'now P, free'. */
export function joinMarks(first, second) {
  const out = {};
  for (const id of new Set([...Object.keys(first), ...Object.keys(second)])) {
    out[id] = { ...first[id] };
    for (const [bar, label] of Object.entries(second[id] ?? {})) {
      out[id][bar] = out[id][bar] ? `${out[id][bar]}, ${label}` : label;
    }
  }
  return out;
}

/**
 * The example as drawn: its abc, with where the canon goes free marked
 * (canonMarks) and any change of role (roleMarks), plus the imaginary cantus
 * as the bottom staff when asked for.
 */
export function drawnAbc(written, example) {
  const abc = withMarks(written, joinMarks(roleMarks(example), canonMarks(written, example)));
  if (!example.icf) return abc;
  const steps = imaginaryBars(written, example.canon);
  const sounding = steps.filter((step) => step !== null);
  const clef = clefsForVoice(sounding)[0] ?? 'bass';
  const header = `V:${ICF.id} clef=${clef} name="${ICF.name}"`;
  return withVoice(abc, header, `[V:${ICF.id}] ${wholeNotes(steps, unitLength(abc))} |]`);
}

/** Each voice of an abc tune as one list of notes with start times, as florid.js reads them. */
export function timelines(abc) {
  const voices = readVoices(abc);
  return Object.fromEntries(Object.entries(voices).map(([id, bars]) => {
    let start = 0;
    const notes = bars.flat().map((note) => {
      const timed = { ...note, start };
      start += note.length;
      return timed;
    });
    return [id, notes];
  }));
}

/** Only the voices named in `ids`, or all of them when `ids` is not given. */
function onlyVoices(voices, ids) {
  if (!ids) return voices;
  return Object.fromEntries(ids.map((id) => [id, voices[id]]));
}

/**
 * The dissonances to list under an example: every one on a strong beat, and
 * any to check on a weak beat. `ids` limits them to some voices, such as one
 * pair of alternative staves.
 */
export const dissonancesOf = (abc, ids) => worthShowing(dissonances(onlyVoices(timelines(abc), ids)));

/** The abc with each voice's |: … :| repeat written out `times` times, for playback (abcjs plays a repeat twice). */
export function withRounds(abc, times) {
  return abc.replace(/\|:(.*?):\|/g, (_, inside) => `| ${Array(times).fill(inside.trim()).join(' | ')} |`);
}

/** A voice's music without its final bar line, so more can follow it. */
const open = (music) => music.trim().replace(/\|\]$/, '').trim();

/**
 * What is heard for an example whose outer staves are alternatives, two ways
 * of setting the same middle voice that are not meant to sound together
 * (`alternatives: { upper, shared, lower }`, voice ids): the upper pair, a
 * bar's rest, then the lower pair. Any other example is heard as written.
 */
export function heardAbc(abc, example) {
  if (example.rounds) return withRounds(abc, example.rounds);
  if (!example.alternatives) return abc;
  const { upper, shared, lower } = example.alternatives;
  const music = voiceMusic(abc);
  const rest = `z${1 / unitLength(abc)}`;
  const header = abc.split('\n').filter((line) => line !== '' && !/^\[?V:/.test(line));
  return [
    ...header,
    `V:${upper} clef=treble`,
    `V:${lower} clef=bass`,
    `[V:${upper}] ${open(music[upper])} | ${rest} | ${open(music[shared])} |]`,
    `[V:${lower}] ${open(music[shared])} | ${rest} | ${open(music[lower])} |]`,
    '',
  ].join('\n');
}
