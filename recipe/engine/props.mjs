// Props made in code. Every prop is original; "facts are objects" devices (calendar, flip counter, LED panel,
// signpost) expose a set(...) so a number or word lands on its exact frame.
import { THREE, BRAND, ENV, toon, glow, part, ink, tint, canvasTexture, rand } from './core.mjs';
import { faceDecal } from './faces.mjs';

// ---------- environment ----------
export function skyDome(top, horizon, bottom, radius = 180) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, horizon: { value: new THREE.Color(horizon) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top, horizon, bottom; varying vec3 vDir; void main(){ float y = vDir.y; vec3 c = y > 0.0 ? mix(horizon, top, pow(clamp(y * 1.6, 0.0, 1.0), 0.7)) : mix(horizon, bottom, clamp(-y * 6.0, 0.0, 1.0)); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}',
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), m);
}
export function ground(color, radius = 60) { const g = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), toon(color)); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; return g; }
/** Grass tufts and small flowers scattered over an area, avoiding a clear zone. */
export function meadow({ seed = 1, count = 1600, radius = 14, clear = [] } = {}) {
  const grp = new THREE.Group(), dummy = new THREE.Object3D();
  const tuft = new THREE.InstancedMesh(new THREE.ConeGeometry(0.028, 0.26, 4), toon(ENV.grassDark), count);
  let n = 0;
  for (let i = 0; i < count * 3 && n < count; i++) {
    const a = rand(seed + i * 2) * Math.PI * 2, r = Math.sqrt(rand(seed + i * 2 + 1)) * radius, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (clear.some(([cx, cz, cr]) => (x - cx) ** 2 + (z - cz) ** 2 < cr * cr)) continue;
    dummy.position.set(x, 0.09, z); dummy.rotation.set((rand(i + 7) - 0.5) * 0.5, rand(i + 9) * 6, (rand(i + 11) - 0.5) * 0.5); const s = 0.7 + rand(i + 13) * 0.8; dummy.scale.set(s, s, s); dummy.updateMatrix(); tuft.setMatrixAt(n++, dummy.matrix);
  }
  tuft.count = n; tuft.castShadow = true; tuft.receiveShadow = true; grp.add(tuft);
  return grp;
}
export function stars(count = 700, radius = 120, seed = 3) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { const u = rand(seed + i) * 2 - 1, a = rand(seed + i * 3) * Math.PI * 2, s = Math.sqrt(1 - u * u); pos.set([Math.cos(a) * s * radius, u * radius, Math.sin(a) * s * radius], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(BRAND.whiteSand).multiplyScalar(1.6), size: 2.2, sizeAttenuation: false, fog: false }));
}

