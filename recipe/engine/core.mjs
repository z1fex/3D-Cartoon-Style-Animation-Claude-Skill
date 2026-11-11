// 3D Cartoon style engine core: toon look (banded shading, ink outlines, rim light), Cinema post (depth of field,
// bloom, grade, grain), shot compositing with dissolves, captions, and pure time helpers. Every frame is a pure function of t.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };
export const FPS = 30, W = 1080, H = 1920, F = 1 / FPS;
export const BRAND = { rougeNoir: '#5B0D18', blueCoral: '#083B3A', cognac: '#8A4E2A', whiteSand: '#E7E3DD', anthracite: '#1B1B1F' };

/** A brand colour mixed toward another (in linear light). Brand colours are deep; large surfaces use lifted tints. */
export function tint(hex, k = 0.3, toward = BRAND.whiteSand) { return new THREE.Color(hex).lerp(new THREE.Color(toward), k); }
/** Environment tints that keep the brand hues alive under warm light: Blue Coral greens and teals for nature. */
export const ENV = { grass: tint(BRAND.blueCoral, 0.42, '#5e9c78'), grassDark: tint(BRAND.blueCoral, 0.3, '#4f8a6a'), leaf: tint(BRAND.blueCoral, 0.46, '#4f9a84'), leafLight: tint(BRAND.blueCoral, 0.56, '#62ab90'), leafDark: tint(BRAND.blueCoral, 0.34, '#3f8574') };

// ---------- time helpers ----------
export const clamp01 = x => Math.min(1, Math.max(0, x));
export const mix = (a, b, k) => a + (b - a) * k;
export const ease = {
  linear: x => x,
  inOut: x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  out: x => 1 - Math.pow(1 - x, 3),
  in: x => x * x * x,
  back: x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
};
/** Progress of t through [a, b], eased. */
export const prog = (t, a, b, e = ease.inOut) => e(clamp01((t - a) / Math.max(1e-6, b - a)));
/**
 * Camera travel profile for the style: fast on arrival, a slow creep through the middle,
 * then accelerating into the next transition (v(0)=v(1)=1.8, v(0.5)=0.6).
 */
export const travel = u => { u = clamp01(u); return 0.6 * u + 1.2 * ((2 * u - 1) ** 3 + 1) / 6; };
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
/** Deterministic pseudo-random in [0, 1) from integer seeds. */
export function rand(seed) { let s = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0; s ^= s >>> 13; s = Math.imul(s, 0xc2b2ae35) >>> 0; s ^= s >>> 16; return (s >>> 0) / 4294967296; }

// ---------- materials ----------
const gradient = (() => {
  // Soft toon: a gentle ramp with a lifted shadow side, so heads read round without hard bands.
  const t = new THREE.DataTexture(new Uint8Array([88, 112, 150, 196, 232, 255]), 6, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
})();
/** Shared rim uniforms so each set can choose its rim colour and strength. */
export const RIM = { rimColor: { value: new THREE.Color('#fff0d8') }, rimStrength: { value: 0.28 } };
function addRim(shader) {
  shader.uniforms.rimColor = RIM.rimColor; shader.uniforms.rimStrength = RIM.rimStrength;
  shader.fragmentShader = 'uniform vec3 rimColor;\nuniform float rimStrength;\n' + shader.fragmentShader.replace('#include <opaque_fragment>',
    '{ vec3 vd = normalize(vViewPosition); float f = 1.0 - clamp(dot(normal, vd), 0.0, 1.0);\n' +
    '  outgoingLight += rimColor * smoothstep(0.5, 0.92, f) * rimStrength * (0.45 + 0.55 * diffuseColor.rgb); }\n#include <opaque_fragment>');
}
/** Banded toon material with the style's soft rim light. */
export function toon(color, opts = {}) {
  const m = new THREE.MeshToonMaterial({ color: color instanceof THREE.Color ? color : new THREE.Color(color), gradientMap: gradient, ...opts });
  m.onBeforeCompile = addRim; return m;
}
/** Self-lit material for lamps, screens and LED digits; bright enough to bloom. */
export function glow(color, strength = 2.2) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), toneMapped: true }); }

