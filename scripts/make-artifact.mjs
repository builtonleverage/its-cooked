// Turns the single-file build (dist-artifact/index.html) into an embeddable page fragment:
// <title> + inline <style> + markup + inline <script>, with no <html>/<head>/<body> wrappers
// (the host adds its own document skeleton). Output: dist-artifact/its-cooked.html
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]);
const styles = pick(/<style[\s\S]*?<\/style>/g);
const scripts = pick(/<script[\s\S]*?<\/script>/g);
const themeScript = scripts.find((s) => s.includes('its-cooked:theme')) ?? '';
const appScripts = scripts.filter((s) => s !== themeScript);

const out = [
  "<title>It's Cooked</title>",
  '<meta name="theme-color" content="#FFF8F1">',
  ...styles,
  themeScript,
  '<div id="root"></div>',
  ...appScripts,
].join('\n');
writeFileSync('dist-artifact/its-cooked.html', out);
console.log(`dist-artifact/its-cooked.html  ${(out.length / 1024).toFixed(0)} KB`);
