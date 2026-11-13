// Draws the PNG copies of assets/favicon.svg, for browsers that don't show an SVG icon.
// Run it after changing favicon.svg:  node scripts/favicon-png.js
// It needs Playwright, which is not a dependency of the site; install it just for this.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../assets/favicon.svg', import.meta.url), 'utf8');
// Each copy: the file name and its size in pixels. The Apple touch icon gets a full-bleed tile,
// since iOS rounds the corners itself.
const COPIES = [
  { file: 'favicon-32.png', size: 32, square: false },
  { file: 'apple-touch-icon.png', size: 180, square: true },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, square } of COPIES) {
  const drawing = square ? svg.replace('rx="22"', 'rx="0"') : svg;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${drawing}`);
  await page.screenshot({ path: new URL(`../assets/${file}`, import.meta.url).pathname, omitBackground: true });
}
await browser.close();