// Ink outline: back-face hull pushed out by a constant number of screen pixels.
const inkCache = new Map();
function inkMaterial(px, color) {
  const key = px + color; if (inkCache.has(key)) return inkCache.get(key);
  const m = new THREE.ShaderMaterial({
    uniforms: { ink: { value: new THREE.Color(color) }, px: { value: px } }, side: THREE.BackSide,
    vertexShader: 'uniform float px;\nvoid main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 n = normalize(normalMatrix * normal);\n' +
      ` float k = px * 2.0 / (projectionMatrix[1][1] * ${H.toFixed(1)}); mv.xyz += n * k * max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: 'uniform vec3 ink;\nvoid main(){ gl_FragColor = vec4(ink, 1.0);\n#include <colorspace_fragment>\n}',
  });
  inkCache.set(key, m); return m;
}
/** Adds an ink outline to a mesh (and returns the mesh). */
export function ink(mesh, px = 2.6, color = BRAND.anthracite) {
  const o = new THREE.Mesh(mesh.geometry, inkMaterial(px, color)); o.name = 'ink'; o.castShadow = false; o.receiveShadow = false; o.userData.ink = true;
  mesh.add(o); return mesh;
}
/** Mesh helper: toon material, shadows and an ink outline. */
export function part(geometry, color, { px = 2.6, cast = true, receive = true, opts } = {}) {
  const m = new THREE.Mesh(geometry, color instanceof THREE.Material ? color : toon(color, opts));
  m.castShadow = cast; m.receiveShadow = receive; if (px > 0) ink(m, px); return m;
}

// ---------- canvas textures ----------
export function canvasTexture(w, h, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------- renderer, post and compositor ----------
export class Studio {
  constructor() {
    this.gl = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.gl.setPixelRatio(1); this.gl.setSize(W, H, false);
    this.gl.shadowMap.enabled = true; this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.gl.toneMapping = THREE.NeutralToneMapping; this.gl.toneMappingExposure = 1.0;
    this.camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 400);
    const empty = new THREE.Scene();
    this.composer = new EffectComposer(this.gl); this.composer.setPixelRatio(1); this.composer.setSize(W, H);
    this.renderPass = new RenderPass(empty, this.camera);
    this.bokeh = new BokehPass(empty, this.camera, { focus: 5, aperture: 0.0025, maxblur: 0.007 });
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.4, 0.5, 0.97);
    this.grade = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, seed: { value: 0 }, grain: { value: 0.026 }, vignette: { value: 0.34 }, warmth: { value: 0.02 }, contrast: { value: 1.14 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float seed, grain, vignette, warmth, contrast; varying vec2 vUv;
        float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21) + seed); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = (vUv - 0.5) * vec2(1.0, 1.25); c.rgb = pow(max(c.rgb, 0.0), vec3(contrast)) * 1.06;
          c.rgb *= mix(1.0 - vignette, 1.0, smoothstep(0.78, 0.18, length(d)));
          c.rgb *= vec3(1.0 + warmth, 1.0, 1.0 - warmth);
          c.rgb += (hash(vUv * vec2(${W}.0, ${H}.0)) - 0.5) * grain * (0.35 + c.rgb);
          gl_FragColor = c; }`,
    });
    this.composer.addPass(this.renderPass); this.composer.addPass(this.bokeh); this.composer.addPass(this.bloom);
    this.composer.addPass(this.grade); this.composer.addPass(new OutputPass());
    this.out = document.createElement('canvas'); this.out.width = W; this.out.height = H; this.ctx = this.out.getContext('2d');
  }
  /** Renders one shot's state into the compositor at the given opacity. */
  draw(scene, { focus = 5, aperture = 0.0025, maxblur = 0.007, bloom = 0.55, exposure = 1 } = {}, alpha = 1, seed = 0) {
    this.renderPass.scene = this.bokeh.scene = scene;
    const u = this.bokeh.uniforms; u.focus.value = focus; u.aperture.value = aperture; u.maxblur.value = maxblur;
    u.nearClip.value = this.camera.near; u.farClip.value = this.camera.far; u.aspect.value = this.camera.aspect;
    this.bloom.strength = bloom; this.gl.toneMappingExposure = exposure; this.grade.uniforms.seed.value = seed;
    this.composer.render();
    this.ctx.globalAlpha = alpha; this.ctx.drawImage(this.gl.domElement, 0, 0, W, H); this.ctx.globalAlpha = 1;
  }
}

