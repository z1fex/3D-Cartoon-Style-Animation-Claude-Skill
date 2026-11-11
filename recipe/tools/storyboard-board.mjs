// The owner's storyboard board (the owner is whoever approves the film). Make it before any film is built, and loop
// on it with the owner until they approve it.
// - The header: title · duration · size · BPM · scene count.
// - Numbered panels, each with:
//   - its time range, title and spoken words;
//   - a rendered thumbnail, with an optional strip of in-between frames for a transition;
//   - a "sound:" line and a "→ motion/transition" line;
//   - 👍/👎.
// It writes the board twice: as one PNG image, and as an HTML page. On the page, the 👍/👎 work, a 👎 opens a note,
// and "Copy feedback" puts the owner's verdicts on the clipboard, ready to paste back to Claude.
// Usage: node recipe/tools/storyboard-board.mjs <storyboard.json> [--out <name>]
//   It writes <name>.html and <name>.png next to the json. The name defaults to the json's "file", then to its own name.
// storyboard.json: { title, file?, duration, size, bpm?, story?, intro?: [text], questions?: [text],
//   panels: [{ t: [a, b], title, tag?, words?, frame, strip?: [[image, label], ...], explains?, sound, motion, alt? }] }
//   Image paths are relative to the json. A tag is shown as a chip: "kept from v1", "your idea", "new"...
//   story: the story in one sentence, shown under the title. explains: which part of the story this panel carries,
//   and how its picture explains it (the owner, 27 Oct 2026: "make sure the edit happens according to the story and
//   how well we can explain using the visuals").
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { CHROME, chromium } from './paths.mjs';

const [jsonPath, ...rest] = process.argv.slice(2);
const arg = n => { const i = rest.indexOf(n); return i < 0 ? null : rest[i + 1]; };
if (!jsonPath) { console.error('usage: node storyboard-board.mjs <storyboard.json> [--out <name>]'); process.exit(2); }
const sb = JSON.parse(fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '')), dir = path.dirname(path.resolve(jsonPath));
const name = arg('--out') ?? sb.file ?? path.basename(jsonPath, '.json');
for (const p of sb.panels) for (const img of [p.frame, ...(p.strip ?? []).map(x => x[0])]) if (img && !fs.existsSync(path.resolve(dir, img))) throw Error(`panel "${p.title}": missing image ${img}`);

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clock = v => { const m = Math.floor(v / 60), r = v - m * 60; return `${m}:${r.toFixed(1).padStart(4, '0')}`; };
const span = p => `${clock(p.t[0])}–${clock(p.t[1])}`;
const arrows = s => esc(s).replace(/\s*-&gt;\s*/g, ' → ');
const src = p => esc(path.isAbsolute(p) ? pathToFileURL(p).href : encodeURI(p.replace(/\\/g, '/'))); // relative to the json, or a full path
const tagClass = t => /kept/i.test(t) ? 'kept' : /your/i.test(t) ? 'yours' : 'new';
const meta = [clock(sb.duration), sb.size, sb.bpm ? `${sb.bpm} BPM` : null, `${sb.panels.length} ${sb.panels.length === 1 ? 'scene' : 'scenes'}`].filter(Boolean).join(' · ');

const panels = sb.panels.map((p, i) => `
  <li class="panel" data-n="${i + 1}">
    <div class="top"><span class="num">${i + 1}</span><span class="time">${span(p)}</span>${p.tag ? `<span class="tag ${tagClass(p.tag)}">${esc(p.tag)}</span>` : ''}</div>
    <h4>${esc(p.title)}</h4>
    ${p.words ? `<p class="words">“${esc(p.words)}”</p>` : ''}
    <div class="thumb"><img src="${src(p.frame)}" alt="Scene ${i + 1}: ${esc(p.title)}"></div>
    ${p.strip?.length ? `<div class="strip" style="grid-template-columns: repeat(${p.strip.length}, 1fr)">${p.strip.map(([img, label]) => `<figure><img src="${src(img)}" alt=""><figcaption>${esc(label)}</figcaption></figure>`).join('')}</div>` : ''}
    ${p.explains ? `<p class="explains"><b>explains:</b> ${esc(p.explains)}</p>` : ''}
    <p class="sound"><b>sound:</b> ${esc(p.sound)}</p>
    <p class="motion">→ ${arrows(p.motion)}</p>
    ${p.alt ? `<p class="alt"><b>or:</b> ${esc(p.alt)}</p>` : ''}
    <div class="verdict"><button type="button" data-v="keep" aria-pressed="false" title="Keep this scene">👍</button><button type="button" data-v="change" aria-pressed="false" title="Change this scene">👎</button></div>
    <textarea class="screen-only" rows="2" placeholder="What should change?" hidden></textarea>
  </li>`).join('');

