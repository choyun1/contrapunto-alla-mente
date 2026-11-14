// The canons the Continue the proposta drill offers: every two-voice canon and
// canon over a CF on the Notebook and WIP pages, in page order. Page data
// only; each entry is the page's own example (notebook/examples.js), so the
// notes, the interval of entrance and the delay are read from there.

import { SECTIONS } from '../notebook/examples.js';
import { WIP_SECTIONS } from '../wip/examples.js';

/**
 * Examples left out: the three-voice canon of IC p. 14 (a second risposta,
 * which this drill does not copy).
 */
const LEFT_OUT = ['ic14-three-voice-canon-c-minor.abc'];

/** The examples to drill: [{ id, title, source, file, canon, page }], page 'Notebook' or 'WIP'. */
export function drillExamples() {
  const pages = [['Notebook', SECTIONS], ['WIP', WIP_SECTIONS]];
  return pages.flatMap(([page, sections]) => sections.flatMap((section) => section.examples
    .filter((example) => example.canon && !LEFT_OUT.includes(example.file))
    .map((example) => ({
      id: example.file.replace(/\.abc$/, ''),
      title: example.title,
      source: example.source,
      file: example.file,
      canon: example.canon,
      page,
    }))));
}