// ---------- film compositing ----------
/**
 * Renders film time t. A film is { shots: [{ start, set, apply(t, camera, shot) -> lens, transition, subjects }] }.
 * Shots join with the style's 6-frame dissolve starting on the new shot's first word, with both shots still moving;
 * `transition: 'cut'` joins hard. Returns the current shot (its camera is the studio camera afterwards).
 */
export function renderFilm(studio, film, t, captions) {
  const shots = film.shots; let i = 0; for (let k = 0; k < shots.length; k++) if (t >= shots[k].start - 1e-6) i = k;
  const cur = shots[i], prev = shots[i - 1], D = (cur.transition ?? 'dissolve') === 'dissolve' ? 6 * F : 0;
  const ctx = studio.ctx; ctx.fillStyle = BRAND.anthracite; ctx.fillRect(0, 0, W, H);
  const frame = Math.round(t * FPS);
  if (prev && D > 0 && t < cur.start + D) { renderShot(studio, prev, t, 1, frame); renderShot(studio, cur, t, ease.inOut(clamp01((t - cur.start) / D)), frame); }
  else renderShot(studio, cur, t, 1, frame);
  if (captions) drawCaption(ctx, captions, t);
  if (film.title) drawTitle(ctx, film.title, t);
  return cur;
}
function renderShot(studio, shot, t, alpha, frame) {
  const set = shot.set; set.reset?.(t);
  const lens = shot.apply(t, studio.camera, shot) ?? {};
  // Painted faces on objects turn toward the camera so the expression always reads.
  for (const o of set.faceCamera ?? []) if (o.visible) { const c = studio.camera.position; o.lookAt(c.x, o.position.y + (c.y - o.position.y) * 0.35, c.z); }
  studio.camera.fov = lens.fov ?? 38; studio.camera.updateProjectionMatrix();
  studio.draw(set.scene, { ...(set.lens ?? {}), ...lens }, alpha, frame % 97);
}

/**
 * Framing check for the shot just rendered: where each named subject lands on screen (0..1, y down).
 * A subject is an Object3D or a function returning a world Vector3.
 */
export function framing(studio, shot) {
  const cam = studio.camera; cam.updateMatrixWorld(true);
  return (shot.subjects?.() ?? []).map(([name, s, radius = 0]) => {
    const p = typeof s === 'function' ? s() : s.getWorldPosition(new THREE.Vector3());
    const v = p.clone().applyMatrix4(cam.matrixWorldInverse), behind = v.z > 0, q = p.clone().project(cam);
    const x = (q.x + 1) / 2, y = (1 - q.y) / 2, ry = radius / (2 * Math.max(0.01, -v.z) * Math.tan(cam.fov * Math.PI / 360)), rx = ry * H / W;
    const problem = behind ? 'behind camera' : x - rx < 0.02 || x + rx > 0.98 || y - ry < 0.02 || y + ry > 0.99 ? 'cut by frame' : y > 0.645 && y < 0.77 ? 'in caption band' : null;
    return { name, x: +x.toFixed(3), y: +y.toFixed(3), problem };
  });
}

// ---------- captions: editorial lockups ----------
/** Caption fonts: the brand files when present, otherwise the named stand-ins (reported in filmInfo). */
export const CAPTION_FONT = { sans: '"Brand Sans"', serif: '"Brand Serif"' };
/** The highlight colour: Rouge Noir lifted to read on dark and bright scenes (same hue, 352°). */
export const HIGHLIGHT = '#E0394F';
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/**
 * Parses a lockup: rows split by " / "; *words* are Editorial New Italic highlights, plain words are Helvetica Bold
 * capitals, a leading ^ makes a token big.
 */
