import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jvIcon } from '../src/ui/jv-picker.js';

test('the dropdown stars the common shifts (0, −7, −9, −11) and outlines Taneyev’s others', () => {
  for (const jv of [0, -7, -9, -11]) assert.equal(jvIcon(jv), '★');
  for (const jv of [-14, -13, -12, -4, -2, 3, 5]) assert.equal(jvIcon(jv), '☆');
  for (const jv of [-21, -8, 1, 21]) assert.equal(jvIcon(jv), '');
});
