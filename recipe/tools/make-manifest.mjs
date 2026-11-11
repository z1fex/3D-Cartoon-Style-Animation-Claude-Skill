// Writes package-manifest.json for the 3D Cartoon Animation package: identity, skill catalogue, style-picker entry,
// requirements, and every file with its size and SHA-256. Usage: node make-manifest.mjs <packageDir>
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = process.argv[2];
const SKIP = new Set(['node_modules', '.git', 'out']); // installed packages, version control and render output are not part of the package
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => { const p = path.join(d, e.name); return e.isDirectory() ? (SKIP.has(e.name) ? [] : walk(p)) : [p]; });
const rel = p => path.relative(root, p).split(path.sep).join('/');
const files = walk(root).filter(p => !p.endsWith('package-manifest.json')).sort().map(p => ({ path: rel(p), bytes: statSync(p).size, sha256: createHash('sha256').update(readFileSync(p)).digest('hex') }));
const front = file => { const s = readFileSync(path.join(root, file), 'utf8'); const m = s.match(/^---\n([\s\S]*?)\n---/); const o = {}; if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) o[line.slice(0, i).trim()] = line.slice(i + 1).trim(); } return o; };
const skills = readdirSync(path.join(root, 'skills')).sort().map(dir => { const f = `skills/${dir}/SKILL.md`, fm = front(f); return { id: dir.slice(0, 2), name: fm.name, path: f, description: fm.description }; });
const manifest = {
  name: '3d-cartoon-animation',
  display_name: '3D Cartoon Animation',
  version: '1.0.1',
  created: '2026-10-26',
  edition: 'public (2026-11-11): portable tools, private notes removed; films render the same as 1.0.0',
  maturity: 'owner-approved-on-one-film; method generalised for any topic',
  entrypoint: 'SKILL.md',
  readme: 'README.md',
  kind: 'style-package: markdown skills + a three.js frame-exact renderer + sound and QA tools + a worked example',
  owner_approval: { round: 1, version: 'v3', film: 'examples/how-gravity-was-found/final/How gravity was found - v3.mp4', date: '2026-10-26', words: 'I really like this. I really liked this video.' },
  owner: 'the person the films are made for, who approves the storyboard and the film',
  topic_neutral: true,
  skill_catalog: skills,
  style_picker: JSON.parse(readFileSync(path.join(root, 'preview/style-card.json'), 'utf8')),
  references: ['references/owner-direction.md', 'references/reference-study.md', 'references/engine-api.md', 'references/engine-notes.md', 'references/glitch-catalogue.md', 'references/feedback-history.md'],
  templates: ['templates/new-film/film.mjs', 'templates/new-topic-worksheet.md', 'templates/script-template.md', 'templates/storyboard-template.md', 'templates/storyboard.json', 'templates/round-review-template.md'],
  workflow: 'storyboard first (skill 4): the owner reviews and approves a visual storyboard in their own framework (recipe/tools/storyboard-board.mjs) before the voice, the build or any render; rule from 2026-10-27',
  evaluation: ['evaluation/delivery-checklist.md', 'evaluation/acceptance-criteria.md', 'evaluation/known-limits.md'],
  brand_kit: { readme: 'brand/README.md', palette: 'brand/palette.json', css: 'brand/palette.css', sheet: 'brand/style-sheet.png', drawnBy: 'recipe/tools/style-sheet.mjs', fontsIncluded: true },
  examples: [{ slug: 'how-gravity-was-found', status: 'approved', seconds: 30.3, shots: 20, effects: 80 }],
  requirements: {
    node: '>=22 (ES modules)', npm: ['playwright (npm install; npx playwright install chromium)'], browser: 'Playwright Chromium, or any Chrome with GPU WebGL2 (env CARTOON_CHROME)',
    ffmpeg: '>=6 with ffprobe, on the PATH (or env CARTOON_FFMPEG)', python: '>=3.10 with numpy (requirements.txt)', voice: 'ElevenLabs API key with text-to-speech permission (env ELEVENLABS_API_KEY, never stored)',
    paths: 'recipe/tools/paths.mjs (env CARTOON_FFMPEG, CARTOON_CHROME, CARTOON_PLAYWRIGHT)', tested: 'Windows 11',
  },
  licences: { 'three.js r186': 'MIT', 'Titan One': 'SIL OFL 1.1', 'TeX Gyre Heros (included; caption capitals)': 'GUST Font License', 'Instrument Serif (included; italic caption words)': 'SIL OFL 1.1', 'Helvetica / Editorial New': 'optional paid fonts, not included; licensed files go in recipe/engine/fonts/brand/', 'music and effects': 'synthesised in code; effect design after earshot docs (MIT)' },
  excluded: 'The reference tutorial\'s video, transcript and frame sheets (the creator\'s material) are not included; references/reference-study.md is our own summary, with credit.',
  verification: { date: '2026-11-11', setup: 'a clean copy: npm install, Playwright Chromium, FFmpeg on the PATH', reRenderedFromPackage: true, video: 'BT.709 limited range (1.0.0 was full-range)', colourAgainstApproved: 'mean 1.9/255, worst frame 2.3/255, PSNR >= 39 dB', jumpScan: 'the 6 flags of v3 plus the calendar flip at 4.07 s (a gag on the threshold)', storyboardBoardRenders: true, framingIssues: 'only the 2 intended (apple falling into frame; 1 frame at the trampoline edge)', soundLevels: 'accents median -9.1 dB, foley -14.9 dB vs voice; master -14.2 LUFS', templateRendersWithDraftTiming: true },
  files,
};
writeFileSync(path.join(root, 'package-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('files', files.length, 'bytes', files.reduce((s, f) => s + f.bytes, 0), 'skills', skills.length);
for (const s of skills) console.log(' ', s.id, s.name);
