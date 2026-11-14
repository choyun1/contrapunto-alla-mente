# Working on contrapunto-alla-mente

Cho reads and edits this code by hand, so it has to stay easy to find, read and
change. Treat these as rules, not suggestions.

## Organization

- **One rules core per method.** Music logic (intervals, marks, checks) lives in
  `src/<method>/` and nowhere else. Pages import it; they never re-implement a rule.
  Taneyev's is `src/taneyev/rules.js`.
- **Pages are thin.** Each section is a folder (`taneyev/`, later `canon/`,
  `drills/`) holding its `.html` and one `.js` that renders. Rendering code calls
  the core and builds the page; it holds no theory.
- **Shared styles** go in `assets/site.css`. Add a page-specific `<style>` only for
  something truly local.
- **Fixed music examples** are LilyPond files in `scores/`, named for what they
  show (`parallel-thirds-jv-7.ly`). CI compiles them; don't commit generated SVG.
- **Plans live in one place.** What the site plans to add is listed only in the home
  page's Planned section (and the README Roadmap). Other pages, like `intro/`, link there
  instead of naming plans, so nothing goes stale when a page is built.
- **No build step and no dependencies** unless there's a clear need. Plain ES
  modules that run as-is in the browser and in Node.

## Readable code

- Name things in the music's terms: `jv`, `original`, `derivative`, `above`,
  `below`, `suspension`. Keep Taneyev's zero-indexed numbering everywhere, and say
  so wherever an interval number could be misread.
- Cite the source of every rule in a comment, by section (`§135`, `Segall n. 16`,
  `video 2, 16:45`), so it can be checked against the book.
- Short functions with one job each, with a one-line comment saying what it
  returns. Prefer a small table of data (like `BASE` in `rules.js`) over branching
  logic.
- No clever one-liners. If a line needs a second read, split it or explain it.
- Keep files under about 300 lines. Split by topic when one grows past that.

## Tests

- Every rule in a core gets a test, preferably checked against a published chart
  or example (cite it in the test name).
- Run `npm test` before every commit. CI runs it on every push and PR.