// ---------- orchard ----------
/** An apple: a slightly squashed sphere with stem and leaf; optionally a painted face. */
export function apple(r = 0.14, { face = false, color = BRAND.rougeNoir } = {}) {
  const g = new THREE.Group();
  const body = part(new THREE.SphereGeometry(r, 28, 20), tint(color, 0.18, '#d0283a'), { px: 2 }); body.scale.set(1, 0.92, 1); g.add(body);
  const stem = part(new THREE.CylinderGeometry(r * 0.06, r * 0.08, r * 0.45, 6), BRAND.cognac, { px: 1.2 }); stem.position.y = r * 1.05; stem.rotation.z = 0.25; g.add(stem);
  const leaf = part(new THREE.SphereGeometry(r * 0.3, 12, 8), ENV.leaf, { px: 1.4 }); leaf.scale.set(1.25, 0.3, 0.62); leaf.position.set(r * 0.32, r * 1.18, 0); leaf.rotation.z = -0.62; g.add(leaf);
  let decal = null;
  if (face) { decal = faceDecal(r, { skin: '#c43a48', browThick: 3.8 }); decal.mesh.scale.set(1, 0.92, 1); g.add(decal.mesh); }
  return { group: g, face: decal, radius: r };
}
/** An apple tree with a thick trunk, low branches, round foliage clumps and hanging apples. */
export function appleTree({ seed = 11, height = 3.4 } = {}) {
  const g = new THREE.Group(), bark = tint(BRAND.cognac, 0.12, BRAND.anthracite);
  const trunk = part(new THREE.CylinderGeometry(0.26, 0.42, height, 14), bark, { px: 3 }); trunk.position.y = height / 2; g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const b = part(new THREE.CylinderGeometry(0.08, 0.16, 1.6, 8), bark, { px: 2.4 }); const a = i * 2.2 + 0.4;
    b.position.set(Math.cos(a) * 0.5, height - 0.35, Math.sin(a) * 0.5); b.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(b);
  }
  const leaves = [ENV.leaf, ENV.leafLight, ENV.leafDark];
  const clumps = [];
  for (let i = 0; i < 11; i++) {
    const a = rand(seed + i) * Math.PI * 2, r = 0.4 + rand(seed + i * 3) * 1.5, y = height + 0.3 + rand(seed + i * 5) * 1.3 - r * 0.25;
    const s = 0.85 + rand(seed + i * 7) * 0.55, c = part(new THREE.IcosahedronGeometry(s, 2), leaves[i % 3], { px: 3 });
    c.position.set(Math.cos(a) * r, y, Math.sin(a) * r * 0.9); c.scale.set(1, 0.82, 1); g.add(c); clumps.push(c);
  }
  const apples = [];
  for (let i = 0; i < 14; i++) {
    const c = clumps[i % clumps.length], a = rand(seed * 3 + i) * Math.PI * 2, el = -0.2 - rand(seed * 5 + i) * 0.9;
    const p = c.position.clone().add(new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).multiplyScalar(0.92 * c.scale.x));
    const ap = apple(0.12); ap.group.position.copy(p); g.add(ap.group); apples.push(ap);
  }
  return { group: g, height };
}
export function fence({ length = 12, color = BRAND.cognac } = {}) {
  const g = new THREE.Group();
  for (let x = -length / 2; x <= length / 2 + 1e-6; x += 1.5) { const p = part(new THREE.BoxGeometry(0.12, 1.1, 0.12), color, { px: 1.6 }); p.position.set(x, 0.55, 0); g.add(p); }
  for (const y of [0.4, 0.85]) { const r = part(new THREE.BoxGeometry(length + 0.3, 0.09, 0.06), tint(color, 0.08), { px: 1.6 }); r.position.set(0, y, 0); g.add(r); }
  return g;
}
/** A small stone manor house in brand colours with warm lit windows. */
export function manor() {
  const g = new THREE.Group();
  const walls = part(new THREE.BoxGeometry(6, 3.2, 3.4), BRAND.whiteSand, { px: 2.4 }); walls.position.y = 1.6; g.add(walls);
  const roof = part(new THREE.CylinderGeometry(0.1, 2.5, 6.6, 4, 1), BRAND.rougeNoir, { px: 2.4 }); roof.rotation.set(0, Math.PI / 4, Math.PI / 2); roof.scale.set(1, 1, 0.75); roof.position.y = 3.95; g.add(roof);
  const chimney = part(new THREE.BoxGeometry(0.5, 1.2, 0.5), tint(BRAND.whiteSand, 0.2, BRAND.cognac), { px: 2 }); chimney.position.set(1.8, 4.5, 0); g.add(chimney);
  for (const [x, y] of [[-1.8, 1.1], [0, 1.1], [1.8, 1.1], [-1.8, 2.4], [0, 2.4], [1.8, 2.4]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.86), glow('#ffcf8a', 1.4)); w.position.set(x, y, 1.705); g.add(w);
    const frame = part(new THREE.BoxGeometry(0.76, 1.0, 0.05), BRAND.anthracite, { px: 0, cast: false }); frame.position.set(x, y, 1.69); g.add(frame);
  }
  const door = part(new THREE.BoxGeometry(0.8, 1.5, 0.08), BRAND.blueCoral, { px: 1.6 }); door.position.set(0.95, 0.75, 1.7); g.add(door);
  return g;
}

