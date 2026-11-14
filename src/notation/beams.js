// Beaming for abc music lines in common time (M:C), following the usual engraving rules:
// notes shorter than a quarter share a beam within each quarter beat; four eighths that fill
// beats 1–2 or 3–4 share one beam across the half bar; an eighth left over from a dotted quarter
// joins the eighths of the next beat (a beam of three).

const TOKEN = /(\|\]|\|\||\|:|:\||\|)|([_=^]*[A-Ga-gz][,']*)([\d/]*)(-?)/y;
const EPS = 1e-9;
const BEAT = 1 / 4; // a quarter, in whole notes
const HALF = 1 / 2; // half a bar of common time

/** The length in whole notes of an abc length suffix ('', '2', '/', '3/2'), times the unit note. */
function lengthOf(suffix, unit) {
  if (suffix === '') return unit;
  if (/^\/+$/.test(suffix)) return unit / 2 ** suffix.length;
  const [top, bottom] = suffix.split('/');
  const n = top === '' ? 1 : Number(top);
  const d = bottom === undefined ? 1 : bottom === '' ? 2 : Number(bottom);
  return (n / d) * unit;
}

/** The notes and barlines of a music line: [{ text, bar } | { text, at, length, short }], time within the bar. */
function tokens(music, unit) {
  const out = [];
  let at = 0;
  let time = 0;
  while (at < music.length) {
    if (/\s/.test(music[at])) { at += 1; continue; }
    TOKEN.lastIndex = at;
    const match = TOKEN.exec(music);
    if (!match) throw new Error(`cannot read abc at: ${music.slice(at)}`);
    at = TOKEN.lastIndex;
    if (match[1]) {
      out.push({ text: match[1], bar: true });
      time = 0;
      continue;
    }
    const length = lengthOf(match[3], unit);
    const rest = match[2].includes('z');
    out.push({ text: match[0], at: time, length, rest, short: length < BEAT - EPS && !rest });
    time += length;
  }
  return out;
}

/** Is x a whole multiple of `size`? */
const onGrid = (x, size) => Math.abs(x / size - Math.round(x / size)) < EPS;

/** For each token, whether it joins the beam of the note before it, beaming by the quarter beat. */
function joinsByBeat(list) {
  const joins = [];
  let previous = null;
  for (const t of list) {
    if (t.bar) { joins.push(false); previous = null; continue; }
    const beat = Math.floor((t.at + EPS) / BEAT);
    const midBeat = t.at - beat * BEAT > EPS;
    const leftOver = t.short && midBeat && previous?.dotted; // the eighth after a dotted quarter
    const group = leftOver ? beat + 1 : beat;
    joins.push(Boolean(previous?.short && t.short && previous.group === group));
    const end = t.at + t.length;
    const endsInBeat = Math.floor((end - EPS) / BEAT) === beat;
    let ownGroup = endsInBeat ? beat : -1;
    if (leftOver) ownGroup = onGrid(end, BEAT) ? group : -1;
    previous = { short: t.short, group: ownGroup, dotted: !t.rest && t.length > BEAT + EPS && !onGrid(end, BEAT) };
  }
  return joins;
}

/** Joins widened so that four eighths filling beats 1–2 or 3–4 of a bar share one beam. */
function joinsByHalfBar(list, joins) {
  const out = [...joins];
  for (let i = 0; i + 3 < list.length; i += 1) {
    const four = list.slice(i, i + 4);
    const startsHalf = !four[0].bar && onGrid(four[0].at, HALF);
    const allEighths = four.every((t) => !t.bar && t.short && Math.abs(t.length - 1 / 8) < EPS);
    if (startsHalf && allEighths) for (let k = 1; k < 4; k += 1) out[i + k] = true;
  }
  return out;
}

/** A music line re-spaced so its eighths and shorter notes are beamed as engravers do in common time. */
export function beamed(music, unit) {
  const list = tokens(music, unit);
  const joins = joinsByHalfBar(list, joinsByBeat(list));
  const out = [];
  list.forEach((t, i) => out.push(joins[i] ? '' : ' ', t.text));
  return out.join('').trim();
}

/** An abc file with every [V:] music line re-beamed; the unit note comes from its L: field. */
export function beamedAbc(abc) {
  const field = /^L:\s*(\d+)\/(\d+)/m.exec(abc);
  const unit = field ? Number(field[1]) / Number(field[2]) : 1 / 8;
  return abc.split('\n').map((line) => {
    const m = /^(\[V:[^\]]+\])\s*(.*)$/.exec(line);
    return m ? `${m[1]} ${beamed(m[2], unit)}` : line;
  }).join('\n');
}
