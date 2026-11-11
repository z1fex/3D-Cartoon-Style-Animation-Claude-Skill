// STARTER FILM for any topic in the 3D Cartoon Animation style. Copy this folder to examples/<your-topic>/ and edit.
// It runs before a voiceover exists: without vo/words-final.json it times the SCRIPT at 3.3 words a second
// ("draft timing") so the storyboard stills can be reviewed first. After voiceover.mjs has run, the real word
// timings are used automatically and nothing else changes.
//
// The demo below is a placeholder topic ("How fast is a sneeze?") that shows every building block once:
//   a host character in an interior, a fact device (flip counter) landing on its number, an exterior shot with
//   a physical gag, a studio-void diagram shot, editorial captions, the topic title hook and sound cues.
import { THREE, BRAND, F, v3, prog, ease, travel, mix, part, tint } from '../../recipe/engine/core.mjs';
import { makeCharacter, POSES, SKIN } from '../../recipe/engine/character.mjs';
import * as Kit from '../../recipe/engine/kit.mjs';
import * as P from '../../recipe/engine/props.mjs';
import * as P2 from '../../recipe/engine/props2.mjs';

// 1. The narration, one clause per shot. Keep it identical to vo/text.txt once the voice is made.
const SCRIPT = "Your sneeze is faster than you think. It blasts out at about one hundred miles an hour. That's highway speed, straight out of your nose.";
const LEAD = 4 * F, FACE = 2 * F; // gestures land 4 frames before their word, faces swap 2 frames before

async function loadWords() {
  try { const r = await fetch(new URL('./vo/words-final.json', import.meta.url)); if (r.ok) return await r.json(); } catch { /* draft timing below */ }
  const words = []; let t = 0.15;
  for (const text of SCRIPT.split(/\s+/)) { const d = 0.12 + 0.045 * text.replace(/[^a-z]/gi, '').length; words.push({ text, start: +t.toFixed(3), end: +(t + d).toFixed(3) }); t += d + (/[.?!]$/.test(text) ? 0.25 : /[,:;]$/.test(text) ? 0.12 : 0.04); }
  return { words, duration: t + 0.3, draft: true };
}

