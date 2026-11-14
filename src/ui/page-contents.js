// The page contents: a numbered list of a long page's sections (its h2 headings) and, under
// each, the examples in it (the h3 of each .example). On wide screens it sits beside the page
// and marks the section you are reading; on narrow ones it is a "Contents" box under the header.
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
      return { title: h2.textContent.trim(), id: targetId(target, h2), examples };
    });
}

// Returns the list items for the sections, numbered 1, 1.1, 1.2, 2 ...
function listHtml(sections) {
  return sections.map((section, i) => {
    const subs = section.examples.map((ex, j) =>
      `<li data-for="${ex.id}"><a href="#${ex.id}"><span class="n">${i + 1}.${j + 1}</span>${ex.title}</a></li>`).join('');
    const sublist = subs ? `<ol>${subs}</ol>` : '';
    return `<li data-for="${section.id}"><a href="#${section.id}"><span class="n">${i + 1}</span>${section.title}</a>${sublist}</li>`;
  }).join('');
}

// Wraps everything after the page's header in a two-column grid, with the contents first.
function buildFrame(main) {
  const header = main.querySelector(':scope > header');
  const frame = document.createElement('div');
  frame.className = 'with-contents';
  const contents = document.createElement('details');
  contents.className = 'contents';
  contents.open = WIDE.matches; // open beside the page; folded under the header on a phone
  contents.setAttribute('aria-label', 'On this page');
  contents.innerHTML = '<summary>On this page</summary><ol></ol>';
  const body = document.createElement('div');
  body.className = 'page-body';
  for (const child of [...main.children]) if (child !== header && child.tagName !== 'SCRIPT') body.append(child);
  frame.append(contents, body);
  main.append(frame);
  return { contents, body };
}

// Marks the section (and example) at the top of the screen as current in the list.
function followPlace(contents, sections) {
  const items = new Map([...contents.querySelectorAll('li')].map((li) => [li.dataset.for, li]));
  const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const item = items.get(entry.target.id);
      if (!item) continue;
      const isSection = item.parentElement.parentElement === contents;
      const mark = isSection ? 'current' : 'on';
      contents.querySelectorAll(`li.${mark}`).forEach((li) => li.classList.remove(mark));
      item.classList.add(mark);
      if (!isSection) {
        contents.querySelectorAll('li.current').forEach((li) => li.classList.remove('current'));
        item.parentElement.closest('li').classList.add('current');
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
let frame = null;
let watcher = null;

// Builds or rebuilds the list from the headings now on the page.
function refresh() {
  const sections = readSections(frame ? frame.body : main);
  if (sections.length < MIN_SECTIONS) return;
  if (!frame) frame = buildFrame(main);
  frame.contents.querySelector('ol').innerHTML = listHtml(sections);
  watcher?.disconnect();
  watcher = followPlace(frame.contents, sections);
}

refresh();
// The list is always open beside the page, and starts folded when it moves under the header.
WIDE.addEventListener('change', () => { if (frame) frame.contents.open = WIDE.matches; });
// Rebuild when a page adds its sections later; wait for a quiet moment so it happens once.
let pending = 0;
new MutationObserver((changes) => {
  // the list's own updates don't count
  if (changes.every((change) => change.target.closest?.('.contents'))) return;
  clearTimeout(pending);
  pending = setTimeout(refresh, 300);
}).observe(main, { childList: true, subtree: true });