function parseLockup(display) {
  return display.split(' / ').map(row => [...row.matchAll(/\^?\*[^*]+\*|\S+/g)].map(m => {
    const raw = m[0], big = raw.startsWith('^'), serif = raw.includes('*'), text = raw.replace(/^\^/, '').replace(/\*/g, '');
    return { text: serif ? text : text.toUpperCase(), big, serif };
  }));
}
/**
 * Builds captions from a plan of lines matched against the spoken words. Each line is "spoken words" or
 * "spoken words => display lockup". Each token is revealed on the spoken word it names, or in order otherwise.
 */
export function planCaptions(words, lines) {
  const out = []; let w = 0;
  for (const line of lines) {
    const [src, disp] = line.split('=>').map(x => x?.trim());
    const n = src.split(/\s+/).filter(Boolean), got = words.slice(w, w + n.length);
    if (got.length !== n.length || got.some((g, i) => norm(g.text) !== norm(n[i]))) throw Error(`Caption "${src}" does not match spoken "${got.map(g => g.text).join(' ')}" at word ${w}`);
    const rows = parseLockup(disp ?? src), tokens = rows.flat();
    let p = 0;
    tokens.forEach((tok, k) => {
      const first = norm(tok.text.split(/\s+/)[0]), hit = got.findIndex((g, i) => i >= p && norm(g.text) === first);
      const prop = got[Math.min(got.length - 1, Math.floor(k * got.length / tokens.length))].start;
      if (hit >= 0) { tok.at = got[hit].start; p = hit + 1; } else tok.at = Math.max(k ? tokens[k - 1].at : got[0].start, prop);
    });
    out.push({ rows, start: got[0].start, end: got.at(-1).end }); w += n.length;
  }
  if (w !== words.length) throw Error(`Captions cover ${w} of ${words.length} words`);
  out.forEach((c, i) => { c.until = i + 1 < out.length ? out[i + 1].start : c.end + 0.6; });
  return out;
}
const tokenFont = (tok, s) => tok.serif ? `italic 400 ${s * (tok.big ? 1.62 : 1.3) * 1.16}px ${CAPTION_FONT.serif}` : `700 ${s * (tok.big ? 1.62 : 1)}px ${CAPTION_FONT.sans}`;
const tokenSize = (tok, s) => tok.serif ? s * (tok.big ? 1.62 : 1.3) * 1.16 : s * (tok.big ? 1.62 : 1);
/**
 * Draws the active caption as an editorial lockup centred at 70% height: Helvetica Bold capitals in White Sand,
 * Editorial New Italic highlights in the brand red tucked under them, mixed sizes, a soft shadow and no outline.
 * Each token pops in on its word.
 */
export function drawCaption(ctx, captions, t) {
  const c = captions.find(c => t >= c.start - 1e-3 && t < c.until); if (!c) return;
  const S0 = 92, gap = s => s * 0.26;
  const layout = S => c.rows.map(row => {
    let x = 0; const items = row.map((tok, i) => { ctx.font = tokenFont(tok, S); ctx.letterSpacing = tok.serif ? '0px' : `${-S * 0.025}px`; const w = ctx.measureText(tok.text).width; if (i) x += gap(S); const it = { tok, x, w, size: tokenSize(tok, S) }; x += w; return it; });
    return { items, width: x, size: Math.max(...items.map(i => i.size)), serif: row.every(r => r.serif) };
  });
  let S = S0, rows = layout(S);
  const maxW = () => Math.max(...rows.map(r => r.width));
  if (maxW() > W * 0.88) { S *= W * 0.88 / maxW(); rows = layout(S); }
  // Baselines: each row tucks under the previous one so the serif overlaps the capitals slightly.
  let y = 0; const base = rows.map((r, i) => { if (i) y += r.serif ? r.size * 0.66 : r.size * 0.86; return y; });
  const top = -rows[0].size * 0.74, bottom = base.at(-1) + rows.at(-1).size * 0.2, y0 = H * 0.70 - (top + bottom) / 2;
  const stagger = rows.length > 1 ? W * 0.035 : 0;
  ctx.save(); ctx.textBaseline = 'alphabetic';
  rows.forEach((r, ri) => {
    const x0 = Math.min(W * 0.95 - r.width, Math.max(W * 0.05, W / 2 - r.width / 2 + (ri === 0 ? -stagger : stagger)));
    for (const it of r.items) {
      const k = clamp01((t - it.tok.at) / (4 * F)); if (k <= 0) continue;
      const pop = 0.82 + 0.18 * ease.back(k), cx = x0 + it.x + it.w / 2, by = y0 + base[ri];
      ctx.save(); ctx.translate(cx, by - it.size * 0.3); ctx.scale(pop, pop); ctx.translate(-cx, -(by - it.size * 0.3));
      ctx.globalAlpha = clamp01(k * 2); ctx.font = tokenFont(it.tok, S); ctx.letterSpacing = it.tok.serif ? '0px' : `${-S * 0.025}px`;
      // Two shadow passes: a wide soft dark bloom for separation, then a tight one for edge definition.
      ctx.fillStyle = it.tok.serif ? HIGHLIGHT : BRAND.whiteSand;
      ctx.shadowColor = 'rgba(8,4,6,0.7)'; ctx.shadowBlur = it.size * 0.42; ctx.shadowOffsetY = it.size * 0.04; ctx.fillText(it.tok.text, x0 + it.x, by);
      ctx.shadowColor = 'rgba(8,4,6,0.55)'; ctx.shadowBlur = it.size * 0.08; ctx.shadowOffsetY = it.size * 0.02; ctx.fillText(it.tok.text, x0 + it.x, by);
      ctx.restore();
    }
  });
  ctx.restore();
}