const data = JSON.stringify({ title: sb.title, panels: sb.panels.map((p, i) => ({ n: i + 1, title: p.title, time: span(p), motion: p.motion, sound: p.sound, explains: p.explains ?? '' })) }).replace(/</g, '\\u003c');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(sb.title)}</title>
<style>
  :root { --ink: #322f42; --mute: #6e647e; --line: #e3d9ec; --purple: #4c3b71; --card: #faf8fd; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 34px 36px 40px; background: #f4f0f8; color: var(--ink); font: 14px/1.45 Inter, "Segoe UI", system-ui, sans-serif; }
  header { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 18px; border-bottom: 1px solid #e0d6ea; padding-bottom: 12px; }
  h1 { margin: 0; font-size: 27px; color: var(--purple); }
  .meta { margin: 0; font-size: 14px; color: var(--mute); font-variant-numeric: tabular-nums; }
  .intro { margin: 14px 0 0; display: grid; gap: 4px; font-size: 14.5px; color: #4f475e; max-width: 1500px; }
  .intro p { margin: 0; }
  .questions { margin: 12px 0 0; padding: 10px 14px; border: 1px solid #e6c9d2; border-radius: 12px; background: #fdf6f8; font-size: 14px; color: #5a3946; max-width: 1500px; }
  .questions b { color: #9b2c45; }
  .questions ol { margin: 4px 0 0; padding-left: 20px; }
  ol.grid { list-style: none; margin: 18px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; align-items: start; }
  .panel { display: grid; gap: 7px; border: 1px solid var(--line); border-radius: 14px; padding: 12px; background: var(--card); }
  .panel[data-verdict="keep"] { border-color: #9cc5a7; background: #f3faf5; }
  .panel[data-verdict="change"] { border-color: #d7a0b3; background: #fcf4f7; }
  .top { display: flex; align-items: center; gap: 8px; }
  .num { display: inline-grid; place-items: center; min-width: 26px; height: 26px; border-radius: 13px; background: var(--purple); color: #fff; font-size: 13px; font-weight: 700; }
  .time { font-size: 13px; color: var(--mute); font-variant-numeric: tabular-nums; }
  .tag { margin-left: auto; padding: 2px 9px; border-radius: 10px; font-size: 11.5px; font-weight: 600; }
  .tag.kept { background: #ece8f1; color: #6e647e; } .tag.yours { background: #fbe1e6; color: #b0243f; } .tag.new { background: #e6def3; color: var(--purple); }
  h4 { margin: 0; font-size: 16px; line-height: 1.3; }
  .words { margin: 0; font-size: 13.5px; font-style: italic; color: #4f475e; }
  .thumb { border-radius: 10px; overflow: hidden; background: #ece5f3; aspect-ratio: 9 / 16; }
  .thumb img, .strip img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .strip { display: grid; gap: 6px; }
  .strip figure { margin: 0; display: grid; gap: 2px; }
  .strip img { aspect-ratio: 9 / 16; border-radius: 6px; }
  .strip figcaption { font-size: 11px; color: var(--mute); text-align: center; font-variant-numeric: tabular-nums; }
  .sound, .motion, .alt { margin: 0; font-size: 13px; line-height: 1.45; color: #4f475e; }
  .sound b { color: var(--purple); font-weight: 600; }
  .explains { margin: 0; font-size: 13px; line-height: 1.45; color: #3c3550; } .explains b { color: #b0243f; font-weight: 600; }
  .story { margin: 10px 0 0; font-size: 16px; color: #322f42; max-width: 1500px; } .story b { color: #b0243f; }
  .motion { color: #62566f; }
  .alt { padding: 6px 8px; border-radius: 8px; background: #f6efe7; color: #6b4a2f; } .alt b { color: #8a4e2a; }
  .verdict { display: flex; gap: 6px; }
  .verdict button { flex: 1; min-height: 34px; border: 1px solid #dcd1e4; border-radius: 9px; background: #fff; font-size: 16px; cursor: pointer; }
  .verdict button[aria-pressed="true"] { border-color: var(--purple); background: #e9def3; }
  textarea { width: 100%; border: 1px solid #dcd1e4; border-radius: 9px; background: #fff; color: var(--ink); padding: 7px 9px; font: inherit; font-size: 13px; resize: vertical; }
  footer { margin-top: 20px; display: grid; gap: 8px; max-width: 1500px; }
  footer button { justify-self: start; padding: 9px 18px; border: 0; border-radius: 10px; background: var(--purple); color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
  footer pre { margin: 0; white-space: pre-wrap; font: 12.5px/1.5 Consolas, monospace; color: #4f475e; }
  .png-only { display: none; }
  html.png .screen-only { display: none !important; } html.png .png-only { display: block; }
</style></head>
<body>
<header><h1>${esc(sb.title)}</h1><p class="meta">${esc(meta)}</p></header>
${sb.story ? `<p class="story"><b>The story:</b> ${esc(sb.story)}</p>` : ''}
${sb.intro?.length ? `<div class="intro">${sb.intro.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
${sb.questions?.length ? `<div class="questions"><b>Decisions for you</b><ol>${sb.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ol></div>` : ''}
<ol class="grid">${panels}
</ol>
<footer>
  <p class="png-only">Reply with the scene numbers: 👍 to keep, 👎 to change, and what to change. Or open the .html version of this board, mark each scene, and press "Copy feedback".</p>
  <label class="screen-only">Anything else to change?<textarea id="overall" rows="3" placeholder="For example: make the glitch longer, or end on his face."></textarea></label>
  <button class="screen-only" id="copy" type="button">Copy feedback</button>
  <pre class="screen-only" id="out"></pre>
</footer>
<script>
  const SB = ${data}, state = {};
  if (location.search.includes('png')) document.documentElement.classList.add('png');
  document.querySelectorAll('.panel').forEach(li => {
    const n = li.dataset.n, note = li.querySelector('textarea');
    li.querySelectorAll('.verdict button').forEach(b => b.addEventListener('click', () => {
      const s = state[n] ??= { note: '' }; s.verdict = s.verdict === b.dataset.v ? undefined : b.dataset.v;
      li.dataset.verdict = s.verdict ?? '';
      li.querySelectorAll('.verdict button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === s.verdict)));
      note.hidden = s.verdict !== 'change';
    }));
    note.addEventListener('input', () => { (state[n] ??= {}).note = note.value; });
  });
  // plain words to paste back to Claude: kept and changed scenes, and what each changed one was
  function feedback() {
    const lines = SB.panels.flatMap(p => {
      const s = state[p.n], note = (s?.note ?? '').trim(), label = 'scene ' + p.n + ' "' + p.title + '" (' + p.time + ')';
      if (s?.verdict === 'keep') return ['- Keep ' + label + (note ? ': ' + note : '') + '.'];
      if (s?.verdict === 'change' || note) return ['- Change ' + label + ': ' + (note || 'rework this scene') + '. It was: ' + (p.explains ? 'explains "' + p.explains + '"; ' : '') + 'motion "' + p.motion + '"; sound "' + p.sound + '".'];
      return [];
    });
    const overall = document.getElementById('overall').value.trim(); if (overall) lines.push('- Overall: ' + overall);
    return lines.length ? 'Storyboard feedback on ' + SB.title + ':\\n' + lines.join('\\n') : 'No scenes marked yet.';
  }
  document.getElementById('copy').addEventListener('click', async () => {
    const text = feedback(), out = document.getElementById('out'); out.textContent = text;
    try { await navigator.clipboard.writeText(text); out.textContent = text + '\\n\\n(copied: paste it into the chat)'; }
    catch { const r = document.createRange(); r.selectNodeContents(out); getSelection().removeAllRanges(); getSelection().addRange(r); }
  });
</script>
</body></html>
`;
const htmlFile = path.join(dir, name + '.html'), pngFile = path.join(dir, name + '.png');
fs.writeFileSync(htmlFile, html);

const browser = await chromium().launch({ headless: true, executablePath: CHROME, args: ['--force-device-scale-factor=1', '--hide-scrollbars'] });
try {
  const page = await browser.newPage({ viewport: { width: 1960, height: 1200 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('requestfailed', r => errors.push('missing: ' + decodeURIComponent(r.url())));
  await page.goto(pathToFileURL(htmlFile).href + '?png');
  await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 60000 });
  await page.screenshot({ path: pngFile, fullPage: true });
  if (errors.length) console.log('page messages:\n' + errors.join('\n'));
} finally { await browser.close(); }
console.log('wrote', htmlFile); console.log('wrote', pngFile);
