// Finds where on a drawn abcjs score a click landed: which staff (voice),
// which bar, and how many staff steps (lines and spaces) above that staff's
// bottom line. Browser only; no theory. The page turns the steps into a
// pitch with the bar's clef (CLEFS in clefs.js).
//
// It relies on the classes abcjs adds with add_classes: each staff is a group
// "abcjs-staff abcjs-l<line> abcjs-v<voice>" holding its five lines, and each
// note or rest carries "abcjs-mm<bar>" and "abcjs-v<voice>".

/** The number after a class prefix, e.g. 2 for "abcjs-v2", or null. */
function classNumber(element, prefix) {
  const match = new RegExp(`(?:^| )${prefix}(\\d+)(?: |$)`).exec(element.getAttribute('class') ?? '');
  return match ? Number(match[1]) : null;
}

/** How far a click may be above or below a staff and still count, in staff steps (ledger lines). */
const REACH = 6;

/** The staff group nearest the click's height, with its box, or null if none is close. */
function nearestStaff(svg, y) {
  let best = null;
  for (const group of svg.querySelectorAll('.abcjs-staff')) {
    const box = group.getBoundingClientRect();
    const step = box.height / 8; // five lines, four spaces: eight steps from bottom to top
    const outside = Math.max(box.top - y, y - box.bottom, 0) / step;
    if (outside > REACH) continue;
    if (!best || outside < best.outside) best = { group, box, step, outside };
  }
  return best;
}

/** The bar of a voice and line whose note or rest is nearest the click across, or null. */
function nearestBar(svg, voice, line, x) {
  let best = null;
  for (const element of svg.querySelectorAll(`.abcjs-v${voice}.abcjs-l${line}`)) {
    const isNote = /abcjs-(note|rest)(?: |$)/.test(element.getAttribute('class'));
    if (!isNote) continue;
    const box = element.getBoundingClientRect();
    const distance = Math.abs(box.left + box.width / 2 - x);
    if (!best || distance < best.distance) best = { bar: classNumber(element, 'abcjs-mm'), distance };
  }
  return best?.bar ?? null;
}

/**
 * Where a click at (x, y) in the page's coordinates landed on the score.
 * Returns { voice, bar, stepsAboveBottom } (voice and bar counted from 0), or
 * null when the click was not on or near a staff.
 */
export function staffSpotAt(svg, x, y) {
  const staff = nearestStaff(svg, y);
  if (!staff) return null;
  const voice = classNumber(staff.group, 'abcjs-v');
  const line = classNumber(staff.group, 'abcjs-l');
  const bar = nearestBar(svg, voice, line, x);
  if (bar === null) return null;
  const stepsAboveBottom = Math.round((staff.box.bottom - y) / staff.step);
  return { voice, bar, stepsAboveBottom };
}
