import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inStrings } from '../src/notation/playback.js';

test('the notebook plays in strings by clef: violin on treble, viola on alto, cello on bass', () => {
  const abc = 'V:A clef=treble\nV:B clef=alto\nV:C clef=bass\n[V:A] c4 |]\n[V:B] C4 |]\n[V:C] C,4 |]\n[V:A] d4 |]\n';
  const programs = [...inStrings(abc).matchAll(/%%MIDI program (\d+)/g)].map((m) => Number(m[1]));
  assert.deepEqual(programs, [40, 41, 42]); // once per voice, before its first line
});
