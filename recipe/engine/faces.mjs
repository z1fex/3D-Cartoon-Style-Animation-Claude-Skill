// Painted faces: brows, eyes and mouth only (no nose), drawn as flat line art on a decal patch over the front of a head.
// One family of shapes for every character and object. Faces swap through a blink and never morph.
import { THREE, BRAND, toon } from './core.mjs';

// The decal covers this part of a sphere (radians). Front (+z) is phi = PI/2.
export const PATCH = { phiStart: Math.PI / 2 - 1.1, phiLength: 2.2, thetaStart: 0.5, thetaLength: 1.7 };
const CW = 1024, CH = Math.round(CW * PATCH.thetaLength / PATCH.phiLength);
const PXD = CW / (PATCH.phiLength * 180 / Math.PI); // canvas pixels per degree
/** Canvas point for an angle on the head: az = degrees toward screen right, el = degrees up from the equator. */
const P = (az, el) => [((Math.PI / 2 + az * Math.PI / 180) - PATCH.phiStart) / PATCH.phiLength * CW, ((Math.PI / 2 - el * Math.PI / 180) - PATCH.thetaStart) / PATCH.thetaLength * CH];

/**
 * Expression presets. brows: [inner, outer] heights in degrees (left/right mirrored unless browsR given);
 * lid: 0 open … 1 closed; look: pupil offset [-1..1, -1..1]; mouth: shape name.
 */
export const EXPRESSIONS = {
  neutral: { brows: [0, 0], lid: 0.1, mouth: 'flat' },
  content: { brows: [1, 0], lid: 0.42, look: [0, -0.55], mouth: 'smile' },
  sleepy: { brows: [-1, -1], lid: 0.62, mouth: 'flat' },
  surprised: { brows: [6, 5], lid: 0, eye: 1.12, pupil: 0.72, mouth: 'o' },
  shocked: { brows: [7, 6], lid: 0, eye: 1.18, pupil: 0.55, mouth: 'shout' },
  curious: { brows: [0, 0], browsR: [5, 4], lid: 0.12, look: [0.55, 0.25], mouth: 'smirk' },
  thinking: { brows: [-2, 1], browsR: [3, 3], lid: 0.25, look: [-0.5, 0.6], mouth: 'side' },
  eureka: { brows: [6, 4], lid: 0, eye: 1.08, look: [0, 0.3], mouth: 'grin' },
  delighted: { brows: [4, 3], happy: true, mouth: 'grin' },
  smug: { brows: [-1, 1], browsR: [4, 5], lid: 0.45, look: [0.35, 0], mouth: 'smirk' },
  knowing: { brows: [2, 4], browsR: [-2, 0], lid: 0.38, look: [0, 0], mouth: 'smirk' },
  confused: { brows: [4, 1], browsR: [-2, -3], lid: 0.12, look: [-0.4, 0.2], mouth: 'wavy' },
  worried: { brows: [5, -2], lid: 0.05, pupil: 0.8, mouth: 'wavy', sweat: true },
  proud: { brows: [3, 2], happy: true, mouth: 'smile', blush: true },
  no: { brows: [-3, 2], lid: 0.3, look: [0, 0], mouth: 'flat' },
  wheee: { brows: [6, 5], lid: 0, eye: 1.1, pupil: 0.75, mouth: 'grin' },
  dizzy: { brows: [2, 0], spiral: true, mouth: 'wavy' },
  lookDown: { brows: [0, 0], lid: 0.2, look: [-0.45, -0.75], mouth: 'flat' },
};

function stroke(g, w, color = BRAND.anthracite) { g.lineWidth = w; g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }

