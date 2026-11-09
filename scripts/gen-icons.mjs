// Renders public/favicon.svg into the PNG icons a PWA needs (uses the preinstalled Playwright Chromium).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')); }
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
// Maskable / Apple icons: full-bleed square background, artwork scaled into the safe zone.
const fullBleed = svg
  .replace('rx="116" ', '')
  .replace(/<g fill="none"/, '<g transform="translate(256 256) scale(0.8) translate(-256 -256)"><g fill="none"')
  .replace(/<rect x="128" y="300"[^>]*\/>/, (m) => `${m}</g>`);

const jobs = [
  ['pwa-192.png', svg, 192],
  ['pwa-512.png', svg, 512],
  ['maskable-512.png', fullBleed, 512],
  ['apple-touch-icon.png', fullBleed, 180],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, src, size] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${src.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
  );
  await page.screenshot({ path: `public/${name}`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('wrote', name);
}
await browser.close();
