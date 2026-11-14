// The end of every played example: the final chord rings on for RING_SECONDS
// past its written end and fades away, so the sound tapers instead of being
// cut off (Cho, 2026-11-14: "make sure the end of the sound file isn't
// clipped ... uniform across the site"). playback.js lengthens the final
// chord (final-chord.js, ringOn) and then fades the rendered sound here.
//
// The fade ends where the sound really ends, not at the end of the buffer:
// each recorded note in the soundfont lasts only a few seconds, so a long
// final chord at a slow tempo can run out of sample before its written end,
// which is what sounded clipped. Fading the last stretch before that point
// turns the cut into a decay.
// This holds no music theory and runs in the browser and in Node.

/** How long the final chord rings past its written end while it fades, in seconds. */
export const RING_SECONDS = 1.5;

/**
 * The gain at a point of the fade, from 1 at its start to 0 at its end
 * (`progress` from 0 to 1): a raised-cosine curve, which starts and ends gently.
 */
export function fadeGain(progress) {
  return 0.5 * (1 + Math.cos(Math.PI * Math.min(1, Math.max(0, progress))));
}

/** Below this a sample counts as silence. */
const SILENCE = 1e-4;

/** The index just after the last audible sample in any channel (0 for silence throughout). */
export function soundEnd(channels) {
  let end = 0;
  for (const samples of channels) {
    for (let i = samples.length - 1; i >= end; i -= 1) {
      if (Math.abs(samples[i]) > SILENCE) { end = i + 1; break; }
    }
  }
  return end;
}

/**
 * Fades each channel (an array of samples, such as an AudioBuffer's
 * getChannelData) to silence over the last `seconds` before the sound ends.
 * Changes the channels in place.
 */
export function fadeOut(channels, sampleRate, seconds) {
  const end = soundEnd(channels);
  const length = Math.min(end, Math.round(seconds * sampleRate));
  const first = end - length;
  for (const samples of channels) {
    for (let i = 0; i < length; i += 1) {
      samples[first + i] *= fadeGain(i / length);
    }
  }
}
