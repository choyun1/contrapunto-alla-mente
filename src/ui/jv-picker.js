// The Jv picker shared by the charts page and the canon proposta page: one
// dropdown of every Jv from −21 to +21 in number order, with ‹ › buttons to
// step one at a time. Icons mark the shifts that matter most:
//   ★ a common shift (0, −7, −9, −11)
//   ☆ another shift Taneyev works through
// Which shifts those are comes from src/taneyev/shifts.js; this file only
// builds the control. Jv is zero-indexed, as everywhere: −7 is the octave.

import { allShifts, inRange, isCommonShift, bookEntry } from '../taneyev/shifts.js';

const COMMON_ICON = '★';
const BOOK_ICON = '☆';

/** A number with its sign always shown and a real minus, e.g. "+3", "−11", "0". */
function sign(jv) {
  if (jv > 0) return `+${jv}`;
  if (jv < 0) return `−${-jv}`;
  return '0';
}

/** The icon for jv, or '' for a shift outside the book. */
export function jvIcon(jv) {
  if (isCommonShift(jv)) return COMMON_ICON;
  if (bookEntry(jv)) return BOOK_ICON;
  return '';
}

/** The key printed beside the dropdown. */
const KEY = `${COMMON_ICON} common (0, −7, −9, −11) · ${BOOK_ICON} also in Taneyev`;

/** Returns one option, e.g. "−11 ★ · Invertible at the 12th". */
function option(jv, title) {
  const mark = jvIcon(jv) ? ` ${jvIcon(jv)}` : '';
  return `<option value="${jv}">${sign(jv)}${mark} · ${title(jv)}</option>`;
}

/**
 * Fills `form` with the picker. `label` is the text before it (HTML),
 * `title(jv)` names each option and `onPick(jv)` runs when the reader picks
 * one. Returns { set(jv) } to move the dropdown without calling onPick.
 */
export function mountJvPicker(form, { label, title, onPick }) {
  const id = `${form.id}-select`;
  const options = allShifts().map((jv) => option(jv, title)).join('');
  form.classList.add('jv-pick');
  form.innerHTML = `<label for="${id}">${label}</label>
    <span class="jv-ctl">
      <button type="button" data-step="-1" aria-label="Previous Jv">‹</button>
      <select id="${id}">${options}</select>
      <button type="button" data-step="1" aria-label="Next Jv">›</button>
    </span>
    <span class="jv-key">${KEY}</span>`;
  const select = form.querySelector('select');
  select.addEventListener('change', () => onPick(Number(select.value)));
  form.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = Number(select.value) + Number(button.dataset.step);
      if (inRange(next)) onPick(next);
    });
  });
  form.addEventListener('submit', (event) => event.preventDefault());
  return { set: (jv) => { select.value = String(jv); } };
}