// ---------- in-world information devices ----------
export function labelTexture(text, { w = 512, h = 256, bg = BRAND.whiteSand, fg = BRAND.anthracite, font = 'Titan One', size = 150, border = null } = {}) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.strokeStyle = border; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let s = size; g.font = `${s}px "${font}"`;
    while (g.measureText(text).width > w * 0.86) { s -= 6; g.font = `${s}px "${font}"`; } g.fillText(text, w / 2, h / 2 + s * 0.04);
  });
}
/** A wall or post calendar whose top page flips up on its hinge. set(before, after, k) with k 0..1. */
export function calendar({ w = 0.9, h = 1.05, header = 'YEAR', color = BRAND.rougeNoir } = {}) {
  const g = new THREE.Group(), cache = new Map();
  const pageTex = text => { if (!cache.has(text)) cache.set(text, labelTexture(text, { w: 512, h: 512, size: 190 })); return cache.get(text); };
  const back = part(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.06), tint(BRAND.cognac, 0.0), { px: 2 }); back.position.z = -0.04; g.add(back);
  const top = part(new THREE.BoxGeometry(w + 0.08, 0.26, 0.09), color, { px: 2 }); top.position.y = h / 2 - 0.02; g.add(top);
  const headTex = labelTexture(header, { w: 512, h: 128, bg: '#00000000', fg: BRAND.whiteSand, size: 90 });
  const head = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, 0.2), new THREE.MeshBasicMaterial({ map: headTex, transparent: true })); head.position.set(0, h / 2 - 0.02, 0.05); g.add(head);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(w, h - 0.28), toon('#ffffff', { map: pageTex('') })); under.position.set(0, -0.14, 0.005); g.add(under);
  const hinge = new THREE.Group(); hinge.position.set(0, h / 2 - 0.28, 0.012); g.add(hinge);
  const flip = new THREE.Mesh(new THREE.PlaneGeometry(w, h - 0.28), toon('#ffffff', { map: pageTex('') })); flip.position.y = -(h - 0.28) / 2; hinge.add(flip);
  const flipBack = new THREE.Mesh(new THREE.PlaneGeometry(w, h - 0.28), toon(tint(BRAND.whiteSand, 0.12, '#c9c1b4'))); flipBack.rotation.y = Math.PI; flipBack.position.set(0, -(h - 0.28) / 2, -0.001); hinge.add(flipBack);
  for (const s of [-1, 1]) { const ring = part(new THREE.TorusGeometry(0.05, 0.014, 6, 14), '#c9c4bc', { px: 1 }); ring.position.set(s * w * 0.3, h / 2 - 0.15, 0.06); g.add(ring); }
  return { group: g, set(before, after, k) { under.material.map = pageTex(after); flip.material.map = pageTex(before); under.material.needsUpdate = flip.material.needsUpdate = true; hinge.rotation.x = -Math.PI * 0.94 * k; flip.visible = flipBack.visible = k < 0.999; } };
}
/** A split-flap style counter on a wooden stand. set(text) shows exactly the given characters. */
export function flipCounter({ cells = 2, w = 0.34, h = 0.48, label = null } = {}) {
  const g = new THREE.Group(), digitTex = new Map();
  const tex = ch => { if (!digitTex.has(ch)) digitTex.set(ch, labelTexture(ch, { w: 256, h: 360, bg: BRAND.anthracite, fg: BRAND.whiteSand, size: 300 })); return digitTex.get(ch); };
  const frame = part(new THREE.BoxGeometry(cells * (w + 0.05) + 0.14, h + 0.16, 0.18), BRAND.cognac, { px: 2.2 }); g.add(frame);
  const faces = [];
  for (let i = 0; i < cells; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', { map: tex('0'), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.25 })); m.material.emissiveMap = m.material.map;
    m.position.set((i - (cells - 1) / 2) * (w + 0.05), 0, 0.095); g.add(m); faces.push(m);
    const split = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.012), new THREE.MeshBasicMaterial({ color: '#000000' })); split.position.set(m.position.x, 0, 0.097); g.add(split);
  }
  if (label) { const l = new THREE.Mesh(new THREE.PlaneGeometry(cells * (w + 0.05), 0.16), new THREE.MeshBasicMaterial({ map: labelTexture(label, { w: 512, h: 128, bg: BRAND.rougeNoir, fg: BRAND.whiteSand, size: 80 }) })); l.position.set(0, -h / 2 - 0.16, 0.06); g.add(l); const lb = part(new THREE.BoxGeometry(cells * (w + 0.05) + 0.06, 0.2, 0.1), BRAND.rougeNoir, { px: 1.6 }); lb.position.set(0, -h / 2 - 0.16, 0); g.add(lb); }
  return { group: g, set(text) { const s = String(text).padStart(cells, ' ').slice(-cells); s.split('').forEach((ch, i) => { const t = tex(ch); if (faces[i].material.map !== t) { faces[i].material.map = faces[i].material.emissiveMap = t; faces[i].material.needsUpdate = true; } }); } };
}
/** A wooden signpost with arrow boards; light(i, k) makes board i glow. */
export function signpost(labels) {
  const g = new THREE.Group();
  const post = part(new THREE.CylinderGeometry(0.07, 0.08, 2.6, 8), BRAND.cognac, { px: 2.2 }); post.position.y = 1.3; g.add(post);
  const boards = labels.map(([text, angle, y], i) => {
    const pivot = new THREE.Group(); pivot.position.y = y; pivot.rotation.z = angle; g.add(pivot);
    const shape = new THREE.Shape(); shape.moveTo(0, -0.17); shape.lineTo(0.95, -0.17); shape.lineTo(1.18, 0); shape.lineTo(0.95, 0.17); shape.lineTo(0, 0.17); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false }); geo.translate(0.02, 0, -0.035);
    const mat = toon(tint(BRAND.cognac, 0.25), { emissive: new THREE.Color('#ffb562'), emissiveIntensity: 0 });
    const board = part(geo, mat, { px: 2 }); pivot.add(board);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.24), new THREE.MeshBasicMaterial({ map: labelTexture(text, { w: 512, h: 144, bg: '#00000000', fg: BRAND.whiteSand, size: 104 }), transparent: true })); lab.position.set(0.52, 0, 0.04); pivot.add(lab);
    return { pivot, mat };
  });
  return { group: g, boards, light(i, k) { boards[i].mat.emissiveIntensity = 0.5 * k; } };
}
/** A dark panel with amber LED text that can roll up to a value. */
export function ledPanel({ w = 2.6, h = 0.7, cells = 10, color = '#ffb347' } = {}) {
  const g = new THREE.Group(), cache = new Map();
  const tex = text => { if (cache.has(text)) return cache.get(text); const t = canvasTexture(1024, 256, (c) => { c.fillStyle = '#120c0b'; c.fillRect(0, 0, 1024, 256); c.font = '180px "Titan One"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#3a2412'; c.fillText('8'.repeat(cells).slice(0, text.length), 512, 136); c.shadowColor = color; c.shadowBlur = 12; c.fillStyle = color; c.fillText(text, 512, 136); }); cache.set(text, t); return t; };
  const box = part(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.16), BRAND.anthracite, { px: 2.2 }); g.add(box);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(''), color: new THREE.Color('#ffffff').multiplyScalar(1.15) })); screen.position.z = 0.085; g.add(screen);
  return { group: g, set(text) { const t = tex(text); if (screen.material.map !== t) { screen.material.map = t; screen.material.needsUpdate = true; } } };
}
/** A glowing string between two points (the "pull"). set(a, b, thickness). */
export function glowString(color = '#ffe1a6') {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12, 1, true), glow(color, 1.9)); m.visible = false; const up = new THREE.Vector3(0, 1, 0);
  return { mesh: m, set(a, b, r = 0.03) { const d = b.clone().sub(a), len = d.length(); m.visible = len > 1e-3; m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(r, len, r); m.quaternion.setFromUnitVectors(up, d.normalize()); } };
}

