# Contrapunto alla mente

Tools for learning to improvise counterpoint, published at
https://choyun1.github.io/contrapunto-alla-mente/.

## Layout

| Path | What it holds |
| --- | --- |
| `src/taneyev/rules.js` | The rules core for Taneyev's vertical-shifting counterpoint. Every page and checker uses it. |
| `taneyev/` | The consonance charts page, generated in the browser from the rules core, with notation examples under each chart. |
| `src/taneyev/examples.js` | Builds the generated examples (interval strips, parallel chains) from the rules core. |
| `src/notation/abc.js`, `src/common/diatonic.js` | Turn diatonic pitches into abc notation, which the pages draw and play with [abcjs](https://www.abcjs.net/) (loaded from a CDN, pinned to 6.4.4). |
| `scores/` | LilyPond sources for fixed music examples. CI compiles each `.ly` file to SVG and MIDI under `scores/` on the site. |
| `assets/` | Shared styles (`site.css`), the logo (`logo.svg`, a short canon in noteheads) and the browser-tab icon (`favicon.svg`, the same canon on a tile). |
| `test/` | Tests for the rules core, including the charts from Movable Counterpoint video 2. |

## Conventions

Intervals are zero-indexed, as Taneyev numbers them: unison 0, 3rd 2, 5th 4,
octave 7, 10th 9, 12th 11. The derivative of interval m at index Jv is m + Jv.
A negative interval means the voices have crossed.

## Working on it

```sh
npm test        # run the rules tests (Node 22, no dependencies)
npm run serve   # serve the site at http://localhost:8000
```

Live notation in the browser uses abcjs. LilyPond is only for the fixed examples, because it can't run in a
browser.

See [CLAUDE.md](CLAUDE.md) for the code organization and style rules.
