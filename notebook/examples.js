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
//
// With `alternatives: { upper, shared, lower, shift }` the outer staves are
// two ways of setting the shared middle voice, not meant to sound together
// (invertible counterpoint: the lower is the upper moved `shift` steps, e.g.
// −11 at the 12th). The page plays the upper pair, a bar's rest, then the
// lower pair, and checks each pair on its own; the test checks the shift.

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
    ],
  },
  {
    id: 'two-voice-canons',
    title: 'Canons without a cantus',
    intro: 'Free canons in two voices (one with a second answer), from the pages after the canons '
      + 'over a cantus. P leads and R follows.',
    examples: [
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
        file: 'ic25a-infinite-canon-octave.abc',
        title: 'Infinite canon at the octave, in F',
        source: 'IC p. 25, top',
        note: '“2-part ∞ canon @ Jv = 7.” P’s bars 2–4 go round, since its bar 4 is its bar 1 '
          + 'again; here they go round three times, and the canon stops on whole notes, A over F. '
          + 'The page’s other drafts (in F and in G) are crossed out and scribbled over, and are left out.',
        canon: canon(-7, 1, [1, 9]),
        icf: false,
      },
      {
        file: 'ic26a-infinite-canon-octave-g.abc',
        title: 'Infinite canon at the octave, in G',
        source: 'IC p. 26, middle',
        note: '“OK!” R answers an octave below, one bar later. P’s bars 2–8 go round three times, '
          + 'and the canon stops on whole notes, B over G. The page’s canons '
          + 'in F are left out for now: the first is crossed out, and the second is written too '
          + 'densely to read reliably from the scan.',
        canon: canon(-7, 1, [1, 21]),
        icf: false,
      },
      {
        file: 'ic21-canon-5th-and-octave.abc',
        title: 'Canon at the 5th above or the octave below',
        source: 'IC p. 21',
        note: '“Canon @ 5th / 8th.” One proposta, two answers: R a 5th above (top staff) or an '
          + 'octave below (bottom staff), which are a 12th apart, so P with R is invertible at the 12th. '
          + 'The two answers are alternatives: the upper pair plays first, then the lower pair.',
        canon: canon(4, 1, [1, 13]),
        alternatives: { upper: 'R', shared: 'P', lower: 'R8', shift: -11 },
        icf: false,
      },
    ],
  },
  {
    id: 'invertible',
    title: 'Invertible counterpoint over a cantus',
    intro: 'A line over a cantus firmus (the original, top staff) and the same line moved below '
      + 'it (the derivative, bottom staff), as in Taneyev’s Jv: the derivative is the original '
      + 'moved Jv steps (zero-indexed: −7 an octave, −11 a 12th). The two are alternatives, '
      + 'so the original and cantus play first, then the cantus and derivative.',
    examples: [
      {
        file: 'ic23a-invertible-12th.abc',
        title: 'Invertible counterpoint at the 12th, in D minor',
        source: 'IC p. 23, top',
        note: '“Invertible counterpoint @ 12th (Jv = −11).” “Consonances (5th, octave, 3rd); '
          + '6th/7th lead to suspensions.”',
        alternatives: { upper: 'O', shared: 'CF', lower: 'D', shift: -11 },
      },
      {
        file: 'ic29a-invertible-octave-c.abc',
        title: 'Invertible counterpoint at the octave, in C',
        source: 'IC p. 29, first system',
        note: '“What if 5ths are dissonant?” Jv = −7. Cho wrote each note’s interval from the '
          + 'cantus above it and below it; the 5ths (4) become 4ths (−3) and fall on weak beats.',
        caption: 'The page’s Jv = −11 system is crossed out, and the last system is unfinished; '
          + 'both are left out.',
        alternatives: { upper: 'O', shared: 'CF', lower: 'D', shift: -7 },
      },
      {
        file: 'ic29b-invertible-octave-dorian.abc',
        title: 'Invertible counterpoint at the octave, in D dorian',
        source: 'IC p. 29, third system',
        note: '“Jv = −7 = n − m.” The same exercise over Fux’s dorian cantus, with C♯ at the cadences.',
        caption: 'The derivative is drawn a step or so low on the bass staff in places; it is read '
          + 'here from the interval numbers.',
        alternatives: { upper: 'O', shared: 'CF', lower: 'D', shift: -7 },
      },
    ],
  },
];
