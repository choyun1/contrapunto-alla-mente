// The notch on a page's tab tray (nav.sub): a small triangle pointing up at the current
// section in the site nav, so the tabs read as that section's pages. Styles: assets/site.css.
// Pages load it with <script type="module" src="../src/ui/sub-nav.js">; without it the tray just has no notch.

const NOTCH_HALF_WIDTH = 8; // half the triangle's base, in px (matches the borders in site.css)

// Returns the notch's left offset in px inside the tray, under the middle of the section link.
function notchLeft(tray, section) {
  const sectionBox = section.getBoundingClientRect();
  const trayBox = tray.getBoundingClientRect();
  // Leave out the link's left padding (the Drills link has some, before its divider).
  const padding = parseFloat(getComputedStyle(section).paddingLeft) || 0;
  const middle = sectionBox.left + padding + (sectionBox.width - padding) / 2;
  return Math.max(NOTCH_HALF_WIDTH, middle - trayBox.left - NOTCH_HALF_WIDTH);
}

// Adds the notch to the tray and keeps it under the section link as the page reflows.
function addNotch(tray, section) {
  const notch = document.createElement('span');
  notch.className = 'notch';
  notch.setAttribute('aria-hidden', 'true');
  tray.prepend(notch);
  const place = () => tray.style.setProperty('--notch', `${notchLeft(tray, section)}px`);
  place();
  addEventListener('resize', place);
  document.fonts?.ready.then(place);
}

const tray = document.querySelector('nav.sub');
const section = document.querySelector('nav.site a[aria-current="page"]');
if (tray && section) addNotch(tray, section);