// ---------- space ----------
// Simplified continent outlines as [longitude, latitude] (coarse, for a cartoon globe).
const CONTINENTS = [
  [[-168, 66], [-156, 71], [-130, 70], [-110, 73], [-95, 72], [-80, 73], [-68, 63], [-62, 58], [-55, 52], [-66, 45], [-70, 42], [-75, 38], [-81, 31], [-80, 26], [-82, 25], [-84, 30], [-90, 29], [-97, 27], [-97, 21], [-91, 19], [-87, 21], [-88, 15], [-83, 10], [-78, 8], [-82, 8], [-86, 12], [-92, 15], [-105, 20], [-110, 24], [-112, 29], [-117, 32], [-121, 36], [-124, 41], [-124, 48], [-130, 54], [-137, 58], [-150, 60], [-160, 58], [-166, 61]],
  [[-78, 8], [-72, 12], [-62, 10], [-52, 4], [-50, 0], [-44, -3], [-35, -7], [-38, -14], [-40, -22], [-48, -28], [-53, -34], [-58, -38], [-63, -40], [-65, -45], [-68, -52], [-71, -54], [-74, -50], [-73, -42], [-72, -33], [-71, -24], [-70, -18], [-76, -14], [-81, -6], [-80, -2], [-78, 2]],
  [[-17, 21], [-16, 28], [-10, 30], [-6, 36], [10, 37], [11, 33], [20, 32], [25, 31], [32, 31], [34, 28], [38, 18], [43, 12], [51, 12], [48, 5], [40, -2], [40, -10], [41, -15], [35, -24], [33, -28], [27, -34], [20, -35], [18, -32], [15, -27], [12, -18], [13, -11], [12, -5], [9, -1], [9, 4], [4, 6], [-4, 5], [-8, 4], [-13, 8], [-15, 11], [-17, 15]],
  [[-10, 36], [-9, 43], [-2, 44], [-1, 48], [-5, 48], [2, 51], [8, 54], [5, 58], [5, 62], [12, 66], [18, 70], [28, 71], [40, 67], [45, 68], [60, 69], [70, 73], [80, 73], [100, 76], [110, 74], [130, 71], [140, 72], [160, 70], [170, 67], [180, 66], [180, 62], [165, 60], [160, 54], [155, 58], [143, 52], [140, 46], [135, 43], [130, 42], [127, 39], [126, 35], [122, 31], [121, 28], [118, 24], [111, 21], [108, 18], [109, 12], [105, 9], [103, 1], [100, 3], [98, 8], [98, 16], [94, 17], [92, 22], [87, 21], [80, 15], [78, 8], [73, 17], [72, 21], [67, 25], [62, 25], [57, 26], [56, 24], [58, 21], [52, 16], [45, 13], [43, 17], [39, 22], [35, 28], [33, 31], [36, 36], [30, 36], [27, 37], [26, 40], [23, 38], [21, 37], [19, 40], [16, 38], [12, 44], [9, 44], [3, 43], [-1, 37], [-6, 36]],
  [[114, -22], [116, -20], [122, -18], [126, -14], [130, -12], [133, -11], [137, -12], [136, -15], [140, -17], [142, -11], [144, -14], [146, -19], [150, -22], [153, -26], [153, -31], [150, -37], [146, -39], [141, -38], [138, -35], [136, -35], [131, -31], [124, -33], [118, -35], [115, -33], [114, -28]],
  [[-73, 78], [-60, 82], [-30, 83], [-18, 77], [-22, 70], [-32, 68], [-42, 62], [-50, 62], [-54, 67], [-57, 74], [-68, 76]],
  [[95, 6], [100, 0], [105, -6], [114, -8], [120, -9], [118, -3], [117, 2], [110, 2], [105, 2]],
  [[131, -2], [138, -3], [145, -6], [150, -10], [142, -9], [136, -6]],
  [[44, -13], [50, -15], [49, -25], [44, -24]],
  [[-5, 50], [1, 51], [0, 54], [-3, 58], [-6, 56], [-5, 53]],
  [[130, 31], [134, 34], [140, 36], [142, 40], [141, 43], [139, 40], [136, 35], [131, 33]],
  [[166, -46], [172, -41], [178, -38], [175, -41], [170, -45]],
];
const DESERTS = [[[10, 24], 32, 9], [[45, 23], 9, 6], [[133, -25], 12, 7], [[-112, 33], 6, 5], [[-68, -24], 4, 9], [[64, 40], 10, 5], [[105, 42], 14, 4]];
/** A cartoon Earth: blue oceans, green continents with desert patches, ice caps, a cloud shell and an atmosphere halo. */
export function earth(r = 2) {
  const g = new THREE.Group();
  const P = (lon, lat, w, h) => [(lon + 180) / 360 * w, (90 - lat) / 180 * h];
  const tex = canvasTexture(2048, 1024, (c, w, h) => {
    const sea = c.createLinearGradient(0, 0, 0, h); sea.addColorStop(0, '#2f73b4'); sea.addColorStop(0.5, '#3b8bd0'); sea.addColorStop(1, '#2f73b4');
    c.fillStyle = sea; c.fillRect(0, 0, w, h);
    c.lineJoin = 'round';
    for (const poly of CONTINENTS) {
      c.beginPath(); poly.forEach(([lon, lat], i) => { const [x, y] = P(lon, lat, w, h); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath();
      c.fillStyle = '#5da454'; c.fill(); c.lineWidth = 10; c.strokeStyle = 'rgba(140,200,235,0.55)'; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#3f7d3c'; c.stroke();
    }
    c.save(); c.globalAlpha = 0.85;
    for (const [[lon, lat], rw, rh] of DESERTS) { const [x, y] = P(lon, lat, w, h); c.beginPath(); c.ellipse(x, y, rw / 360 * w, rh / 180 * h, 0, 0, Math.PI * 2); c.fillStyle = '#d4b06e'; c.fill(); }
    c.restore();
    c.fillStyle = '#f3f6f8'; c.fillRect(0, h * 0.94, w, h * 0.06);
    c.beginPath(); for (let x = 0; x <= w; x += 32) c.lineTo(x, h * (0.93 - 0.012 * Math.sin(x * 0.02))); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    c.fillRect(0, 0, w, h * 0.035);
  });
  const body = part(new THREE.SphereGeometry(r, 72, 48), toon('#ffffff', { map: tex, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: 0.16 }), { px: 3 }); g.add(body);
  // Clouds: soft white swirls on a shell just above the ground, under the painted face.
  const cloudTex = canvasTexture(1024, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = rand(300 + i) * w, y = h * (0.12 + 0.76 * rand(400 + i)), rw = 18 + rand(500 + i) * 70, rh = 6 + rand(600 + i) * 12;
      const gr = c.createRadialGradient(x, y, 0, x, y, rw); gr.addColorStop(0, 'rgba(255,255,255,0.92)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, rw, rh, rand(700 + i) * 0.6 - 0.3, 0, Math.PI * 2); c.fill();
    }
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(r * 1.006, 64, 40), toon('#ffffff', { map: cloudTex, transparent: true, depthWrite: false, emissive: new THREE.Color('#ffffff'), emissiveMap: cloudTex, emissiveIntensity: 0.2 }));
  g.add(clouds);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.075, 48, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { c: { value: new THREE.Color('#6cb8ff') } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(c * f * 0.75, f); }',
  }));
  g.add(halo);
  const face = faceDecal(r, { skin: '#3b8bd0', browThick: 3.2 }); face.mesh.scale.setScalar(1.012); g.add(face.mesh);
  // Clouds drift a little faster than the ground turns.
  const turn = body.rotation; Object.defineProperty(body, 'spin', { set(v) { turn.y = v; clouds.rotation.y = v * 1.35; } });
  return { group: g, body, clouds, face, radius: r };
}

