// Voiceover for a 3D Cartoon short: ElevenLabs speech with per-character timing, then pauses tightened to the style's numbers.
// Usage: ELEVENLABS_API_KEY=... node voiceover.mjs <roundDir> [voiceId]
// Reads <roundDir>/vo/text.txt; writes vo/raw.mp3, vo/alignment.json, vo/voice.wav (48 kHz) and vo/words.json (tightened times).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const [roundDir, voiceId = 'JBFqnCBsd6RMkjVDRZzb'] = process.argv.slice(2);
import { FFMPEG } from './paths.mjs';
const vo = path.join(roundDir, 'vo'); mkdirSync(vo, { recursive: true });
const text = readFileSync(path.join(vo, 'text.txt'), 'utf8').trim();
// Style numbers: about 0.2 s after a sentence, never more than about 0.33 s; inner pauses stay short.
const SENTENCE_GAP = 0.2, CLAUSE_GAP = 0.1, KEEP_BELOW = 0.12;

if (!existsSync(path.join(vo, 'alignment.json'))) {
  const key = process.env.ELEVENLABS_API_KEY; if (!key) throw Error('ELEVENLABS_API_KEY is not set');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.38, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true, speed: +(process.env.VO_SPEED ?? 1.15) } }),
  });
  if (!res.ok) throw Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  writeFileSync(path.join(vo, 'raw.mp3'), Buffer.from(body.audio_base64, 'base64'));
  writeFileSync(path.join(vo, 'alignment.json'), JSON.stringify({ voiceId, text, alignment: body.alignment }, null, 1));
}

// Words from the character timing.
const { alignment } = JSON.parse(readFileSync(path.join(vo, 'alignment.json'), 'utf8'));
const words = []; let cur = null;
alignment.characters.forEach((ch, i) => {
  const a = alignment.character_start_times_seconds[i], b = alignment.character_end_times_seconds[i];
  if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
  if (!cur) cur = { text: '', start: a, end: b };
  cur.text += ch; cur.end = b;
});
if (cur) words.push(cur);
// ElevenLabs puts trailing punctuation's time inside the word; speech ends earlier, so trim punctuation-only tails.
for (const w of words) { w.clean = w.text.replace(/[^\p{L}\p{N}'’-]+/gu, '').toLowerCase(); }

// Cut each long gap down to its target, keeping the speech untouched.
const raw = path.join(vo, 'raw.wav');
const dec = spawnSync(FFMPEG, ['-v', 'error', '-y', '-i', path.join(vo, 'raw.mp3'), '-ar', '48000', '-ac', '1', raw], { encoding: 'utf8' });
if (dec.status !== 0) throw Error(`FFmpeg could not decode raw.mp3: ${dec.error?.message ?? dec.stderr}`);
const keep = []; let t = 0;
for (let i = 0; i < words.length; i++) {
  const w = words[i], next = words[i + 1];
  if (!next) { keep.push([t, w.end + 0.25]); break; }
  const gap = next.start - w.end;
  const target = /[.?!…]$/.test(w.text) ? SENTENCE_GAP : /[,;:]$/.test(w.text) ? CLAUSE_GAP : KEEP_BELOW;
  if (gap > target + 0.02) { const half = target / 2; keep.push([t, w.end + half]); t = next.start - half; }
}
const shift = []; let out = 0;
for (const [a, b] of keep) { shift.push({ a, b, offset: out - a }); out += b - a; }
const mapT = s => { for (const k of shift) if (s >= k.a - 1e-6 && s <= k.b + 1e-6) return s + k.offset; const k = shift.find(k => s < k.a) || shift.at(-1); return k.a + k.offset; };
const timed = words.map(w => ({ text: w.text, clean: w.clean, start: +mapT(w.start).toFixed(3), end: +mapT(w.end).toFixed(3) }));
const filter = keep.map(([a, b], i) => `[0:a]atrim=${a.toFixed(4)}:${b.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st=${Math.max(0, b - a - 0.006).toFixed(4)}:d=0.006[s${i}]`).join(';') + ';' + keep.map((_, i) => `[s${i}]`).join('') + `concat=n=${keep.length}:v=0:a=1[o]`;
const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-i', raw, '-filter_complex', filter, '-map', '[o]', '-ar', '48000', '-ac', '1', path.join(vo, 'voice.wav')], { encoding: 'utf8' });
if (r.status !== 0) throw Error(r.stderr);
writeFileSync(path.join(vo, 'words.json'), JSON.stringify({ duration: +out.toFixed(3), rawDuration: words.at(-1).end, words: timed }, null, 1));
console.log(`words ${timed.length}; raw ${words.at(-1).end.toFixed(2)} s -> tightened ${out.toFixed(2)} s`);
