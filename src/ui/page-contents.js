// The page contents: a numbered list of a long page's sections (its h2 headings) and, under
// each, the examples in it (the h3 of each .example). On wide screens it is a panel on the left
// edge that marks the section you are reading and folds to a thin strip of section numbers (the
// current one still marked; pointing at a number shows its title); on narrow ones it is a folded "On this page" box under the header.
// Each section's list of examples folds too.
// Styles: assets/site.css. A page opts in with <script type="module" src="../src/ui/page-contents.js">.
// Pages that draw their sections after loading (the notebook) are picked up as they appear.

const MIN_SECTIONS = 3; // shorter pages get no contents
const WIDE = matchMedia('(min-width: 1100px)'); // where the list sits beside the page (assets/site.css)

// Returns an id for a heading's target, giving it one made from its text if it has none.
function targetId(target, heading) {
  if (!target.id) {
    const words = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let id = words || 'section';
    for (let n = 2; document.getElementById(id); n += 1) id = `${words}-${n}`;
    target.id = id;
  }
  return target.id;
}

// Returns the sections of the page: each h2 with its target, and the examples under it.
function readSections(body) {
  return [...body.querySelectorAll('h2')]
    .filter((h2) => !h2.closest('.contents, nav'))
    .map((h2) => {
      const target = h2.closest('section') || h2;
      const examples = [...target.querySelectorAll('.example h3')].map((h3) => ({
        title: h3.textContent.trim(),
        id: targetId(h3.closest('.example'), h3),
      }));
      return { heading: h2, title: h2.textContent.trim(), id: targetId(target, h2), examples };
    });
}

// Returns the list items for the sections, numbered 1, 1.1, 1.2, 2 ... A section with examples
// gets a small button that folds its examples in and out.
function listHtml(sections) {
  return sections.map((section, i) => {
    const subs = section.examples.map((ex, j) =>
      `<li data-for="${ex.id}"><a href="#${ex.id}"><span class="n">${i + 1}.${j + 1}</span><span class="t">${ex.title}</span></a></li>`).join('');
    const sublist = subs
      ? `<button class="sub-toggle" type="button" aria-expanded="false" aria-label="Examples in ${section.title}"></button><ol>${subs}</ol>`
      : '';
    return `<li data-for="${section.id}"><a href="#${section.id}"><span class="n">${i + 1}</span><span class="t">${section.title}</span></a>${sublist}</li>`;
  }).join('');
}

// Shows or hides a section's examples in the list, and says so on its button.
function setExpanded(item, expanded) {
  const button = item.querySelector(':scope > .sub-toggle');
  if (!button) return;
  item.classList.toggle('expanded', expanded);
  button.setAttribute('aria-expanded', String(expanded));
}

// Lets each section's button fold its examples. A section the reader opened by hand stays open
// as they scroll on; one they folded stays folded.
function foldSubLists(contents) {
  contents.querySelector('nav').addEventListener('click', (event) => {
    const button = event.target.closest('.sub-toggle');
    if (!button) return;
    const item = button.parentElement;
    const expanded = !item.classList.contains('expanded');
    setExpanded(item, expanded);
    item.dataset.kept = 'yes';
  });
}

const SAVED = 'contents-open'; // remembers, per browser, whether the side panel was left open

// Returns whether the side panel should start open: as last left, or open the first time.
function startsOpen() {
  try {
    return localStorage.getItem(SAVED) !== 'no';
  } catch {
    return true;
  }
}

// Remembers whether the side panel is open, when it is the side panel (wide screens).
function rememberOpen(open) {
  if (!WIDE.matches) return;
  try {
    localStorage.setItem(SAVED, open ? 'yes' : 'no');
  } catch {
    // storage blocked: the panel just starts open next time
  }
}

// Opens or folds the contents, and says so on its button.
function setOpen(contents, open) {
  contents.classList.toggle('open', open);
  const button = contents.querySelector('.contents-toggle');
  button.setAttribute('aria-expanded', String(open));
  button.title = open ? 'Hide the contents' : 'Show the contents';
}

// Adds the contents after the page's header: a panel on the left edge that folds to a strip on
// wide screens, a folded box under the header on narrow ones. The one button that opens and folds
// it stays in the same place, top left, either way.
function buildContents(main) {
  const contents = document.createElement('aside');
  contents.className = 'contents';
  contents.innerHTML = `<button class="contents-toggle" type="button" aria-controls="contents-list">
    <span class="contents-arrow" aria-hidden="true"></span><span class="contents-label">On this page</span></button>
    <nav id="contents-list" aria-label="On this page"><ol></ol></nav>`;
  setOpen(contents, WIDE.matches && startsOpen());
  contents.querySelector('.contents-toggle').addEventListener('click', () => {
    const open = !contents.classList.contains('open');
    setOpen(contents, open);
    rememberOpen(open);
  });
  foldSubLists(contents);
  const header = main.querySelector(':scope > header');
  if (header) header.after(contents);
  else main.prepend(contents);
  return contents;
}

// Numbers the section headings on the page to match the list (drawn by assets/site.css from
// data-n, so the number stays out of the heading's text).
function numberHeadings(sections) {
  sections.forEach((section, i) => {
    section.heading.dataset.n = String(i + 1);
  });
}

// Marks a section as the one being read, opening its examples and folding the last one's,
// unless the reader opened or folded them by hand.
function markCurrent(contents, section) {
  if (section.classList.contains('current')) return;
  for (const before of contents.querySelectorAll('li.current')) {
    before.classList.remove('current');
    if (!before.dataset.kept) setExpanded(before, false);
  }
  section.classList.add('current');
  if (!section.dataset.kept) setExpanded(section, true);
}

// Marks the section (and example) at the top of the screen as current in the list.
function followPlace(contents, sections) {
  const items = new Map([...contents.querySelectorAll('li')].map((li) => [li.dataset.for, li]));
  const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const item = items.get(entry.target.id);
      if (!item) continue;
      const isSection = !item.parentElement.closest('li');
      contents.querySelectorAll('li.on').forEach((li) => li.classList.remove('on'));
      if (isSection) markCurrent(contents, item);
      else {
        item.classList.add('on');
        markCurrent(contents, item.parentElement.closest('li'));
      }
    }
  }, { rootMargin: '-15% 0px -75% 0px' });
  for (const section of sections) {
    watcher.observe(document.getElementById(section.id));
    for (const ex of section.examples) watcher.observe(document.getElementById(ex.id));
  }
  return watcher;
}

const main = document.querySelector('main.wrap');
let contents = null;
let watcher = null;

// Builds or rebuilds the list from the headings now on the page.
function refresh() {
  const sections = readSections(main);
  if (sections.length < MIN_SECTIONS) return;
  if (!contents) contents = buildContents(main);
  contents.querySelector('ol').innerHTML = listHtml(sections);
  numberHeadings(sections);
  watcher?.disconnect();
  watcher = followPlace(contents, sections);
}

refresh();
// Moving between wide and narrow: the side panel opens as last left, the box under the header folds.
WIDE.addEventListener('change', () => {
  if (contents) setOpen(contents, WIDE.matches && startsOpen());
});
// Rebuild when a page adds its sections later; wait for a quiet moment so it happens once.
let pending = 0;
new MutationObserver((changes) => {
  // the list's own updates don't count
  if (changes.every((change) => change.target.closest?.('.contents'))) return;
  clearTimeout(pending);
  pending = setTimeout(refresh, 300);
}).observe(main, { childList: true, subtree: true });