/**
 * The topic hook: a short question at the top of the frame for the first seconds (Instagram's "what is this about"),
 * e.g. { text: 'How was *gravity* found?', start: 0, end: 2.9 }. The *word* is Editorial New Italic on a brand box.
 * It is on screen from its first frame (so it is in the cover frame) and fades out over 8 frames.
 */
export function drawTitle(ctx, title, t) {
  if (t < title.start || t > title.end) return;
  const a = clamp01((title.end - t) / (8 * F)), S = 76;
  const parts = title.text.split(/(\*[^*]+\*)/).filter(Boolean).flatMap(p => p.startsWith('*') ? [{ t: p.slice(1, -1), em: true }] : p.split(' ').filter(Boolean).map(x => ({ t: x, em: false })));
  const font = p => p.em ? `italic 400 ${S * 1.32}px ${CAPTION_FONT.serif}` : `700 ${S}px ${CAPTION_FONT.sans}`, gap = S * 0.26, pad = S * 0.26;
  const widths = parts.map(p => { ctx.font = font(p); ctx.letterSpacing = p.em ? '0px' : `${-S * 0.02}px`; return ctx.measureText(p.t).width + (p.em ? 2 * pad : 0); });
  const total = widths.reduce((s, w, i) => s + w + (i ? (/^[?.!,:;]/.test(parts[i].t) ? S * 0.04 : gap) : 0), 0), y = H * 0.15 - (1 - a) * 14;
  let x = W / 2 - total / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle';
  parts.forEach((p, i) => {
    ctx.font = font(p); ctx.letterSpacing = p.em ? '0px' : `${-S * 0.02}px`;
    if (p.em) {
      const h = S * 1.42, r = h * 0.22; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
      ctx.fillStyle = BRAND.rougeNoir; ctx.beginPath(); ctx.roundRect(x, y - h / 2, widths[i], h, r); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.fillStyle = BRAND.whiteSand; ctx.fillText(p.t, x + pad, y + S * 0.06);
    } else {
      ctx.shadowColor = 'rgba(12,6,8,0.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3; ctx.fillStyle = BRAND.whiteSand; ctx.fillText(p.t, x, y);
    }
    x += widths[i] + (/^[?.!,:;]/.test(parts[i + 1]?.t ?? '') ? S * 0.04 : gap);
  });
  ctx.restore();
}

/** Fallback when a film has no caption plan: 1–3 word lockups, breaking after punctuation. */
export function captionChunks(words) {
  const lines = []; let cur = [];
  const flush = () => { if (cur.length) lines.push(cur.map(w => w.text).join(' ')); cur = []; };
  for (const w of words) { cur.push(w); if (/[.,?!:;…]$/.test(w.text) || cur.length >= 3) flush(); }
  flush(); return planCaptions(words, lines);
}
