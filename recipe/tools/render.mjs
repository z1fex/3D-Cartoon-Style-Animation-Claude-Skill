// Frame-exact renderer for the 3D Cartoon engine: serves the package folder, drives headless Chrome on the GPU,
// and pipes each frame into FFmpeg. The film must be inside the package folder (for example examples/<slug>/film.mjs).
// Usage:
//   node render.mjs <film.mjs> <outDir> --stills 0.5,2.1,...|shots [--qa]    (PNG stills + contact sheet)
//   node render.mjs <film.mjs> <outDir> --video [--name f.mp4 --from s --to s] (silent H.264 MP4, 30 fps)
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { FFMPEG, CHROME, GPU_ARGS, chromium } from './paths.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'); // the package folder
const [filmArg, outArg, ...rest] = process.argv.slice(2);
if (!filmArg || !outArg) { console.error('usage: node recipe/tools/render.mjs <film.mjs> <outDir> [--stills shots|t1,t2] [--qa] [--video --name f.mp4 --from s --to s] [--no-captions]'); process.exit(2); }
const filmPath = path.relative(ROOT, path.resolve(filmArg)), outDir = path.resolve(outArg);
if (filmPath.startsWith('..') || path.isAbsolute(filmPath)) throw Error(`The film must be inside the package folder (${ROOT}); copy templates/new-film/ to examples/<slug>/.`);
const arg = name => { const i = rest.indexOf(name); return i < 0 ? null : rest[i + 1]; };
fs.mkdirSync(outDir, { recursive: true });

const mime = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.resolve(ROOT, '.' + p);
  if (!f.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(f, (err, b) => { if (err) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', mime[path.extname(f)] ?? 'application/octet-stream'); res.end(b); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium().launch({ headless: true, executablePath: CHROME, args: [...GPU_ARGS, '--enable-unsafe-webgpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const url = `http://127.0.0.1:${port}/recipe/engine/index.html?film=${encodeURIComponent('/' + filmPath.replace(/\\/g, '/'))}${rest.includes('--no-captions') ? '&captions=0' : ''}`;
  await page.goto(url);
  await page.waitForFunction(() => window.ready || window.loadError, null, { timeout: 180000 });
  const loadError = await page.evaluate(() => window.loadError);
  if (loadError) throw Error('Film failed to load:\n' + loadError + '\n' + errors.join('\n'));
  const info = await page.evaluate(() => window.filmInfo);
  console.log('film', info.duration.toFixed(2), 's,', info.shots.length, 'shots');
  if (info.fonts) console.log('caption fonts:', info.fonts.sans, '+', info.fonts.serif);
  // Framing check on every rendered frame: subjects must stay in frame and out of the caption band.
  const problems = [];
  const check = async t => { const f = await page.evaluate(() => window.framingLast()); for (const s of f?.subjects ?? []) if (s.problem) problems.push({ t: +t.toFixed(3), shot: f.shot, ...s }); };
  const report = () => {
    const byKey = new Map(); for (const p of problems) { const k = `${p.shot} | ${p.name} | ${p.problem}`; const v = byKey.get(k) ?? { from: p.t, to: p.t, n: 0, at: p }; v.to = p.t; v.n++; byKey.set(k, v); }
    fs.writeFileSync(path.join(outDir, 'framing-report.json'), JSON.stringify({ problems: [...byKey].map(([k, v]) => ({ issue: k, from: v.from, to: v.to, frames: v.n, example: v.at })) }, null, 1));
    console.log(byKey.size ? `FRAMING: ${byKey.size} issue(s)\n` + [...byKey].map(([k, v]) => `  ${k}  ${v.from.toFixed(2)}-${v.to.toFixed(2)} s (${v.n} frames, x ${v.at.x} y ${v.at.y})`).join('\n') : 'FRAMING: no issues');
  };
  if (rest.includes('--qa')) {
    for (let f = 0; f < Math.round(info.duration * 30); f += 2) { await page.evaluate(t => { window.renderFrame(t); return 0; }, f / 30); await check(f / 30); }
    report();
  }
  fs.writeFileSync(path.join(outDir, 'shots.json'), JSON.stringify(info, null, 1));
  if (arg('--stills')) {
    const times = arg('--stills') === 'shots' ? info.shots.map((s, i) => { const end = info.shots[i + 1]?.start ?? info.duration; return +(s.start + (end - s.start) * 0.62).toFixed(3); }) : arg('--stills').split(',').map(Number);
    const files = [];
    for (const [i, t] of times.entries()) {
      const t0 = Date.now(), b64 = await page.evaluate(t => window.renderFrame(t, 'png'), t);
      const f = path.join(outDir, `still-${String(i + 1).padStart(2, '0')}-${t.toFixed(2)}s.png`); fs.writeFileSync(f, Buffer.from(b64, 'base64')); files.push(f);
      console.log('still', t, (Date.now() - t0) + ' ms');
    }
    // Contact sheet: up to 6 per row at 270x480, each labelled with its time in the package's own Titan One
    // (FFmpeg runs in the fonts folder, so the font path needs no escaping on any system).
    const cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols), inputs = files.flatMap(f => ['-i', f]);
    const chains = files.map((f, i) => `[${i}:v]scale=270:480,drawtext=fontfile=TitanOne-Regular.ttf:text='${i + 1}  ${times[i].toFixed(2)}s':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.7[v${i}]`);
    const layout = files.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|');
    const r = spawnSync(FFMPEG, ['-v', 'error', '-y', ...inputs, '-filter_complex', chains.join(';') + ';' + files.map((_, i) => `[v${i}]`).join('') + `xstack=inputs=${files.length}:layout=${layout}:fill=black`, '-frames:v', '1', path.join(outDir, 'contact-sheet.png')], { encoding: 'utf8', cwd: path.join(ROOT, 'recipe/engine/fonts') });
    if (r.status !== 0 && files.length > 1) console.error(r.stderr);
  }
  if (rest.includes('--video')) {
    const fps = 30, from = +(arg('--from') ?? 0), to = +(arg('--to') ?? info.duration), frames = Math.round((to - from) * fps);
    const out = path.join(outDir, arg('--name') ?? 'video.mp4');
    // The browser's JPEG frames are full-range BT.601; deliver standard video (BT.709, limited range), tagged, so every player
    // and upload shows the same colours.
    const ff = spawn(FFMPEG, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      // Through RGB, because FFmpeg's scaler only changes the colour matrix when converting to or from RGB.
      '-vf', 'scale=in_range=full:in_color_matrix=bt601:flags=accurate_rnd,format=rgb24,scale=out_range=tv:out_color_matrix=bt709:flags=accurate_rnd,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = 0; f < frames; f++) {
      const b64 = await page.evaluate(t => window.renderFrame(t), from + f / fps); await check(from + f / fps);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await once(ff.stdin, 'drain');
      if (f % 90 === 0) console.log(`frame ${f}/${frames}  ${((Date.now() - t0) / Math.max(1, f)).toFixed(0)} ms/frame`);
    }
    ff.stdin.end(); await once(ff, 'close'); console.log('wrote', out, ((Date.now() - t0) / 1000).toFixed(1), 's'); report();
  }
  if (errors.length) console.log('page messages:\n' + errors.slice(0, 10).join('\n'));
} finally { await browser.close(); server.close(); }
