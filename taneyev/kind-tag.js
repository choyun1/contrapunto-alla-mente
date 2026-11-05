// The tag that marks which kind of four-bar example a split has, shared by
// the splits table and the answer key on the three-voice page.

/** Returns the tag for 'first', 'mixed' or null (no example). */
export function kindTag(kind) {
  if (kind === 'first') return '<span class="kind-tag first">first species</span>';
  if (kind === 'mixed') return '<span class="kind-tag mixed">mixed species</span>';
  return '<span class="kind-none">none</span>';
}
