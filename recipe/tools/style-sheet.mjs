// Draws brand/style-sheet.png: the style's colours and fonts on one page, from brand/palette.json, set in the package's
// own font files. It first checks that palette.json matches the engine's BRAND and HIGHLIGHT in recipe/engine/core.mjs,
// so the sheet always shows the colours the films are actually made with.
// Usage: node recipe/tools/style-sheet.mjs   (after changing a colour in core.mjs and palette.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHROME, chromium } from './paths.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pal = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand/palette.json'), 'utf8'));
const core = fs.readFileSync(path.join(ROOT, 'recipe/engine/core.mjs'), 'utf8');
const engine = Object.fromEntries([...core.match(/export const BRAND = \{([^}]*)\}/)[1].matchAll(/(\w+): '(#[0-9A-Fa-f]{6})'/g)].map(m => [m[1], m[2]]));
engine.highlight = core.match(/export const HIGHLIGHT = '(#[0-9A-Fa-f]{6})'/)[1];
for (const c of pal.colours) if (engine[c.id]?.toUpperCase() !== c.hex.toUpperCase()) throw Error(`brand/palette.json: ${c.name} is ${c.hex}, but the engine uses ${engine[c.id]}`);
for (const id of Object.keys(engine)) if (!pal.colours.some(c => c.id === id)) throw Error(`brand/palette.json is missing the engine colour "${id}"`);

const col = Object.fromEntries(pal.colours.map(c => [c.id, c.hex]));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ');
const face = (family, file, descriptors = '') => `@font-face { font-family: "${family}"; ${descriptors} src: url(data:font/${path.extname(file).slice(1)};base64,${fs.readFileSync(path.join(ROOT, file)).toString('base64')}); }`;
const [sans, serif, label] = pal.fonts;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${face('Heros', sans.file, 'font-weight: 700;')}
${face('Heros', 'recipe/engine/fonts/standin/texgyreheros-regular.otf', 'font-weight: 400;')}
${face('Serif', serif.file, 'font-style: italic;')}
${face('Titan', label.file)}
* { box-sizing: border-box; }
body { margin: 0; width: 1080px; padding: 64px 60px 56px; background: ${col.anthracite}; color: ${col.whiteSand}; font: 400 21px/1.4 Heros, sans-serif; }
h1 { margin: 0; font: 700 64px/1 Heros; letter-spacing: -0.5px; }
h1 em { display: block; margin-top: 6px; font: italic 400 76px/1 Serif; color: ${col.highlight}; }
h2 { margin: 56px 0 22px; font: 700 26px/1 Heros; text-transform: uppercase; letter-spacing: 3px; opacity: 0.7; }
.swatches { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.chip { height: 150px; border-radius: 16px; box-shadow: inset 0 0 0 2px rgba(231, 227, 221, 0.22); }
.swatches b { display: block; margin-top: 14px; font: 700 25px/1.2 Heros; }
.code { font-size: 19px; opacity: 0.85; }
.use { margin-top: 6px; font-size: 17px; line-height: 1.35; opacity: 0.65; }
.font { display: grid; grid-template-columns: 470px 1fr; gap: 28px; align-items: center; padding: 26px 0; border-top: 1px solid rgba(231, 227, 221, 0.15); }
.stage { height: 190px; border-radius: 16px; background: radial-gradient(120% 90% at 50% 20%, #3b4a3f, #1f2a24 70%); display: grid; place-items: center; overflow: hidden; }
.font b { display: block; font: 700 27px/1.2 Heros; }
.font .use { font-size: 18px; }
.title { white-space: nowrap; font: 700 33px/1 Heros; color: ${col.whiteSand}; text-shadow: 0 3px 10px rgba(0,0,0,.45); }
.title span { display: inline-block; padding: 2px 10px 6px; margin: 0 4px; border-radius: 10px; background: ${col.rougeNoir}; font: italic 400 44px/1 Serif; }
.lockup { text-align: center; text-shadow: 0 4px 14px rgba(8,4,6,.6); }
.lockup .big { font: 700 60px/0.9 Heros; letter-spacing: -1px; }
.lockup .it { margin-top: -4px; margin-left: 80px; font: italic 400 52px/1 Serif; color: ${col.highlight}; }
.plates { display: flex; gap: 16px; }
.plate { padding: 14px 22px 10px; border-radius: 14px; font: 64px/1 Titan; }
footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(231, 227, 221, 0.15); font-size: 19px; opacity: 0.8; }
</style></head><body>
<h1>3D Cartoon Animation<em>colours and fonts</em></h1>
<h2>Colours</h2>
<div class="swatches">${pal.colours.map(c => `<div><div class="chip" style="background:${c.hex}"></div><b>${esc(c.name)}</b><div class="code">${c.hex} · RGB ${rgb(c.hex)}</div><div class="use">${esc(c.use)}</div></div>`).join('')}</div>
<h2>Fonts</h2>
<div class="font"><div class="stage"><div class="title">How was<span>gravity</span>found?</div></div>
  <div><b>${esc(sans.name)} + ${esc(serif.name)}</b><div class="use">The title question: capitals in ${esc(sans.name)}, the key word in ${esc(serif.name)} on a Rouge Noir box.</div></div></div>
<div class="font"><div class="stage"><div class="lockup"><div class="big">EVERYTHING</div><div class="it">you know</div></div></div>
  <div><b>Captions</b><div class="use">Big words in ${esc(sans.name)} (${esc(sans.note)}, ${esc(sans.licence)}); the surprising words in ${esc(serif.name)} (${esc(serif.licence)}), in Brand Red.</div></div></div>
<div class="font"><div class="stage" style="background:radial-gradient(120% 90% at 50% 20%, #6d5340, #2c2119 70%)"><div class="plates"><div class="plate" style="background:${col.rougeNoir};color:${col.whiteSand}">YEAR</div><div class="plate" style="background:${col.whiteSand};color:${col.anthracite}">1666</div></div></div>
  <div><b>${esc(label.name)}</b><div class="use">Labels on props: counters, calendars and signs (${esc(label.licence)}).</div></div></div>
<footer>Everything here is included in the package: the font files are in <b>recipe/engine/fonts/</b> with their licences. Nothing to download.</footer>
</body></html>`;

const browser = await chromium().launch({ headless: true, executablePath: CHROME, args: ['--force-device-scale-factor=1'] });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 800 } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() => ['700 20px Heros', '400 20px Heros', 'italic 20px Serif', '20px Titan'].filter(f => !document.fonts.check(f)));
  if (missing.length) throw Error('fonts did not load: ' + missing.join(', '));
  const out = path.join(ROOT, 'brand/style-sheet.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('wrote', out);
} finally { await browser.close(); }
