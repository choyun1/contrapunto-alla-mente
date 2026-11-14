// The WIP page: draws and plays every example in wip/examples.js, section by
// section, with the Notebook's renderer (notebook/render.js).

import { WIP_SECTIONS } from './examples.js';
import { drawSection } from '../notebook/render.js';

const main = document.getElementById('sections');
for (const section of WIP_SECTIONS) await drawSection(main, section);
// the sections are drawn after the page loads, so a link to one example (from the Notebook) is followed here
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
