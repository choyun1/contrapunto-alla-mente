// Playback shaping for long notes. Each recorded note in the site's
// soundfont (SOUND_FONT_URL in playback.js) lasts only about 6 seconds, so a
// note held longer than that would fall silent before its end. That happened
// to the held final notes in canons whose voices enter two or more bars apart
// (Cho, 2026-11-14): the voice that finishes first holds for several bars.
//
// abcjs can only play a note as its sample from the start, so a long note was
// first played as tied restrikes, and each restrike's attack could be heard.
// Cho asked for a seamless join (2026-11-14), so now abcjs skips the long
// notes and this file plays them itself: the sample from its start, then its
// steady middle part again and again, each copy crossfaded into the next.
// Nothing changes in the score.
//
// takeLongNotes works on the note map abcjs makes just before it renders the
// sound: one list per voice of notes as { pitch, instrument, volume, start,
// end }, times in whole notes. This holds no music theory.

/** The longest a note may last and still be played by abcjs as one sample, in seconds (the samples last about 6). */
export const MAX_NOTE_SECONDS = 5.5;

/**
 * The part of every sample that is repeated, in seconds. Measured on the
 * violin, viola, cello and flute samples: after about 0.75 s their loudness
 * stays within 1 dB until about 5.75 s.
 */
export const LOOP = { from: 1, to: 5.5, crossfade: 1 };

/** Instruments whose samples die away, so a long note is left to die away too. */
const DECAYING = new Set(['acoustic_grand_piano']);

/**
 * Removes from the note map every note longer than `maxLength` (whole notes)
 * on an instrument that holds its sound, and returns them in one list.
 * Changes the note map in place.
 */
export function takeLongNotes(voices, maxLength) {
  const taken = [];
  for (const notes of voices) {
    const kept = [];
    for (const note of notes) {
      const isLong = note.end - note.start > maxLength + 1e-9;
      if (isLong && !DECAYING.has(note.instrument)) taken.push(note);
      else kept.push(note);
    }
    notes.splice(0, notes.length, ...kept);
  }
  return taken;
}

/**
 * The copies of a sample that make one note `seconds` long: each copy is
 * { at, from, length } in seconds (where it starts in the note, where it
 * starts in the sample, and how long it plays). The first copy is the sample
 * from its start; each later one is the loop part, overlapping the copy
 * before it by `loop.crossfade`.
 */
export function sustainCopies(seconds, loop = LOOP) {
  const copies = [{ at: 0, from: 0, length: loop.to }];
  const step = loop.to - loop.from - loop.crossfade;
  let at = loop.to - loop.crossfade;
  while (copies.at(-1).at + copies.at(-1).length < seconds) {
    copies.push({ at, from: loop.from, length: loop.to - loop.from });
    at += step;
  }
  return copies;
}

/**
 * The gain of one copy `t` seconds into it: rises over the crossfade (unless
 * it is the first copy), falls over the crossfade (unless it is the last),
 * along the quarter sine and cosine so the loudness stays level across a join.
 */
export function copyGain(t, length, crossfade, isFirst, isLast) {
  let gain = 1;
  if (!isFirst && t < crossfade) gain *= Math.sin((Math.PI / 2) * (t / crossfade));
  if (!isLast && t > length - crossfade) gain *= Math.cos((Math.PI / 2) * ((t - (length - crossfade)) / crossfade));
  return gain;
}

/**
 * Adds one long note into `out` (an array of channels): the copies of
 * `sample` (an array of channels) from sustainCopies, starting at sample
 * index `start`, at `gain`, for `seconds`, then fading to silence over
 * `fadeSeconds` the way abcjs ends a note. Changes `out` in place.
 */
export function mixLongNote(out, sample, rate, { start, seconds, gain, fadeSeconds }, loop = LOOP) {
  const copies = sustainCopies(seconds + fadeSeconds, loop);
  const end = Math.floor((seconds + fadeSeconds) * rate);
  copies.forEach((copy, i) => {
    const at = Math.floor(copy.at * rate);
    const from = Math.floor(copy.from * rate);
    const length = Math.floor(copy.length * rate);
    for (let n = 0; n < length && at + n < end; n += 1) {
      const t = n / rate;
      const noteTime = (at + n) / rate;
      const ending = noteTime > seconds ? 1 - (noteTime - seconds) / fadeSeconds : 1;
      const g = gain * ending * copyGain(t, copy.length, loop.crossfade, i === 0, i === copies.length - 1);
      out.forEach((channel, c) => {
        const source = sample[Math.min(c, sample.length - 1)];
        if (start + at + n < channel.length) channel[start + at + n] += g * (source[from + n] ?? 0);
      });
    }
  });
  return out;
}

const FILE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** The soundfont's file name for a MIDI pitch, spelled with flats as abcjs does: 60 is C4, 61 is Db4. */
export function sampleName(pitch) {
  return FILE_NAMES[pitch % 12] + (Math.floor(pitch / 12) - 1);
}

const samples = new Map(); // url -> Promise of decoded AudioBuffer

/** The decoded sample for one note, fetched once (abcjs has already fetched it, so it comes from the browser cache). */
function sampleOf(audioContext, soundFontUrl, note) {
  const url = `${soundFontUrl}${note.instrument}-mp3/${sampleName(note.pitch)}.mp3`;
  if (!samples.has(url)) {
    samples.set(url, fetch(url).then((r) => r.arrayBuffer()).then((data) => audioContext.decodeAudioData(data)));
  }
  return samples.get(url);
}

/**
 * Plays the notes from takeLongNotes into a primed abcjs synth's sound, at
 * the loudness abcjs gives a note (its own formula, place-note.js in abcjs
 * 6.4.4). Resolves once they are all mixed in.
 */
export async function placeLongNotes(synth, notes, audioContext, soundFontUrl) {
  const [buffer] = synth.audioBuffers ?? [];
  if (!buffer) return;
  const secondsPerWhole = synth.millisecondsPerMeasure / 1000 / synth.meterSize;
  const out = [];
  for (let c = 0; c < buffer.numberOfChannels; c += 1) out.push(buffer.getChannelData(c));
  for (const note of notes) {
    const decoded = await sampleOf(audioContext, soundFontUrl, note);
    const sample = [];
    for (let c = 0; c < decoded.numberOfChannels; c += 1) sample.push(decoded.getChannelData(c));
    mixLongNote(out, sample, buffer.sampleRate, {
      start: Math.floor(note.start * secondsPerWhole * buffer.sampleRate),
      seconds: (note.end - note.start) * secondsPerWhole,
      gain: (note.volume / 96) * synth.soundFontVolumeMultiplier,
      fadeSeconds: synth.fadeLength / 1000,
    });
  }
}
