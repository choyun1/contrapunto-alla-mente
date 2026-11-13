// The notebook: worked examples from Cho's handwritten counterpoint notebooks,
// transcribed into abc (one file per example in examples/). This file is the
// list the page draws, in page order, with where each one comes from.
//
// Sources are the scanned notebooks: "IC" is Invertible counterpoint, "WIP"
// is the work-in-progress book. Page numbers are the PDF's pages.
//
// Each example with a `canon` names the leading and following voice, the
// interval of entrance in steps (zero-indexed: 5th 4, octave 7, 12th 11;
// negative when the risposta is below) and the delay in bars. `spans` are the
// leader's bars, [first, last] counted from 1, that the follower copies
// exactly; the cadences and free passages between them are left out. A span
// can give its own delay as a third number, [first, last, delay], for an
// exercise whose second canon enters at another distance.
// test/notebook.test.js checks them against the notes. With
// `icf`, the page adds the imaginary cantus (src/taneyev/imaginary-cantus.js)
// as a gray staff that is drawn but not played, as Cho drew it on the page.

/** One canon over a cantus firmus in the usual voice names: P leads, R follows, CF is the cantus. */
const canon = (entry, delay, ...spans) => ({ lead: 'P', follow: 'R', entry, delay, spans });

export const SECTIONS = [
  {
    id: 'canon-over-cantus',
    title: 'Canons over a cantus firmus',
    intro: 'Two-voice canons written over a cantus firmus by the imaginary-cantus method of the '
      + '<a href="../canon/over-cantus.html">Canon over a c.f.</a> page. P is the proposta, R the risposta '
      + 'and CF the cantus. The gray I.C.F. staff is the imaginary cantus, drawn but not played: '
      + 'what P forms against it, R forms against the CF one delay later. It is worked out from '
      + 'the cantus here, so it can sit an octave or two away from where it is on paper.',
    examples: [
      {
        file: 'ic05a-canon-5th-above.abc',
        title: 'Canon at the 5th above, delay of one bar',
        source: 'IC p. 5, top',
        note: '“CF + 2 part canon.” The I.C.F. is a 5th below, “since R follows 5th above.” '
          + 'Check P + CF, P + R and P + I.C.F.; P + I.C.F. never sounds but guarantees R + CF.',
        canon: canon(4, 1, [1, 5]),
        icf: true,
      },
      {
        file: 'ic05b-canon-5th-above-b-flat.abc',
        title: 'Canon at the 5th above, in B♭',
        source: 'IC p. 5, bottom',
        note: '“Problematic intervals such as 7th & 9th should be dealt with in the measure before!” '
          + 'R’s F in bar 3 is a 9–8 suspension over the E♭.',
        caption: 'P’s last note could be E♭ rather than D.',
        canon: canon(4, 1, [1, 6]),
        icf: true,
      },
      {
        file: 'ic06a-canon-5th-above.abc',
        title: 'Canon at the 5th above, in D minor',
        source: 'IC p. 6, top',
        note: '“Good cadence.” R’s G in bar 4 is a 7–6 suspension over the A.',
        canon: canon(4, 1, [1, 4]),
        icf: true,
      },
      {
        file: 'ic06b-canon-12th-above.abc',
        title: 'Canon at the 12th above, CF in the middle',
        source: 'IC p. 6, middle',
        note: '“Cadence.”',
        canon: canon(11, 1, [1, 5]),
        icf: true,
      },
      {
        file: 'ic06c-canon-12th-cf-on-top.abc',
        title: 'Canon at the 12th above, CF on top',
        source: 'IC p. 6, bottom',
        note: '“Cadence.”',
        canon: canon(11, 1, [1, 5]),
        icf: true,
      },
      {
        file: 'ic07-canon-12th-to-dominant-and-back.abc',
        title: 'Canon at the 12th above, to the dominant and back, in A',
        source: 'IC p. 7',
        note: 'One exercise in two halves: the first modulates to the dominant, the second starts '
          + 'there and comes home. The first cadence is crossed out with “go to bottom,” and bars 6–9 '
          + 'are the ending written at the bottom of the page. Then: “This CF is not suitable for upper '
          + 'voice leading.” Each bar on the page is labeled with its interval numbers mod 7.',
        caption: 'On paper the CF is in the tenor clef.',
        canon: canon(11, 1, [1, 5], [10, 14]),
        icf: true,
      },
      {
        file: 'ic10-canon-5th-below-then-free.abc',
        title: 'Canon at the 5th below, delay of two bars, then free',
        source: 'IC p. 10, top and middle',
        note: '“I.C.F. is very important! Write w/ CF.” and “Check P + I.C.F. ⇒ R + CF.” '
          + 'From bar 8 both voices are marked “free,” stopping on the dominant.',
        canon: canon(-4, 2, [1, 5]),
        icf: true,
      },
      {
        file: 'wip07-canon-over-leoni.abc',
        title: 'Canon at the 5th above over Leoni',
        source: 'WIP p. 7',
        note: '“Canon over ‘Leoni’.” It stops after six bars.',
        caption: 'The last R note (E) leaves the canon, which would have D.',
        canon: canon(4, 1, [1, 5]),
        icf: true,
      },
    ],
  },
  {
    id: 'two-voice-canons',
    title: 'Canons without a cantus',
    intro: 'Free canons in two voices (one in three), from the pages after the canons over a cantus. '
      + 'P leads and R follows. Some of these Cho marked “bad” or “garbage” at the time; they are '
      + 'here to be heard again.',
    examples: [
      {
        file: 'ic13-canon-12th-two-bars.abc',
        title: 'Canon at the 12th above, delay of two bars, with ficta',
        source: 'IC p. 13',
        note: '“Canon @ 12th (Jh ≠ 1) w/ ficta.” “The melodic interval must follow the rules @ '
          + 'distance of two measures!!” The canon holds to bar 25; bars 26–31 are the cadence, '
          + 'marked “Cadence.” At the end: “garbage!”',
        caption: 'The sharps in R (F♯, D♯) are ficta: P has B and G♯ there.',
        canon: canon(11, 2, [1, 25]),
        icf: false,
      },
      {
        file: 'ic14-three-voice-canon-c-minor.abc',
        title: 'Three-voice canon in C minor, unfinished',
        source: 'IC p. 14',
        note: '“?? bad!” The page is crossed out. R enters a 5th below P after two bars and R2 an '
          + 'octave below R after three more; the voices stop one by one.',
        caption: 'R follows P for four bars; R2 follows R for three.',
        canon: canon(-4, 2, [1, 4]),
        icf: false,
      },
      {
        file: 'ic15-canon-12th-below-g-minor.abc',
        title: 'Canon at the 12th below, delay of three bars, in G minor',
        source: 'IC p. 15',
        note: 'The canon holds to bar 17; the last three bars of R are free, to the cadence. At the '
          + 'end: “garbage!”',
        canon: canon(-11, 3, [1, 14]),
        icf: false,
      },
      {
        file: 'ic18-canon-12th-below-hexachords.abc',
        title: 'Canon at the 12th below, delay of one bar, through the hexachords',
        source: 'IC p. 18',
        note: '“Incomprehensible nonsense!” The page is crossed out. The hexachords are marked over '
          + 'the staves (V, I, IV, V, I); R takes B♭ where P’s line is in the IV (F) hexachord.',
        caption: 'R’s flats are written on the page; they are ficta, since P has F there.',
        canon: canon(-11, 1, [1, 19]),
        icf: false,
      },
      {
        file: 'ic19a-canon-5th-below-b-flat.abc',
        title: 'Two-part canon at the 5th (a 12th below), in B♭',
        source: 'IC p. 19, top',
        note: '“2-part canon @ 5th.” R answers a 5th below, an octave lower, so a 12th. The page '
          + 'opens with a sketch of the two hexachords, which is left out here.',
        canon: canon(-11, 1, [1, 6]),
        icf: false,
      },
      {
        file: 'ic19b-canon-5th-above-with-ficta.abc',
        title: 'Canon at the 5th above, with ficta',
        source: 'IC p. 19, second system',
        note: '“w/ ficta.” P leads in the alto clef and R answers a 5th above; the B♭s are the ficta.',
        canon: canon(4, 1, [1, 7]),
        icf: false,
      },
      {
        file: 'ic19c-canon-5th-below-f-with-ficta.abc',
        title: 'Canon at the 5th below, in F, with ficta',
        source: 'IC p. 19, third and fourth systems',
        note: '“w/ ficta.” R follows to bar 14; its bar 15 is free, with a C♯ into the close.',
        caption: 'R’s last note is drawn on C; it is read here as D, after the C♯.',
        canon: canon(-4, 1, [1, 13]),
        icf: false,
      },
      {
        file: 'ic19d-canon-12th-above-failed.abc',
        title: 'Canon at the 12th above, in B♭',
        source: 'IC p. 19, bottom',
        note: '“failed!” R goes its own way in bars 5–6 (P’s D is answered by G, not A), '
          + 'then follows strictly to the end.',
        canon: canon(11, 1, [1, 3], [6, 14]),
        icf: false,
      },
    ],
  },
];