export async function build() {
  const { words, duration } = await loadWords();
  const W = i => words[i].start;

  // 2. Places: start from the kit and dress them (props make the set feel lived in).
  const room = Kit.interior({ light: 'night', window: 'day' });
  const desk = P.desk(); desk.position.set(0.3, 0, -0.9); room.scene.add(desk);
  const shelf = P.bookshelf(); shelf.position.set(2.9, 0, -2.3); room.scene.add(shelf);
  const counter = P.flipCounter({ cells: 3, label: 'MPH' }); counter.group.position.set(-1.2, 1.9, -1.9); counter.group.scale.setScalar(0.9); room.scene.add(counter.group);
  const street = Kit.exterior({ time: 'day', clear: [[0, 0.8, 1.4]] });
  const lamp = P2.lampPost(); lamp.position.set(-2.2, 0, -1.2); street.scene.add(lamp);
  const lab = Kit.studioVoid({ color: BRAND.whiteSand });
  const board = P2.easelBoard(); board.group.position.set(0, 0, -1.2); lab.scene.add(board.group);

  // 3. Cast: an original character built from the parts (skin tone, outfit in brand colours, hair, hat, glasses).
  const host = makeCharacter({ name: 'host', skin: SKIN.tan, top: BRAND.blueCoral, bottom: BRAND.anthracite, hair: 'curly', hairColor: '#2a1d18', glasses: true });
  host.root.position.set(0.2, 0, 0.6); room.scene.add(host.root);
  const walker = makeCharacter({ name: 'walker', skin: SKIN.light, top: BRAND.rougeNoir, bottom: BRAND.cognac, hair: 'bob', hairColor: '#6b3b22', hat: 'beret', hatColor: BRAND.anthracite });
  walker.root.position.set(0, 0, 0.8); street.scene.add(walker.root);

  // 4. Camera: orbit a named subject [at, distance, yaw°, pitch°, fov]; the subject sits ~43% from the top.
  const move = (cam, t, s, from, to) => {
    const u = travel((t - s.start) / (s.end + 6 * F - s.start)), L = k => mix(from[k], to[k], u), at = new THREE.Vector3().lerpVectors(v3(...from[0]), v3(...to[0]), u);
    const d = L(1), yaw = L(2) * Math.PI / 180, pitch = L(3) * Math.PI / 180, fov = L(4);
    cam.position.copy(at).add(v3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(d));
    cam.lookAt(at.clone().add(v3(0, -d * Math.tan(fov * Math.PI / 360) * 0.14, 0))); return { focus: d, fov };
  };
  const head = rig => () => rig.headPos(), HR = 0.46;
  /** Times where a counter driven by value(t) changes what it shows, at least `gap` apart (for tick cues). */
  const changes = (a, b, value, gap = 0.06) => { const out = []; let last = value(a), lastT = -1; for (let t = a; t <= b + 1e-6; t += 1 / 240) { const v = value(t); if (v !== last && t - lastT >= gap) { out.push(t); lastT = t; } last = v; } return out; };

  // 5. Shots: one per clause. `w` is the index of the shot's first word; `subjects` feed the framing check.
  const shots = [
    { name: 'Hook: your sneeze', w: 0, set: room, subjects: () => [['host', head(host), HR]], apply(t, cam, s) {
      host.animate(t, [[0, 'stand'], [W(3) - LEAD, 'present']]); host.faceAt(t, [[0, 'curious'], [W(3) - FACE, 'surprised']]);
      return move(cam, t, s, [[0.2, 1.5, 0.6], 3.4, 12, 6, 46], [[0.2, 1.5, 0.6], 2.9, 6, 5, 46]);
    } },
    { name: 'One hundred miles an hour', w: 6, set: room, subjects: () => [['counter', counter.group, 0.5], ['host', head(host), HR]], apply(t, cam, s) {
      const k = prog(t, W(9) - 0.1, W(14) - LEAD, ease.out); counter.set(String(Math.round(100 * k)).padStart(3, ' '));
      host.animate(t, [[0, 'present'], [W(14) - LEAD, 'pointUp']]); host.faceAt(t, [[0, 'surprised'], [W(14) - FACE, 'eureka']]);
      return move(cam, t, s, [[-0.5, 1.65, -0.55], 6.4, -2, 4, 50], [[-0.5, 1.65, -0.55], 5.8, 3, 3, 50]);
    } },
    { name: "That's highway speed", w: 15, set: street, subjects: () => [['walker', head(walker), HR]], apply(t, cam, s) {
      const jolt = prog(t, W(17) - LEAD - 2 * F, W(17) - LEAD, ease.out) * (1 - prog(t, W(17), W(17) + 0.4, ease.inOut));
      walker.pose({ ...POSES.stand, hipsY: 0.2 * jolt, headPitch: -0.3 * jolt }); walker.faceAt(t, [[0, 'neutral'], [W(17) - FACE, 'shocked']]);
      return move(cam, t, s, [[0, 1.2, 0.8], 4.0, 10, 8, 48], [[0, 1.2, 0.8], 3.5, 4, 6, 48]);
    } },
    { name: 'Straight out of your nose', w: 18, set: lab, subjects: () => [['board', board.board, 0.6]], apply(t, cam, s) {
      const write = prog(t, W(19), W(words.length - 1) + 0.2, ease.linear);
      board.draw(String(Math.round(write * 20)), (c, w, h) => { c.lineWidth = 10; c.beginPath(); c.moveTo(90, h * 0.6); c.lineTo(90 + (w - 180) * write, h * 0.6 - 40 * write); c.stroke(); c.font = '600 110px "Titan One"'; c.fillText('NOSE → 100 MPH', 70, h * 0.32); });
      return move(cam, t, s, [[0, 1.75, -1.2], 4.4, 0, 4, 46], [[0, 1.75, -1.2], 3.8, 0, 3, 46]);
    } },
  ];
  shots.forEach((s, i) => { s.start = i === 0 ? 0 : W(s.w); s.end = i + 1 < shots.length ? W(shots[i + 1].w) : duration; });

  // 6. Captions: one lockup per clause. Plain = Helvetica Bold capitals, *italic* = Editorial New in brand red, ^ = big, " / " = new row.
  const captions = [
    'Your sneeze is faster => YOUR ^SNEEZE / *is faster*',
    'than you think. => THAN YOU / ^*think.*',
    'It blasts out at about => IT ^BLASTS / *out at about*',
    'one hundred miles an hour. => ^100 / *miles an hour.*',
    "That's highway speed, => THAT'S / ^*highway speed,*",
    'straight out of your nose. => STRAIGHT OUT / *of your* ^NOSE',
  ];
  // 7. The topic question at the top for the first 2-3 s.
  const title = { text: 'How fast is a *sneeze?*', start: 0, end: Math.min(duration, W(6) + 0.3) };
  // 8. Sound: a cue on every visible action (foley) and accents on the beats (see skills/11-sound-design-and-mix).
  const cues = [
    { t: 0.02, type: 'pop', gain: 0.7 }, { t: W(3) - LEAD - 0.1, type: 'swish', gain: 0.6 },
    { t: W(6) - 0.08, type: 'whoosh', gain: 0.6 },
    ...changes(W(9) - 0.1, W(14) - LEAD, t => Math.round(100 * prog(t, W(9) - 0.1, W(14) - LEAD, ease.out))).map(t => ({ t, type: 'tick', gain: 0.7 })),
    { t: W(14) - LEAD, type: 'ding', gain: 1 },
    { t: W(15) - 0.08, type: 'whoosh', gain: 0.7 }, { t: W(17) - LEAD, type: 'boing', gain: 0.8, stop: true },
    { t: W(18) - 0.08, type: 'whoosh', gain: 0.6 }, { t: W(19), type: 'chalk', gain: 0.9, dur: Math.max(0.3, W(words.length - 1) + 0.2 - W(19)) },
  ];
  return { duration, words, shots, captions, title, cues };
}
