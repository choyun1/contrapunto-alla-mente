// The notebook: worked examples from Cho's handwritten counterpoint notebooks,
// transcribed into abc (one file per example in examples/). This file is the
// list the page draws, from the simplest kind of exercise to the hardest, with
// where each one comes from. Each section gives its procedure, step by step,
// before its examples, each step with a few bars that show it where that
// helps; `diagram: 'icf'` adds the imaginary-cantus diagram.
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

/**
 * One step of a section's procedure: its text, the excerpt that shows it
 * (notebook/snippets.js), if any, and any table of allowed moves
 * (notebook/moves-table.js): [{ title, answers: [{ label, entry }] }].
 */
const step = (text, snippet = null, moves = null) => ({ text, snippet, moves });

/** One canon over a cantus firmus in the usual voice names: P leads, R follows, CF is the cantus. */
export const canon = (entry, delay, ...spans) => ({ lead: 'P', follow: 'R', entry, delay, spans });

export const SECTIONS = [
  {
    id: 'two-voice-canons',
    title: 'Two-part canons',
    intro: 'The simplest: a proposta (P) and its risposta (R), with no cantus. R copies P one delay later, '
      + 'moved by the interval of entry.',
    procedure: [
      step('Choose the interval of entry and the delay. Intervals are zero-indexed: a 5th is 4, an octave 7, a 12th 11, negative when R is below.',
        { file: 'ic19a-canon-5th-below-b-flat.abc', bars: [1, 2], labels: { R: { 2: 'R: a 12th below, a bar later' } } }),
      step('Write one bar of P, then copy it into R one delay later, moved by the interval.',
        { file: 'ic19a-canon-5th-below-b-flat.abc', bars: [1, 3], color: [['P', 1, 'a'], ['R', 2, 'a'], ['P', 2, 'b'], ['R', 3, 'b']] }),
      step('Write P’s next bar against the R already written under it. Each new P bar also fixes an R bar to come, so check the melodic step it makes in R too (IC p. 13: “the melodic interval must follow the rules @ distance of two measures”).',
        { file: 'ic19a-canon-5th-below-b-flat.abc', bars: [2, 3], color: [['P', 2, 'a'], ['R', 2, 'a'], ['R', 3, 'b']], labels: { P: { 2: 'new bar of P' }, R: { 2: 'checked against this', 3: 'and copied here' } } }),
      step('Use ficta (B♭, F♯) where the copy needs it to keep its interval exact (IC p. 19, “w/ ficta”).',
        { file: 'ic19b-canon-5th-above-with-ficta.abc', bars: [4, 5], color: [['P', 4, 'a'], ['R', 5, 'a']], labels: { P: { 4: 'B♭ in P' }, R: { 5: 'answered by F' } } }),
      step('When the canon can go no further, let both voices go free into a cadence. The scores mark where the strict canon stops.',
        { file: 'ic19a-canon-5th-below-b-flat.abc', bars: [6, 8] }),
    ],
    examples: [
      {
        file: 'ic27a-canon-octave-f.abc',
        title: 'Canon at the octave, in F',
        source: 'IC p. 27, fourth system',
        note: '“Canon @ octave.” P in the bass, R an octave above a bar later, strict to the end. '
          + 'The page numbers every interval between the voices, zero-indexed, with a tick for one octave more (2′ is a 10th).',
        canon: canon(7, 1, [1, 7]),
        icf: false,
      },
      {
        file: 'ic28b-canon-octave-d-minor.abc',
        title: 'Canon at the octave above, in D minor',
        source: 'IC p. 28, second system',
        note: 'P in the bass, R an octave above a bar later; the C♯ leading tone is copied too. The page numbers every interval.',
        canon: canon(7, 1, [1, 6]),
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
      {
        file: 'ic17a-canon-12th-above-g.abc',
        title: 'Canon at the 12th above, in G, out to the dominant',
        source: 'IC p. 17, third and fourth systems',
        note: '“OK!” From the page “Hexachords / modulations for canon @ 5th”: P in the bass, R a 12th above a bar later. '
          + 'R’s C♯s are the ficta for V/V (“no leading tone in the proposta!”), and it turns to IV at bar 8 with F♮.',
        canon: canon(11, 1, [1, 12]),
        icf: false,
      },
      {
        file: 'ic15-canon-12th-below-g-minor.abc',
        title: 'Canon at the 12th below, delay of three bars, in G minor',
        source: 'IC p. 15',
        note: 'The canon holds to bar 17; the last three bars of R are free, to the cadence. '
          + 'Marked on the page as not working: there are parallel unisons in bar 14, and octaves on the eighth going into bar 6, still to be fixed.',
        canon: canon(-11, 3, [1, 14]),
        icf: false,
      },
    ],
  },
  {
    id: 'infinite-canons',
    title: 'Infinite canons',
    intro: 'A two-part canon that can go round for ever, and a first use of invertible counterpoint: P comes back to '
      + 'its first bar, so that bar ends up both above and below the voice it meets.',
    procedure: [
      step('Write a two-part canon at the octave as above, bar by bar.',
        { file: 'ic25a-infinite-canon-octave.abc', bars: [1, 3], color: [['P', 1, 'a'], ['R', 2, 'a'], ['P', 2, 'b'], ['R', 3, 'b']] }),
      step('Steer P back to its own first bar. That bar is the last one before the repeat, and from then on the bars between go round, with R going round behind them.',
        { file: 'ic25a-infinite-canon-octave.abc', bars: [1, 4], color: [['P', 1, 'a'], ['P', 4, 'a']], labels: { P: { 1: 'bar 1', 4: 'bar 1 again' } } }),
      step('So the opening bar must be invertible counterpoint at the octave (Jv = −7). In R it sits under P’s bar 2; back in P, before the repeat, it sits over R’s copy of bar 3. Check it both ways.',
        { file: 'ic25a-infinite-canon-octave.abc', bars: [2, 4], color: [['R', 2, 'a'], ['P', 4, 'a']], labels: { R: { 2: 'bar 1 below' }, P: { 4: 'bar 1 above' } } }),
      step('To stop, leave the loop at the end of a round and end both voices on a consonance, here whole notes on the third and the tonic.',
        { file: 'ic25a-infinite-canon-octave.abc', bars: [4, 5] }),
      step('The next sections take invertibility further: first two voices invertible over a cantus, then one P with two answers at different intervals, which must be invertible against each other.'),
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
    id: 'invertible',
    title: 'Invertible counterpoint over a cantus',
    intro: 'A line over a cantus firmus (the original, top staff) and the same line moved below it (the derivative, '
      + 'bottom staff). There are three staves, but only two sound at a time: each outer voice must work with the cantus.',
    procedure: [
      step('Choose Jv, the shift that takes the original below the cantus: −7 for the octave, −11 for the 12th (Taneyev; zero-indexed).',
        { file: 'ic29a-invertible-octave-c.abc', bars: [1, 3], labels: { O: { 1: 'original' }, D: { 1: 'derivative: the original moved −7' } } }),
      step('For each note, write its interval from the cantus above the staff (n) and the derivative’s below it (n + Jv), as on IC p. 29.',
        { file: 'ic29a-invertible-octave-c.abc', bars: [1, 3], numbers: { against: 'CF', above: ['O'], below: ['D'] } }),
      step('Check both numbers on every beat. At the octave a 5th (4) becomes a 4th (−3), so treat 5ths as dissonances (IC p. 29: “What if 5ths are dissonant?”). At the 12th a 6th (5) becomes a 7th (−6), so 6ths and 7ths must come as suspensions (IC p. 23).',
        { file: 'ic29a-invertible-octave-c.abc', bars: [2, 2], numbers: { against: 'CF', above: ['O'], below: ['D'] }, color: [['O', 2, 'a'], ['D', 2, 'a']], labels: { O: { 2: 'a 5th (4) on a weak beat' }, D: { 2: 'becomes a passing 4th (−3)' } } }),
      step('Play both pairs: original and cantus, then cantus and derivative.'),
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
        caption: 'The page’s crossed-out Jv = −11 system is on the <a href="../wip/#ic29c-invertible-12th-crossed-out">WIP page</a>, '
          + 'with the other failed attempts. The last system is unfinished and is left out.',
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
      {
        file: 'ic30a-invertible-octave-a-minor.abc',
        title: 'Invertible counterpoint at the octave, in A minor',
        source: 'IC p. 30, first system',
        note: 'Jv = −7 around an alto cantus. The page writes the derivative out on the bass staff, an octave below the original. '
          + 'Bar 2 opens with a 7–6 suspension over the cantus’s B. The 5th on the downbeat of bar 6 becomes a 4th in the derivative.',
        caption: 'The cantus in bars 2 and 6 is faint; B and F are best guesses.',
        alternatives: { upper: 'O', shared: 'CF', lower: 'D', shift: -7 },
      },
    ],
  },
  {
    id: 'two-answers',
    title: 'One proposta, two answers',
    intro: 'Invertibility inside a canon: one P answered two ways, R a 5th above and R8 an octave below. '
      + 'The two answers are a 12th apart, so P with R is invertible counterpoint at the 12th (Jv = −11).',
    procedure: [
      step('Write P so that it works as a canon at both intervals: at the 5th above and at the octave below.',
        { file: 'ic21-canon-5th-and-octave.abc', bars: [1, 3], color: [['P', 1, 'a'], ['R', 2, 'a'], ['R8', 2, 'a'], ['P', 2, 'b'], ['R', 3, 'b'], ['R8', 3, 'b']], labels: { R: { 2: 'a 5th above' }, R8: { 2: 'an octave below' } } }),
      step('List P’s allowed moves for each answer, side by side, and keep only the notes in both, as in the margin of IC p. 21 (“5 over 8: C → three-note chord”). Each row is the notes P may reach one delay later from C. '
        + 'With R a 5th above and R8 an octave below, that leaves C, E and G: P may repeat its note, go a 3rd up or a 6th down, or a 5th up or a 4th down. The margin’s other chord, “8 over 5”, is the answers swapped (an octave above, a 5th below), which leaves C, A and F instead.',
        null,
        [{ title: '5 over 8 (this canon)', answers: [{ label: 'R a 5th above', entry: 4 }, { label: 'R8 an octave below', entry: -7 }] },
          { title: '8 over 5', answers: [{ label: 'an octave above', entry: 7 }, { label: 'a 5th below', entry: -4 }] }]),
      step('Check P with each answer on its own. The two answers are alternatives, so the page plays the upper pair, then the lower pair.'),
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
    id: 'canon-over-cantus',
    title: 'Canons over a cantus firmus, with the imaginary cantus',
    intro: 'The hardest here: a two-part canon over a cantus firmus, written with the imaginary cantus (ICF) of the '
      + '<a href="../canon/over-cantus.html">Canon over a CF</a> page. The gray ICF staff is drawn but not played. '
      + 'It is worked out from the cantus here, so it can sit an octave or two away from where it is on paper.',
    diagram: 'icf',
    procedure: [
      step('Choose the interval of entry and the delay. The ICF is the cantus moved the other way by that interval and one delay earlier (IC p. 5: “ICF is a 5th below, since R follows 5th above”).',
        { file: 'ic05a-canon-5th-above.abc', bars: [1, 3], voices: ['CF', 'ICF'], color: [['CF', 2, 'a'], ['ICF', 1, 'a'], ['CF', 3, 'b'], ['ICF', 2, 'b']], labels: { ICF: { 1: 'CF bar 2, a 5th down' } } }),
      step('Write P against both the CF and the ICF What P forms against the ICF now, R will form against the CF one delay later (IC p. 10: “Check P + ICF ⇒ R + CF”).',
        { file: 'ic05a-canon-5th-above.abc', bars: [2, 3], color: [['P', 2, 'a'], ['ICF', 2, 'a'], ['R', 3, 'b'], ['CF', 3, 'b']], labels: { P: { 2: 'P against the ICF…' }, R: { 3: '…is R against the CF' } } }),
      step('Copy P into R as in a two-part canon, and check P against R.',
        { file: 'ic05a-canon-5th-above.abc', bars: [2, 3], voices: ['R', 'P'], color: [['P', 2, 'a'], ['R', 3, 'a']] }),
      step('With the cantus below both voices, Bathe’s table (c. 1596) gives P’s choices for each bar at once: the column is the canon’s interval (the “place”) and the row is the cantus’s next move (the “course”). '
        + 'The labels here are Bathe’s cells, counted from 1 as he prints them, and each of P’s downbeats is in its cell. <a href="../canon/bathe.html">Bathe’s table</a> has every cell, in his numbers and as Taneyev’s J<sub>v</sub>. '
        + 'With the cantus between the voices, as on IC p. 7, the table no longer applies, and the ICF does the same work.',
        { file: 'ic05a-canon-5th-above.abc', bars: [4, 6], voices: ['R', 'P', 'CF'], labels: { P: { 4: 'Bathe: 3 5', 5: '1 3 5', 6: '6' } } }),
      step('Bellermann’s rule: every two-voice pair must work. With the ICF there are four voices and six pairs, but only the three with P are checked, as P is written: P + CF, P + R and P + ICF. '
        + 'Of the other three, only R + CF sounds, and it is P + ICF again, a bar later and a 5th up, so it is already right. R + ICF and CF + ICF need no check: the ICF is silent, so they are never heard. '
        + 'The diagram below shows it bar by bar. WIP p. 11 makes the same point for a canon with three risposte, one of them imaginary: “Check: P + R1, P + R2, P + R3 … ⇒ R1 + R2 is guaranteed!”'),
      step('When the cantus ends, or the canon can go no further, leave it for a free cadence.',
        { file: 'ic05a-canon-5th-above.abc', bars: [6, 8], voices: ['R', 'P', 'CF'] }),
    ],
    examples: [
      {
        file: 'ic05a-canon-5th-above.abc',
        title: 'Canon at the 5th above, delay of one bar',
        source: 'IC p. 5, top',
        note: '“CF + 2 part canon.” The ICF is a 5th below, “since R follows 5th above.” '
          + 'Check P + CF, P + R and P + ICF; P + ICF never sounds but guarantees R + CF.',
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
        note: '“ICF is very important! Write w/ CF.” and “Check P + ICF ⇒ R + CF.” '
          + 'From bar 8 both voices are marked “free,” stopping on the dominant.',
        canon: canon(-4, 2, [1, 5]),
        icf: true,
      },
    ],
  },
];
