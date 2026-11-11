// Per-frame change of a video (mean absolute difference on a 54x96 grey copy), flagging jumps away from shot changes.
// Usage: node jump-scan.mjs <video> <shots.json>
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const [video, shotsFile] = process.argv.slice(2);
import { FFMPEG as FF } from './paths.mjs';
const W = 54, H = 96, S = W * H;
const shots = JSON.parse(readFileSync(shotsFile, 'utf8')).shots.map(s => s.start);
const ff = spawn(FF, ['-v', 'error', '-i', video, '-vf', `scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-']);
const chunks = []; ff.stdout.on('data', d => chunks.push(d));
await new Promise(r => ff.on('close', r));
const buf = Buffer.concat(chunks), n = buf.length / S, diffs = [];
for (let i = 1; i < n; i++) { let s = 0; for (let k = 0; k < S; k++) s += Math.abs(buf[i * S + k] - buf[(i - 1) * S + k]); diffs.push({ f: i, t: i / 30, d: s / S }); }
const sorted = diffs.map(x => x.d).sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)];
const nearShot = t => shots.some(s => t >= s - 0.04 && t <= s + 0.25);
console.log('frames', n, 'median change', median.toFixed(2));
for (const x of diffs) {
  const local = diffs.slice(Math.max(0, x.f - 6), x.f + 5).map(y => y.d).sort((a, b) => a - b), base = local[Math.floor(local.length / 2)];
  if (x.d > Math.max(3, base * 3) && !nearShot(x.t)) console.log(`JUMP frame ${x.f} t=${x.t.toFixed(2)} change ${x.d.toFixed(1)} (around ${base.toFixed(1)})`);
}
