<h1><a href="https://choyun1.github.io/contrapunto-alla-mente/"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.svg">
  <img alt="Contrapunto alla mente" src="assets/banner-light.svg" height="64">
</picture></a></h1>

Contrapunto alla mente is a trainer for improvising counterpoint, the "counterpoint in the mind" that singers and organists once made up on the spot. It isn't a generator: it shows the rules so they can be learned and checked, with fast drills for recall and a workbench for slower, worked-out exercises. Every page draws its notation and plays it back in the browser, from one rules core that is tested against the published charts.

It starts with Sergei Taneyev's vertical-shifting counterpoint, the method of his *Convertible Counterpoint in the Strict Style*, and the canon, toward a near-term goal: a two-voice canon over a hymn-tune cantus firmus. Other methods (partimento, schemata, figured bass) can join it later as sections of their own. **[▶ Open the site](https://choyun1.github.io/contrapunto-alla-mente/)**: it runs in the browser, with nothing to install.

<!-- Contents: one entry per ## section, in order. -->
<table><tr><td>

<small><b>Contents</b><br>
1&ensp;Using it<br>
&emsp;1.1&ensp;[What it's for](#what-its-for)<br>
&emsp;1.2&ensp;[Conventions](#conventions)<br>
2&ensp;The code<br>
&emsp;2.1&ensp;[Layout](#layout)<br>
&emsp;2.2&ensp;[Working on it](#working-on-it)<br>
3&ensp;The project<br>
&emsp;3.1&ensp;[Roadmap](#roadmap)<br>
&emsp;3.2&ensp;[Sources, credits and license](#sources-credits-and-license)</small>

</td></tr></table>

## What it's for

- **Taneyev consonance charts.** Pick a vertical shift (J<sub>v</sub>) and see what every interval of the original becomes, with Taneyev's suspension marks and which consonances stay free, which turn perfect and which become dissonant. Each chart shows n = m + J<sub>v</sub>, the interval strip on a staff and a Play button, and any J<sub>v</sub> from −21 to +21 can be picked. The common shifts (0, −7, −9, −11) are marked ★ in the dropdown and the others Taneyev works through ☆. The canon proposta page uses the same dropdown.
- **Canon proposta intervals.** In a two-voice canon every melodic interval the proposta makes across the delay becomes a harmonic interval between the voices. Pick an interval of entrance to see which melodic intervals stay consonant, and paste a proposta in pitch names to have every pairing checked. A second tab, **Handshapes**, turns the allowed moves into a hand shape on the keyboard (thumb on the risposta's note: right hand above it, left hand below, both at the unison) and the same notes stacked in thirds as a seventh chord.
- **Canon over a cantus firmus.** Taneyev's imaginary-cantus method, and the workbench for it. Choose where the cantus, proposta and risposta sit, the interval of entrance and the delay; see the imaginary cantus, the J<sub>v</sub> each bar must be written in and the notes that fit; then write the cantus and proposta on the staff, MuseScore style (click a line or space, or type A–G, with the arrow keys to move by step or octave), or type pitch names and have every bar checked against the cantus, the imaginary cantus and the risposta. The imaginary cantus is drawn in gray but not played.
- **Three-voice shifts.** Enter the outer voices' J<sub>v</sub> and see every way a middle voice can split it, since J<sub>v</sub>(upper, lower) = J<sub>v</sub>(upper, middle) + J<sub>v</sub>(middle, lower), with all three pair charts. Splits where both inner pairs land on an easy shift (0, −7, −9 or −11) are marked, because the hardest pair rules the texture.

- **Drills.** Practice at the keyboard with live feedback. **Move chords**: the site names a canon and the risposta's note, and you play every note the proposta may move to, timed, with the ones you miss coming back more often. **Lead the canon**: you improvise the proposta and the site plays it back as the risposta, marking each note as it sounds. **Follow the leader**: the site plays a fresh first-species proposta and you play (or sing) the risposta. Play on the on-screen keys, the computer keyboard (one octave per row of letters) or a MIDI keyboard, either waiting for each note or on a beat.
- **Notebook.** Worked examples from Cho's handwritten counterpoint notebooks, notated and played back, each with its notebook page and the note written beside it. The first batch is two-voice canons over a cantus firmus, with the imaginary cantus worked out from the rules core and drawn in gray, not played.

See the [Roadmap](#roadmap) for what comes next.

## Conventions

Intervals are zero-indexed, as Taneyev numbers them: unison 0, 2nd 1, 3rd 2, 5th 4, octave 7, 10th 9, 12th 11. The derivative of interval m at index J<sub>v</sub> is n = m + J<sub>v</sub>. A negative interval means the voices have crossed. The 4th counts as a dissonance, as in two-voice writing.

## Layout

| Path | What it holds |
| --- | --- |
| `src/taneyev/rules.js` | The rules core for Taneyev's vertical-shifting counterpoint. Every page and checker uses it. |
| `src/taneyev/shifts.js` | Which shifts J<sub>v</sub> the site offers (−21 to +21), which are common (0, −7, −9, −11), the ones Taneyev works through, and their chart titles. |
| `src/ui/jv-picker.js` | The J<sub>v</sub> dropdown shared by the charts and canon pages, with ★ on the common shifts and ☆ on the others Taneyev works through. |
| `src/taneyev/three-voices.js` | Splits an outer shift between the two inner pairs of a three-voice texture. |
| `src/taneyev/three-voice-examples.js` | Finds a four-bar, note-against-note example in three voices that stays correct under a split, for the three-voice page to draw and play. |
| `src/taneyev/self-questions.js` | The "Ask yourself" line on each chart: which consonances a shift turns dissonant or perfect, as a question (at the 12th: what if every 6th were a dissonance?). |
| `src/taneyev/canon.js` | The canon rules: which proposta intervals stay consonant at an interval of entrance, and the proposta checker. |
| `src/taneyev/imaginary-cantus.js` | Canon over a cantus firmus: the imaginary cantus, its guide intervals (the J<sub>v</sub> of each bar) and the proposta notes each bar allows. |
| `src/taneyev/canon-hands.js` | The canon moves as a hand shape and a stacked chord: why there are always four note names (five at the unison), and which canons share them. |
| `src/taneyev/canon-walk.js` | Random first-species canons at any interval and delay, for the Follow the leader drill. |
| `src/taneyev/canon-voices.js` | Where the cantus, proposta and risposta sit (the six orders), and the setup that follows from an order, interval size and delay. |
| `src/taneyev/canon-check.js` | Checks a canon over a cantus bar by bar and says what is wrong in words. |
| `src/taneyev/canon-over-cantus.js` | Finds a whole-note canon framework over a cantus by the imaginary-cantus method, and lists the setups that have one. |
| `src/taneyev/florid.js` | Finds every dissonance between two voices of florid counterpoint and names it: a suspension (9–8, 7–6, 4–3 ...), a passing or neighbor tone, or "check" (a leap in or out, or a tritone). The notebook lists them under each example. |
| `src/taneyev/examples.js` | Builds the generated examples (interval strips, parallel chains) from the rules core. |
| `src/taneyev/motion.js` | Motion between two dyads (similar, contrary, oblique) and which moves survive a shift (Fux; §101). |
| `src/taneyev/first-species.js` | Finds a four-bar first-species phrase for a shift that is correct both before and after it. |
| `src/notation/note-entry.js`, `src/notation/staff-click.js` | MuseScore-style note entry: which key does what, the nearest octave for a typed letter, and where on a drawn staff a click landed. |
| `src/input/`, `src/audio/tone.js`, `src/drills/` | The drills' plumbing: notes from computer keys, clicks and MIDI (`key-map.js`, `listen.js`), short Web Audio tones, a run beat by beat (`run.js`) and a deck that favors what you miss (`deck.js`). No theory. |
| `src/notation/range.js` | Moves a generated example by whole octaves into singing range (F2 to G5), keeping every interval. |
| `src/notation/`, `src/common/diatonic.js` | Turn diatonic pitches into abc notation, which the pages draw and play with [abcjs](https://www.abcjs.net/) (loaded from a CDN, pinned to 6.4.4). |
| `taneyev/` | The consonance charts page and the three-voice shifts page. `chart-card.js` draws one chart card for both. |
| `canon/` | The canon pages: `proposta.html` (proposta tables and checker), `handshapes.html` (the moves as hand shapes and chords, on the keyboard from `src/ui/keyboard.js`) and `over-cantus.html` (canon over a cantus firmus: `over-cantus.js` runs it, `over-cantus-score.js` draws the editable score, `over-cantus-entry.js` handles the entry cursor, `over-cantus-table.js` the guide table). `names.js` holds display names both use. |
| `notebook/` | The notebook page: `examples/` holds one abc file per worked example, `examples.js` lists them with their source page and notes, `score.js` adds the imaginary cantus staff and builds what is heard for alternative staves (the upper pair, then the lower pair) and marks where each canon goes free or cadences, `icf-diagram.js` draws the imaginary-cantus diagram, `snippets.js` cuts the few bars that show each procedure step, and `notebook.js` draws the page, section by section from the simplest exercise to the hardest, each with its procedure. |
| `src/notation/abc-read.js` | Reads the small part of abc the notebook's hand-written examples use, key signature and accidentals included, for the tests, the dissonance list and adding a staff. |
| `drills/` | The drill pages: `move-chords`, `lead` and `follow`, each an `.html` and a `.js`, with `common.js` for what they share. |
| `scores/` | LilyPond sources for fixed music examples. CI compiles each `.ly` file to SVG under `scores/` on the site. |
| `assets/` | Shared styles (`site.css`), the logo (`logo.svg`, a short canon in noteheads), the same canon on a staff for large sizes (`logo-staff.svg`), the README banner with the name beside it (`banner-light.svg`, `banner-dark.svg`), and the browser-tab icon (`favicon.svg`). |
| `test/` | Tests for the rules core, including the charts from *Movable Counterpoint* video 2. |

## Working on it

```sh
npm test        # run the rules tests (Node 22, no dependencies)
npm run serve   # serve the site at http://localhost:8000
```

There is no build step: the pages are plain ES modules that run as they are in the browser and in Node. Live notation uses abcjs; LilyPond is only for the fixed examples, because it can't run in a browser. Each push to `main` runs the tests and publishes the site to GitHub Pages.

See [CLAUDE.md](CLAUDE.md) for the code organization and style rules.

## Roadmap

- **Tune screening.** Rank a tune's canon intervals and time distances by how hard their indices are, to find hymn tunes that take a canon well.
- **More drills.** Counterpoint over a hymn tune (and hearing it shifted by J<sub>v</sub>), then a live canon over a hymn tune with imaginary-cantus hints, starting from standard Lutheran chorale tunes. Singing input through the microphone later.
- **Work-in-progress page.** One page for every example from Cho's work-in-progress (WIP) notebook, starting with the unfinished canon over Leoni (WIP p. 7, `notebook/examples/wip07-canon-over-leoni.abc`) and the three-voice canon in C minor from IC p. 14 (`ic14-three-voice-canon-c-minor.abc`), which Cho wants to rework, kept apart from the finished notebook examples.
- **Partimento.** Realizing unfigured and figured basses with the rule of the octave and the common schemata, as a section of its own beside Taneyev.

## Sources, credits and license

The rules follow Taneyev, *Convertible Counterpoint in the Strict Style* (§§81–82, 90, 101, 128, 135), and Christopher Segall, ["Sergei Taneev's Vertical-Shifting Counterpoint: An Introduction"](https://mtosmt.org/issues/mto.14.20.3/mto.14.20.3.segall.php), *Music Theory Online* 20.3 (2014), with charts checked against the *Movable Counterpoint* video course. Each rule in the code cites its section. Notation and playback are by [abcjs](https://www.abcjs.net/) (MIT); the GitHub mark in the footer is from Primer Octicons (MIT).

It was built by Adrian Cho with Claude (Anthropic) in 2026. The code is under the MIT License ([LICENSE](LICENSE)).
