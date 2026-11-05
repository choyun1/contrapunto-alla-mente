// Runs in a Web Worker for the three-voice page: searches every split of every
// total Jv for one starting note and posts each result as it is found, so the
// page stays responsive during the search (about 15–30 seconds in all). All
// the music comes from src/taneyev/three-voice-pick.js.

import { exampleForSplit } from '../src/taneyev/three-voice-pick.js';
import { splitShift } from '../src/taneyev/three-voices.js';
import { allShifts } from '../src/taneyev/shifts.js';

/** Searches from `start` and posts { total, split, kind } per split ('first', 'mixed' or null), then { done }. */
self.onmessage = ({ data: { start } }) => {
  for (const total of allShifts()) {
    for (const split of splitShift(total)) {
      const found = exampleForSplit(split, { start });
      self.postMessage({ total, split, kind: found ? found.kind : null });
    }
  }
  self.postMessage({ done: true });
};