function drawEye(g, e, side, skin) {
  const s = e.eye ?? 1, r = 10.5 * s * PXD, ry = 12 * s * PXD, [cx, cy] = P(side * 15.5, 6);
  if (e.happy) { // closed happy arc
    g.beginPath(); g.arc(cx, cy + ry * 0.35, r * 0.9, Math.PI * 1.12, Math.PI * 1.88); stroke(g, 2.6 * PXD); return;
  }
  if (e.spiral) { g.beginPath(); for (let a = 0; a < 14; a += 0.2) { const rr = a / 14 * r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } stroke(g, 1.6 * PXD); return; }
  g.save(); g.beginPath(); g.ellipse(cx, cy, r, ry, 0, 0, Math.PI * 2); g.fillStyle = '#f1ece3'; g.fill(); g.clip();
  const [lx, ly] = e.look ?? [0, 0], pr = 4.6 * (e.pupil ?? 1) * PXD;
  const px = cx + lx * (r - pr * 1.2), py = cy - ly * (ry - pr * 1.2);
  g.beginPath(); g.arc(px, py, pr, 0, Math.PI * 2); g.fillStyle = '#2a2a30'; g.fill();
  g.beginPath(); g.arc(px - pr * 0.38, py - pr * 0.4, pr * 0.3, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill();
  const lid = e.lid ?? 0;
  if (lid > 0.01) { // upper lid in skin colour, with its line
    const y = cy - ry + 2 * ry * lid;
    g.beginPath(); g.rect(cx - r * 1.2, cy - ry * 1.3, r * 2.4, y - (cy - ry * 1.3)); g.fillStyle = skin; g.fill();
    g.restore(); g.save(); g.beginPath(); g.ellipse(cx, cy, r, ry, 0, 0, Math.PI * 2); g.clip();
    g.beginPath(); g.moveTo(cx - r * 1.1, y); g.lineTo(cx + r * 1.1, y); stroke(g, 2.4 * PXD);
  }
  g.restore();
  g.beginPath(); g.ellipse(cx, cy, r, ry, 0, 0, Math.PI * 2); stroke(g, 1.5 * PXD);
}

function drawBrow(g, side, [inner, outer], color, thick) {
  const [ix, iy] = P(side * 7, 22 + inner), [ox, oy] = P(side * 25, 21 + outer), [mx, my] = P(side * 16, 23.5 + (inner + outer) / 2);
  g.beginPath(); g.moveTo(ix, iy); g.quadraticCurveTo(mx, my, ox, oy); stroke(g, (thick ?? 3.4) * PXD, color);
}

function drawMouth(g, kind, e) {
  const [cx, cy] = P(0, -17), w = 11 * PXD, lw = 2.2 * PXD;
  g.beginPath();
  switch (kind) {
    case 'flat': g.moveTo(cx - w * 0.55, cy); g.lineTo(cx + w * 0.55, cy); stroke(g, lw); break;
    case 'smile': g.moveTo(cx - w * 0.8, cy - 2 * PXD); g.quadraticCurveTo(cx, cy + 6 * PXD, cx + w * 0.8, cy - 2 * PXD); stroke(g, lw); break;
    case 'smirk': g.moveTo(cx - w * 0.6, cy + 0.5 * PXD); g.quadraticCurveTo(cx + w * 0.2, cy + 3 * PXD, cx + w * 0.8, cy - 3 * PXD); stroke(g, lw); break;
    case 'side': g.moveTo(cx - w * 0.9, cy - 1 * PXD); g.lineTo(cx - w * 0.1, cy + 1 * PXD); stroke(g, lw); break;
    case 'wavy': for (let i = 0; i <= 20; i++) { const x = cx - w * 0.8 + i / 20 * w * 1.6, y = cy + Math.sin(i / 20 * Math.PI * 3) * 1.6 * PXD; i ? g.lineTo(x, y) : g.moveTo(x, y); } stroke(g, lw); break;
    case 'o': g.ellipse(cx, cy + 1 * PXD, w * 0.32, w * 0.42, 0, 0, Math.PI * 2); g.fillStyle = '#4a1418'; g.fill(); stroke(g, lw); break;
    case 'grin': case 'shout': {
      const h = kind === 'shout' ? 10 * PXD : 7.5 * PXD;
      g.moveTo(cx - w, cy - 2 * PXD); g.quadraticCurveTo(cx, cy - 4 * PXD, cx + w, cy - 2 * PXD); g.quadraticCurveTo(cx + w * 0.7, cy + h * 1.25, cx, cy + h * 1.3); g.quadraticCurveTo(cx - w * 0.7, cy + h * 1.25, cx - w, cy - 2 * PXD);
      g.closePath(); g.fillStyle = '#4a1418'; g.fill();
      g.save(); g.clip(); g.fillStyle = '#ffffff'; g.fillRect(cx - w, cy - 6 * PXD, w * 2, 5.6 * PXD);
      g.beginPath(); g.ellipse(cx, cy + h * 1.35, w * 0.55, h * 0.55, 0, 0, Math.PI * 2); g.fillStyle = '#c4545a'; g.fill(); g.restore();
      g.beginPath(); g.moveTo(cx - w, cy - 2 * PXD); g.quadraticCurveTo(cx, cy - 4 * PXD, cx + w, cy - 2 * PXD); g.quadraticCurveTo(cx + w * 0.7, cy + h * 1.25, cx, cy + h * 1.3); g.quadraticCurveTo(cx - w * 0.7, cy + h * 1.25, cx - w, cy - 2 * PXD); stroke(g, lw); break;
    }
  }
}

/** Draws one face onto a transparent canvas patch. `lid` overrides the expression's lid (used for the blink swap). */
export function drawFace(g, e, { skin = '#f1c6a6', browColor = BRAND.anthracite, browThick, mustache = null, lid = null } = {}) {
  g.clearRect(0, 0, CW, CH);
  const ee = lid == null ? e : { ...e, lid: Math.max(e.lid ?? 0, lid), happy: lid >= 0.95 ? false : e.happy, spiral: lid >= 0.5 ? false : e.spiral };
  if (e.blush) for (const s of [-1, 1]) { const [x, y] = P(s * 22, -6); g.beginPath(); g.ellipse(x, y, 6 * PXD, 3.4 * PXD, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(222,110,110,0.45)'; g.fill(); }
  for (const s of [-1, 1]) drawEye(g, ee, s, skin);
  drawBrow(g, -1, e.brows, browColor, browThick); drawBrow(g, 1, e.browsR ?? e.brows, browColor, browThick);
  if (mustache) {
    const [cx, cy] = P(0, -9);
    g.beginPath(); g.moveTo(cx, cy - 1.5 * PXD);
    g.bezierCurveTo(cx + 6 * PXD, cy - 4 * PXD, cx + 14 * PXD, cy - 1 * PXD, cx + 15 * PXD, cy + 4 * PXD);
    g.bezierCurveTo(cx + 9 * PXD, cy + 3 * PXD, cx + 4 * PXD, cy + 4 * PXD, cx, cy + 2.4 * PXD);
    g.bezierCurveTo(cx - 4 * PXD, cy + 4 * PXD, cx - 9 * PXD, cy + 3 * PXD, cx - 15 * PXD, cy + 4 * PXD);
    g.bezierCurveTo(cx - 14 * PXD, cy - 1 * PXD, cx - 6 * PXD, cy - 4 * PXD, cx, cy - 1.5 * PXD);
    g.fillStyle = mustache; g.fill(); stroke(g, 1.2 * PXD, '#8f8a84');
  }
  drawMouth(g, e.mouth, e);
  if (e.sweat) { const [x, y] = P(30, 18); g.beginPath(); g.moveTo(x, y - 7 * PXD); g.quadraticCurveTo(x + 4.5 * PXD, y, x, y + 3 * PXD); g.quadraticCurveTo(x - 4.5 * PXD, y, x, y - 7 * PXD); g.fillStyle = '#9fd2e6'; g.fill(); stroke(g, 1 * PXD, '#3c6e80'); }
}

/**
 * A face decal for a head of radius r. Textures are cached per expression and blink state, so a swap costs nothing.
 * Returns { mesh, set(name, blink) } where blink is 0 (open), 0.5 (half-closed frame) or 1 (closed frame).
 */
export function faceDecal(r, style = {}) {
  const geo = new THREE.SphereGeometry(r * 1.004, 64, 48, PATCH.phiStart, PATCH.phiLength, PATCH.thetaStart, PATCH.thetaLength);
  const cache = new Map();
  const tex = key => {
    if (cache.has(key)) return cache.get(key);
    const [name, blink] = key.split('|'), c = document.createElement('canvas'); c.width = CW; c.height = CH;
    drawFace(c.getContext('2d'), EXPRESSIONS[name], { ...style, lid: +blink ? (+blink >= 1 ? 1 : 0.62) : null });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(key, t); return t;
  };
  const mat = toon('#ffffff', { map: tex('neutral|0'), transparent: true, alphaTest: 0.04, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.04 });
  mat.emissiveMap = mat.map;
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = false; mesh.receiveShadow = true;
  let current = '';
  return { mesh, set(name, blink = 0) { const key = `${name}|${blink}`; if (key === current) return; if (!EXPRESSIONS[name]) throw Error('Unknown face ' + name); current = key; mat.map = mat.emissiveMap = tex(key); mat.needsUpdate = true; } };
}

/**
 * The face at time t from a list of [time, expression] swaps. Each swap goes through a blink:
 * a half-closed frame, a closed frame, then the new face (times are when the new face appears).
 * Optional natural blinks during long holds: `blinks` is a list of times.
 */
export function faceAt(t, swaps, blinks = [], F = 1 / 30) {
  let name = swaps[0][1], blink = 0;
  for (const [at, expr] of swaps) {
    if (t >= at) name = expr;
    else if (t >= at - F) { blink = 1; break; }
    else if (t >= at - 2 * F) { blink = 0.5; break; }
  }
  if (!blink) for (const b of blinks) { if (t >= b && t < b + F) blink = 0.5; else if (t >= b + F && t < b + 2 * F) blink = 1; else if (t >= b + 2 * F && t < b + 3 * F) blink = 0.5; }
  return [name, blink];
}
