# Contrapunto alla mente

Tools for learning to improvise counterpoint, published at
https://choyun1.github.io/contrapunto-alla-mente/.

## Layout

| Path | What it holds |
| --- | --- |
| `src/taneyev/rules.js` | The rules core for Taneyev's vertical-shifting counterpoint. Every page and checker uses it. |
| `taneyev/` | The consonance charts page, generated in the browser from the rules core. |
| `scores/` | LilyPond sources for fixed music examples. CI compiles each `.ly` file to SVG and MIDI under `scores/` on the site. |
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

Live notation in the browser (the workbench and drills) will use abcjs or
Verovio. LilyPond is only for the fixed examples, because it can't run in a
browser.