export function moon(r = 0.7) {
  const g = new THREE.Group(), body = part(new THREE.SphereGeometry(r, 48, 32), tint(BRAND.whiteSand, 0.1, '#9a958f'), { px: 2.6 }); g.add(body);
  for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.CircleGeometry(r * (0.08 + rand(i + 90) * 0.1), 18), toon(tint(BRAND.whiteSand, 0.4, '#6e6a66'))); const a = Math.PI * (0.1 + rand(i + 91) * 0.9) + Math.PI, el = (rand(i + 92) - 0.5) * 1.6; const d = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.abs(Math.sin(a)) * Math.cos(el) * (i % 2 ? 1 : -1)); c.position.copy(d.clone().multiplyScalar(r * 1.002)); c.lookAt(d.multiplyScalar(r * 3)); g.add(c); }
  const face = faceDecal(r, { skin: tint(BRAND.whiteSand, 0.1, '#9a958f').getStyle() }); g.add(face.mesh);
  return { group: g, face, radius: r };
}

// ---------- spacetime ----------
/** A flexible grid surface (square or round) that dents under a mass: setDent(depth, width, cx, cz). */
export function gridSurface({ size = 6, seg = 96, round = false, lines = 16, color = BRAND.blueCoral, line = BRAND.whiteSand } = {}) {
  const tex = canvasTexture(1024, 1024, (c, w) => { c.fillStyle = tint(color, 0.12).getStyle(); c.fillRect(0, 0, w, w); c.strokeStyle = line; c.lineWidth = 7; for (let i = 0; i <= lines; i++) { const p = i / lines * w; c.beginPath(); c.moveTo(p, 0); c.lineTo(p, w); c.stroke(); c.beginPath(); c.moveTo(0, p); c.lineTo(w, p); c.stroke(); } });
  const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const mat = toon('#ffffff', { map: tex, side: THREE.DoubleSide, emissive: new THREE.Color(line), emissiveMap: tex, emissiveIntensity: 0.18, transparent: round, alphaTest: round ? 0.5 : 0 });
  if (round) { const alpha = canvasTexture(256, 256, (c, w) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, w); c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 2, 0, Math.PI * 2); c.fill(); }, { srgb: false }); mat.alphaMap = alpha; }
  const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true;
  return { mesh, setDent(depth, width = 1, cx = 0, cz = 0) { const p = geo.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const x = base[i], z = base[i + 2], d2 = ((x - cx) ** 2 + (z - cz) ** 2) / (width * width); p[i + 1] = base[i + 1] - depth * Math.exp(-d2); } geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); }, heightAt(x, z, depth, width = 1, cx = 0, cz = 0) { return -depth * Math.exp(-(((x - cx) ** 2 + (z - cz) ** 2) / (width * width))); } };
}
export function trampoline(r = 1.6) {
  const g = new THREE.Group();
  const rim = part(new THREE.TorusGeometry(r, 0.07, 10, 64), BRAND.anthracite, { px: 2 }); rim.rotation.x = Math.PI / 2; rim.position.y = 0.62; g.add(rim);
  const pad = part(new THREE.TorusGeometry(r - 0.05, 0.1, 8, 64), BRAND.rougeNoir, { px: 2 }); pad.rotation.x = Math.PI / 2; pad.position.y = 0.66; pad.scale.set(1, 1, 0.5); g.add(pad);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, leg = part(new THREE.CylinderGeometry(0.04, 0.04, 0.64, 8), BRAND.anthracite, { px: 1.6 }); leg.position.set(Math.cos(a) * r, 0.31, Math.sin(a) * r); g.add(leg); }
  const surface = gridSurface({ size: (r - 0.08) * 2, seg: 72, round: true, lines: 10 }); surface.mesh.position.y = 0.62; g.add(surface.mesh);
  return { group: g, surface, top: 0.62 };
}
export function bowlingBall(r = 0.32) {
  const g = new THREE.Group(), b = part(new THREE.SphereGeometry(r, 40, 28), toon(tint(BRAND.rougeNoir, 0.12, '#a01828'), { emissive: new THREE.Color('#3a0810'), emissiveIntensity: 0.3 }), { px: 2.4 }); g.add(b);
  for (const [a, e] of [[-0.25, 0.45], [0.05, 0.5], [-0.1, 0.25]]) { const h = new THREE.Mesh(new THREE.CircleGeometry(r * 0.12, 16), new THREE.MeshBasicMaterial({ color: '#0a0a0c' })); const d = new THREE.Vector3(Math.sin(a), Math.sin(e), Math.cos(a) * Math.cos(e)).normalize(); h.position.copy(d.clone().multiplyScalar(r * 1.003)); h.lookAt(d.multiplyScalar(r * 3)); g.add(h); }
  return g;
}

