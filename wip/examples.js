// The WIP page: unfinished sketches, Cho's reworks of examples the Notebook
// marks as not working, and failed attempts kept for what they teach. The
// entries take the same fields as notebook/examples.js (see the comment there),
// and the abc files live with the Notebook's, in notebook/examples/.

import { canon } from '../notebook/examples.js';

/** A link to an example on the Notebook page, by its anchor (its file name without '.abc'). */
const notebookLink = (id, text) => `<a href="../notebook/#${id}">${text}</a>`;

export const WIP_SECTIONS = [
  {
    id: 'sketches',
    title: 'Sketches',
    intro: 'Pieces that were started and not finished.',
    procedure: [],
    examples: [
      {
        file: 'wip07-canon-over-leoni.abc',
        title: 'Canon at the 5th above over Leoni',
        source: 'WIP p. 7',
        note: '“Canon over ‘Leoni’.” It stops after six bars.',
        caption: 'The last R note (E) leaves the canon, which would have D.',
        canon: canon(4, 1, [1, 5]),
        icf: true,
      },
      {
        file: 'ic14-three-voice-canon-c-minor.abc',
        title: 'Three-voice canon in C minor, unfinished',
        source: 'IC p. 14',
        note: 'The page is crossed out and marked as not working. R enters a 5th below P after two bars and R2 an '
          + 'octave below R after three more; the voices stop one by one.',
        caption: 'R follows P for four bars; R2 follows R for three.',
        canon: canon(-4, 2, [1, 4]),
        icf: false,
      },
    ],
  },
  {
    id: 'reworks',
    title: 'Reworks',
    intro: 'New versions of Notebook examples that are marked as not working. Each will link back to its original, '
      + 'which stays on the Notebook page as written. Waiting to be reworked: '
      + `${notebookLink('ic19c-canon-5th-below-f-with-ficta', 'IC p. 19, third and fourth systems')} `
      + '(octaves going into bar 6, unisons at the end of bar 14).',
    procedure: [],
    examples: [
      {
        file: 'ic20r-canon-12th-c-minor-rework.abc',
        title: 'Canon at the 12th in C minor, reworked',
        source: 'IC p. 20, reworked 2026-11-13',
        note: `A rework of ${notebookLink('ic20-canon-12th-c-minor', 'IC p. 20')}, which the page marks “needs editing.” `
          + 'Three bars of P are new, to give the line more shape: bar 3 (F, E♭, F, G), bar 6 (D, a leap down to B♭ and up to F, '
          + 'then E♭ D) and bar 8 (B♭, A♭, G). R answers each a 12th above, a bar later. From bar 12 the voices trade names, as in the original.',
        roles: { R: { 12: 'P' }, P: { 12: 'R' } },
      },
    ],
  },
  {
    id: 'failed-attempts',
    title: 'Failed attempts',
    intro: 'Crossed-out drafts, kept to learn from: each one shows a rule by breaking it. '
      + '<b>IC p. 27, first system</b> (not transcribed; whole notes, a canon at the 5th below) is one more: '
      + 'P moves up a 3rd (+2) twice, a move that is not in the page’s own margin list for a canon at the 5th below '
      + '(+3, +1, 0, −2, −4), and both times R sounds a 7th against it a bar later. Copied strictly, '
      + 'P’s F becomes B♮ in R, a tritone, and R stops copying after bar 4. '
      + 'That list is the rule this draft breaks: a move outside it makes a dissonance one delay later.',
    procedure: [],
    examples: [
      {
        file: 'ic29c-invertible-12th-crossed-out.abc',
        title: 'Invertible counterpoint at the 12th, crossed out',
        source: 'IC p. 29, second system',
        note: '“Jv = −11.” The original leans on 6ths (5), and at the 12th '
          + 'a 6th becomes a 7th (5 − 11 = −6): bars 4, 5, 6 and 9 put a 7th on the beat in the derivative. '
          + 'The page’s row of derivative numbers stops after two bars.',
        caption: 'The last note of the original looks like E, but its number (4) and the derivative’s C say G.',
        alternatives: { upper: 'O', shared: 'CF', lower: 'D', shift: -11 },
      },
    ],
  },
];
