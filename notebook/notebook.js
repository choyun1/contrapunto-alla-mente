// The notebook page: draws and plays every example in examples.js, section by
// section, with the shared renderer in render.js.

import { SECTIONS } from './examples.js';
import { drawSection } from './render.js';

const main = document.getElementById('sections');
for (const section of SECTIONS) await drawSection(main, section);
// the sections are drawn after the page loads, so a link to one (from the theory pages) is followed here
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
