// The docked 3D model on the charts page: one panel pinned to the corner of
// the screen that follows the chart you are reading. When a new chart scrolls
// into view, the coin or helix replays that chart's shift and the Cayley graph
// picks its dot. A button hides it; the choice is remembered in this browser.
//
// This file only wires the page together. The drawings are shift-model.js and
// cayley.js; the theory behind them is src/taneyev/symmetry.js.

import { renderModel, describe } from './shift-model.js';
import { renderCayley } from './cayley.js';
import { sign } from './chart-card.js';

const KEY = 'taneyev-model-dock';
const VIEWS = [['coin', 'Coin'], ['helix', 'Helix'], ['graph', 'Cayley graph']];

/** The saved settings, or {} when the browser keeps no storage. */
function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

/** Saves the settings; does nothing when the browser keeps no storage. */
function savePrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Private windows and blocked storage: the dock still works, it just forgets.
  }
}

/** The dock's markup: a show button, and the panel with its view switch. */
function dockHtml() {
  const tabs = VIEWS.map(([view, name]) => `<button type="button" data-view="${view}">${name}</button>`).join('');
  return `<button type="button" class="dock-show" aria-controls="dock-panel">Show the 3D model</button>
    <div class="dock-panel" id="dock-panel" role="region" aria-label="3D model of the chart in view">
      <div class="dock-head"><b class="dock-jv"></b>
        <button type="button" class="dock-hide" aria-label="Hide the 3D model">Hide</button></div>
      <div class="model-bar">${tabs}<button type="button" data-again>Replay</button></div>
      <div class="dock-shift"></div>
      <div class="dock-graph" hidden></div>
      <p class="model-note dock-say"></p>
      <p class="model-note"><a href="models.html">How to read the 3D models</a></p>
    </div>`;
}

/**
 * Adds the dock to the page. `jvs` are the charts on the page and `href(jv)`
 * links to one. Returns { watch(section) } for chart cards added later.
 */
export function mountDock(jvs, href) {
  const saved = loadPrefs();
  const prefs = {
    open: saved.open ?? window.matchMedia('(min-width: 900px)').matches,
    view: saved.view || 'coin',
  };
  const dock = document.createElement('aside');
  dock.className = 'dock';
  dock.innerHTML = dockHtml();
  document.body.append(dock);

  const title = dock.querySelector('.dock-jv');
  const shiftBox = dock.querySelector('.dock-shift');
  const graphBox = dock.querySelector('.dock-graph');
  const say = dock.querySelector('.dock-say');
  let current = jvs[0];
  let shift = null;
  let graph = null;

  /** Builds the drawings the first time they are needed, then shows the current chart. */
  const show = () => {
    title.innerHTML = `J<sub>v</sub> = ${sign(current)}`;
    if (!prefs.open) return;
    if (prefs.view === 'graph') {
      graph ??= renderCayley(graphBox, jvs, href, { bare: true });
      graph.highlight(current);
      return;
    }
    say.textContent = describe(current);
    if (!shift) shift = renderModel(shiftBox, current, { model: prefs.view, bare: true });
    else shift.setModel(prefs.view);
    shift.setJv(current);
  };

  /** Applies open/closed and the chosen view to the markup. */
  const layout = () => {
    dock.classList.toggle('open', prefs.open);
    document.body.classList.toggle('dock-open', prefs.open);
    dock.querySelector('.dock-show').setAttribute('aria-expanded', String(prefs.open));
    shiftBox.hidden = prefs.view === 'graph';
    graphBox.hidden = prefs.view !== 'graph';
    say.hidden = prefs.view === 'graph';
    dock.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === prefs.view)));
    savePrefs(prefs);
    show();
  };

  dock.querySelector('.dock-show').addEventListener('click', () => { prefs.open = true; layout(); });
  dock.querySelector('.dock-hide').addEventListener('click', () => { prefs.open = false; layout(); });
  dock.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { prefs.view = b.dataset.view; layout(); }));
  dock.querySelector('[data-again]').addEventListener('click', show);

  // The chart in view is the one crossing a band a third of the way down the screen.
  const observer = new IntersectionObserver((entries) => {
    const hit = entries.find((e) => e.isIntersecting);
    if (!hit) return;
    const jv = Number(hit.target.dataset.jv);
    if (jv === current) return;
    current = jv;
    show();
  }, { rootMargin: '-30% 0px -65% 0px' });
  const watch = (section) => observer.observe(section);
  document.querySelectorAll('section.chart[data-jv]').forEach(watch);

  layout();
  return { watch };
}