// ---------- study ----------
export function desk() {
  const g = new THREE.Group(), wood = BRAND.cognac;
  const top = part(new THREE.BoxGeometry(2.4, 0.1, 1.1), wood, { px: 2.2 }); top.position.y = 0.9; g.add(top);
  for (const [x, z] of [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]]) { const l = part(new THREE.BoxGeometry(0.1, 0.9, 0.1), tint(wood, 0.1, BRAND.anthracite), { px: 1.6 }); l.position.set(x, 0.45, z); g.add(l); }
  const drawers = part(new THREE.BoxGeometry(0.7, 0.5, 1.0), tint(wood, 0.06), { px: 2 }); drawers.position.set(0.8, 0.6, 0); g.add(drawers);
  return g;
}
export function lamp(color = '#ffd2a2') {
  const g = new THREE.Group();
  const base = part(new THREE.CylinderGeometry(0.14, 0.18, 0.06, 18), BRAND.anthracite, { px: 1.6 }); g.add(base);
  const arm = part(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), BRAND.anthracite, { px: 1.4 }); arm.position.set(0, 0.3, 0); arm.rotation.z = 0.25; g.add(arm);
  const shade = part(new THREE.ConeGeometry(0.2, 0.24, 18, 1, true), BRAND.blueCoral, { px: 1.8, opts: { side: THREE.DoubleSide } }); shade.position.set(-0.12, 0.62, 0); g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), glow(color, 3)); bulb.position.set(-0.12, 0.55, 0); g.add(bulb);
  const light = new THREE.PointLight(color, 3.2, 6, 1.6); light.position.set(-0.12, 0.5, 0.05); g.add(light); // no lamp shadow: point-light shadow maps band on toon heads
  return { group: g, light };
}
export function bookshelf({ w = 2.2, h = 2.6, seed = 21 } = {}) {
  const g = new THREE.Group(), wood = tint(BRAND.cognac, 0.05, BRAND.anthracite);
  const frame = part(new THREE.BoxGeometry(w, h, 0.5), wood, { px: 2.2 }); frame.position.y = h / 2; g.add(frame);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, h - 0.12, 0.44), toon(tint(BRAND.cognac, 0.4, BRAND.anthracite))); inner.position.set(0, h / 2, 0.05); g.add(inner);
  const colors = [BRAND.rougeNoir, BRAND.blueCoral, BRAND.whiteSand, tint(BRAND.cognac, 0.3), tint(BRAND.rougeNoir, 0.25), tint(BRAND.blueCoral, 0.3)];
  for (let shelf = 0; shelf < 4; shelf++) {
    const y = 0.12 + shelf * (h - 0.2) / 4, board = part(new THREE.BoxGeometry(w - 0.1, 0.05, 0.46), wood, { px: 1.2 }); board.position.set(0, y, 0.04); g.add(board);
    let x = -w / 2 + 0.12;
    for (let i = 0; x < w / 2 - 0.2; i++) { const bw = 0.08 + rand(seed + shelf * 40 + i) * 0.09, bh = 0.34 + rand(seed + shelf * 50 + i) * 0.18, book = part(new THREE.BoxGeometry(bw, bh, 0.34), colors[(i + shelf) % colors.length], { px: 1.2 }); book.position.set(x + bw / 2, y + 0.03 + bh / 2, 0.1); book.rotation.z = rand(seed + i * 3 + shelf) < 0.12 ? 0.18 : 0; g.add(book); x += bw + 0.012; }
  }
  return g;
}
/** A chalkboard whose drawing is supplied as a 2D canvas painter. */
export function chalkboard(paint, { w = 2.6, h = 1.6 } = {}) {
  const g = new THREE.Group(), frame = part(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.08), BRAND.cognac, { px: 2 }); g.add(frame);
  const tex = canvasTexture(1024, Math.round(1024 * h / w), (c, cw, ch) => { c.fillStyle = tint(BRAND.blueCoral, 0.05, BRAND.anthracite).getStyle(); c.fillRect(0, 0, cw, ch); c.strokeStyle = c.fillStyle = 'rgba(231,227,221,0.9)'; c.lineWidth = 6; c.lineCap = 'round'; paint(c, cw, ch); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', { map: tex, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: 0.12 })); board.position.z = 0.045; g.add(board);
  return g;
}
export function scissors() {
  const g = new THREE.Group(), blades = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); g.add(pivot);
    const blade = part(new THREE.BoxGeometry(0.05, 0.42, 0.015), '#c8c6c2', { px: 1.4 }); blade.position.y = 0.21; pivot.add(blade);
    const ring = part(new THREE.TorusGeometry(0.07, 0.022, 8, 16), BRAND.rougeNoir, { px: 1.4 }); ring.position.y = -0.1; pivot.add(ring);
    blades.push({ pivot, s });
  }
  return { group: g, set(open) { for (const b of blades) b.pivot.rotation.z = b.s * open * 0.45; } };
}
