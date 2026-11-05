// Builds the list at the bottom of the three-voice page once, at deploy time,
// so the page loads it instead of searching for 15–30 seconds.
//
//   node scripts/build-survey.js _site/data/three-voice-survey.json
//
// Writes { "<starting step>": { first: [[total, upper, lower], …], mixed: […] } }
// for every starting note the page offers. Each starting note is searched in
// its own worker thread, as many at once as there are CPUs.

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { STARTING_NOTES, surveyFrom } from '../src/taneyev/three-voice-pick.js';

/** Searches one starting note in a worker thread; resolves to its survey. */
function searchInWorker(start) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { start } });
    worker.once('message', resolve);
    worker.once('error', reject);
  });
}

/** Runs every starting note, `limit` at a time, and writes the file. */
async function main(outFile) {
  const starts = [];
  for (let step = STARTING_NOTES.from; step <= STARTING_NOTES.to; step += 1) starts.push(step);
  const result = {};
  const queue = [...starts];
  const runOne = async () => {
    while (queue.length) {
      const start = queue.shift();
      result[start] = await searchInWorker(start);
      console.log(`starting step ${start}: ${result[start].first.length} first, ${result[start].mixed.length} mixed`);
    }
  };
  await Promise.all(Array.from({ length: availableParallelism() }, runOne));
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(result));
}

if (isMainThread) {
  await main(process.argv[2] ?? '_site/data/three-voice-survey.json');
} else {
  parentPort.postMessage(surveyFrom(workerData.start));
}
