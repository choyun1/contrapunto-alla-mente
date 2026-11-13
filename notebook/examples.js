// The notebook: worked examples from Cho's handwritten counterpoint notebooks,
// transcribed into abc (one file per example in examples/). This file is the
// list the page draws, from the simplest kind of exercise to the hardest, with
// where each one comes from. Each section gives its procedure, step by step,
// before its examples; `diagram: 'icf'` adds the imaginary-cantus diagram.
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
//
// With `rounds`, an infinite canon is drawn with its repeat signs and heard
// going round the repeat that many times before the ending.

/** One canon over a cantus firmus in the usual voice names: P leads, R follows, CF is the cantus. */
const canon = (entry, delay, ...spans) => ({ lead: 'P', follow: 'R', entry, delay, spans });

export const SECTIONS = [
  {
    id: 'two-voice-canons',
    title: 'Two-part canons',
    intro: 'The simplest: a proposta (P) and its risposta (R), with no cantus. R copies P one delay later, '
      + 'moved by the interval of entry.',
    procedure: [
      'Choose the interval of entry and the delay. Intervals are zero-indexed: a 5th is 4, an octave 7, a 12th 11, negative when R is below.',
      'Write one bar of P, then copy it into R one delay later, moved by the interval.',
      'Write P’s next bar against the R already written under it. Each new P bar also fixes an R bar to come, so check the melodic step it makes in R too (IC p. 13: “the melodic interval must follow the rules @ distance of two measures”).',
      'Use ficta (B♭, F♯) where the copy needs it to keep its interval exact (IC p. 19, “w/ ficta”).',
      'When the canon can go no further, let both voices go free into a cadence. The score marks where the strict canon stops.',
    ],
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
        note: '“w/ ficta.” P leads in the alto clef and R answers a 5th above; the B♭s are the ficta. '
          + 'P’s last C is held over two bars while R answers it.',
        canon: canon(4, 1, [1, 8]),
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
    ],
  },
  {
    id: 'infinite-canons',
    title: 'Infinite canons',
    intro: 'A two-part canon that can go round for ever: P comes back to its first bar, so R’s copy lines up again.',
    procedure: [
      'Write a two-part canon as above, bar by bar.',
      'Steer P back to its own first bar, sounding against R just as it did at the start. From then on the bars between go round, and R goes round with them.',
      'To stop, leave the loop at the end of a round and end both voices on a consonance, here whole notes on the third and the tonic.',
    ],
    examples: [
      {
        file: 'ic25a-infinite-canon-octave.abc',
        title: 'Infinite canon at the octave, in F',
        source: 'IC p. 25, top',
        note: '“2-part ∞ canon @ Jv = 7.” P’s bars 2–4 go round, since its bar 4 is its bar 1 '
          + 'again, and the canon stops on whole notes, A over F. The page’s other drafts (in F and in G) '
          + 'are crossed out and scribbled over, and are left out.',
        caption: 'Playback goes round the repeat three times before the ending.',
        canon: canon(-7, 1, [1, 3]),
        rounds: 3,
        icf: false,
      },
      {
        file: 'ic26a-infinite-canon-octave-g.abc',
        title: 'Infinite canon at the octave, in G',
        source: 'IC p. 26, middle',
        note: '“OK!” R answers an octave below, one bar later. P’s bars 2–8 go round, '
          + 'and the canon stops on whole notes, B over G. The page’s canons '
          + 'in F are left out for now: the first is crossed out, and the second is written too '
          + 'densely to read reliably from the scan.',
        caption: 'Playback goes round the repeat three times before the ending.',
        canon: canon(-7, 1, [1, 7]),
        rounds: 3,
        icf: false,
      },
    ],
  },
  {
    id: 'two-answers',
    title: 'One proposta, two answers',
    intro: 'One P answered two ways at once: R a 5th above and R8 an octave below. The two answers are a 12th apart, '
      + 'so P with R is invertible counterpoint at the 12th (Jv = −11).',
    procedure: [
      'Write P so that it works as a canon at both intervals: at the 5th above and at the octave below.',
      'Avoid the moves that fail at either one (IC p. 21: “5/8 ⇒ no 2nd up or 3rd up”).',
      'Check P with each answer on its own. The two answers are alternatives, so the page plays the upper pair, then the lower pair.',
    ],
    examples: [
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
    intro: 'A line over a cantus firmus (the original, top staff) and the same line moved below it (the derivative, '
      + 'bottom staff). There are three staves, but only two sound at a time: each outer voice must work with the cantus.',
    procedure: [
      'Choose Jv, the shift that takes the original below the cantus: −7 for the octave, −11 for the 12th (Taneyev; zero-indexed).',
      'For each note, write its interval from the cantus above the staff (n) and the derivative’s below it (n + Jv), as on IC p. 29.',
      'Check both numbers on every beat. At the octave a 5th (4) becomes a 4th (−3), so treat 5ths as dissonances (IC p. 29: “What if 5ths are dissonant?”). At the 12th a 6th (5) becomes a 7th (−6), so 6ths and 7ths must come as suspensions (IC p. 23).',
      'Play both pairs: original and cantus, then cantus and derivative.',
    ],
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
  {
    id: 'canon-over-cantus',
    title: 'Canons over a cantus firmus, with the imaginary cantus',
    intro: 'The hardest here: a two-part canon over a cantus firmus, written with the imaginary cantus (I.C.F.) of the '
      + '<a href="../canon/over-cantus.html">Canon over a c.f.</a> page. The gray I.C.F. staff is drawn but not played. '
      + 'It is worked out from the cantus here, so it can sit an octave or two away from where it is on paper.',
    diagram: 'icf',
    procedure: [
      'Choose the interval of entry and the delay. The I.C.F. is the cantus moved the other way by that interval and one delay earlier (IC p. 5: “I.C.F. is a 5th below, since R follows 5th above”).',
      'Write P against both the CF and the I.C.F. What P forms against the I.C.F. now, R will form against the CF one delay later (IC p. 10: “Check P + I.C.F. ⇒ R + CF”).',
      'Copy P into R as in a two-part canon, and check P against R.',
      'Bellermann’s rule: check every two-voice pair. With P, R and CF that is P + CF, P + R and R + CF, and the I.C.F. turns R + CF into P + I.C.F., which is checked while P is written (WIP p. 11).',
      'When the cantus ends, or the canon can go no further, leave it for a free cadence.',
    ],
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
];
