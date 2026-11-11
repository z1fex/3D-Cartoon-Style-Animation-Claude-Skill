// Props added in round 1 v2: farm dressing, a college gateway with a plague notice, street pieces,
// an Earth-to-Moon tape measure, an easel chalkboard that can be rewritten, and a statue plinth.
import { THREE, BRAND, toon, glow, part, tint, canvasTexture, rand } from './core.mjs';
import { labelTexture } from './props.mjs';

const HAY = tint(BRAND.cognac, 0.45, '#e0b25e');

/** A round haystack with a few loose straws. */
export function haystack(seed = 1) {
  const g = new THREE.Group();
  const body = part(new THREE.SphereGeometry(0.9, 24, 16), HAY, { px: 2.4 }); body.scale.set(1, 0.85, 1); body.position.y = 0.6; g.add(body);
  const top = part(new THREE.ConeGeometry(0.62, 0.7, 20), tint(HAY, 0.1), { px: 2.2 }); top.position.y = 1.55; g.add(top);
  for (let i = 0; i < 9; i++) {
    const s = part(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), tint(HAY, 0.2), { px: 1 }), a = rand(seed + i) * 6.28;
    s.position.set(Math.cos(a) * 0.85, 0.15 + rand(seed + i * 3) * 0.9, Math.sin(a) * 0.85); s.rotation.set(rand(i) - 0.5, a, 1.2); g.add(s);
  }
  return g;
}

/** A wooden hand cart with two wheels. */
export function cart() {
  const g = new THREE.Group(), wood = BRAND.cognac;
  const bed = part(new THREE.BoxGeometry(1.4, 0.12, 0.9), wood, { px: 2 }); bed.position.y = 0.62; g.add(bed);
  for (const z of [-0.45, 0.45]) { const side = part(new THREE.BoxGeometry(1.4, 0.32, 0.06), tint(wood, 0.08), { px: 1.6 }); side.position.set(0, 0.82, z); g.add(side); }
  for (const z of [-0.55, 0.55]) {
    const w = part(new THREE.TorusGeometry(0.42, 0.05, 8, 24), tint(wood, 0.1, BRAND.anthracite), { px: 1.6 }); w.position.set(0, 0.42, z); g.add(w);
    const hub = part(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), BRAND.anthracite, { px: 1 }); hub.rotation.x = Math.PI / 2; hub.position.set(0, 0.42, z); g.add(hub);
  }
  for (const z of [-0.3, 0.3]) { const h = part(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), wood, { px: 1.2 }); h.rotation.z = Math.PI / 2 - 0.25; h.position.set(1.15, 0.78, z); g.add(h); }
  return g;
}

/** A stone well with a little roof and a bucket. */
export function well() {
  const g = new THREE.Group(), stone = tint(BRAND.whiteSand, 0.15, '#9c958c');
  const ring = part(new THREE.CylinderGeometry(0.6, 0.62, 0.7, 20, 1, true), stone, { px: 2.2, opts: { side: THREE.DoubleSide } }); ring.position.y = 0.35; g.add(ring);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.56, 20), toon(BRAND.blueCoral)); water.rotation.x = -Math.PI / 2; water.position.y = 0.3; g.add(water);
  for (const x of [-0.55, 0.55]) { const p = part(new THREE.BoxGeometry(0.08, 1.5, 0.08), BRAND.cognac, { px: 1.4 }); p.position.set(x, 1.05, 0); g.add(p); }
  const roof = part(new THREE.ConeGeometry(0.95, 0.5, 4), BRAND.rougeNoir, { px: 2 }); roof.rotation.y = Math.PI / 4; roof.position.y = 2.0; g.add(roof);
  const bucket = part(new THREE.CylinderGeometry(0.13, 0.1, 0.2, 12), BRAND.cognac, { px: 1.2 }); bucket.position.set(0, 1.25, 0); g.add(bucket);
  return g;
}

/** A college gateway: stone pillars, a lintel sign, two wooden doors that swing shut, and a notice that slaps on. */
export function gateway({ name = 'CAMBRIDGE' } = {}) {
  const g = new THREE.Group(), stone = tint(BRAND.whiteSand, 0.05, '#cfc6b8');
  for (const x of [-1.45, 1.45]) {
    const p = part(new THREE.BoxGeometry(0.7, 3.6, 0.7), stone, { px: 2.4 }); p.position.set(x, 1.8, 0); g.add(p);
    const cap = part(new THREE.BoxGeometry(0.86, 0.22, 0.86), tint(stone, 0.1, '#a99f92'), { px: 2 }); cap.position.set(x, 3.71, 0); g.add(cap);
  }
  const lintel = part(new THREE.BoxGeometry(3.6, 0.6, 0.6), stone, { px: 2.4 }); lintel.position.y = 3.3; g.add(lintel);
  for (let i = 0; i < 5; i++) { const c = part(new THREE.BoxGeometry(0.34, 0.3, 0.6), stone, { px: 2 }); c.position.set(-1.4 + i * 0.7, 3.75, 0); g.add(c); }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.42), new THREE.MeshBasicMaterial({ map: labelTexture(name, { w: 1024, h: 180, bg: BRAND.cognac, fg: BRAND.whiteSand, size: 130 }) }));
  sign.position.set(0, 3.3, 0.305); g.add(sign);
  const doors = [];
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(s * 1.1, 0, 0.05); g.add(hinge);
    const d = part(new THREE.BoxGeometry(1.1, 2.9, 0.1), BRAND.rougeNoir, { px: 2 }); d.position.set(-s * 0.55, 1.45, 0); hinge.add(d);
    for (const y of [0.7, 2.2]) { const band = part(new THREE.BoxGeometry(1.0, 0.08, 0.04), BRAND.anthracite, { px: 0 }); band.position.set(-s * 0.55, y, 0.07); hinge.add(band); }
    doors.push({ hinge, s });
  }
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.9), toon(tint(BRAND.blueCoral, 0.35, '#3d6f6a'))); inside.position.set(0, 1.45, -0.3); g.add(inside);
  const noticeTex = canvasTexture(512, 620, (c, w) => {
    c.fillStyle = '#efe7d6'; c.fillRect(0, 0, w, 620); c.strokeStyle = BRAND.rougeNoir; c.lineWidth = 16; c.strokeRect(14, 14, w - 28, 592);
    c.textAlign = 'center'; c.fillStyle = BRAND.rougeNoir; let fs = 150; c.font = `${fs}px "Titan One"`; while (c.measureText('CLOSED').width > w * 0.82) { fs -= 6; c.font = `${fs}px "Titan One"`; } c.fillText('CLOSED', w / 2, 230);
    c.fillStyle = BRAND.anthracite; c.font = '74px "Titan One"'; c.fillText('PLAGUE', w / 2, 360); c.font = '64px "Titan One"'; c.fillText('1665', w / 2, 460);
    c.strokeStyle = BRAND.rougeNoir; c.lineWidth = 14; c.beginPath(); c.moveTo(w / 2 - 70, 525); c.lineTo(w / 2 + 70, 525); c.moveTo(w / 2, 485); c.lineTo(w / 2, 565); c.stroke();
  });
  const notice = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), toon('#ffffff', { map: noticeTex })); notice.position.set(0, 1.75, 0.13); g.add(notice);
  return {
    group: g, notice,
    /** closed 0 (open) .. 1 (shut); noticeK 0 (none) .. 1 (pinned), may overshoot for a slap. */
    set(closed, noticeK) {
      for (const d of doors) d.hinge.rotation.y = d.s * 1.25 * (1 - closed);
      notice.visible = noticeK > 0.001 && closed > 0.98; notice.scale.setScalar(Math.max(0.001, noticeK)); notice.rotation.z = (1 - Math.min(1, noticeK)) * 0.5 - 0.05;
    },
  };
}

/** A stone wall run with lit windows, for streets and courtyards. */
export function stoneWall(len = 6, h = 3.2) {
  const g = new THREE.Group(), stone = tint(BRAND.whiteSand, 0.1, '#bdb3a5');
  const wall = part(new THREE.BoxGeometry(len, h, 0.5), stone, { px: 2.2 }); wall.position.y = h / 2; g.add(wall);
  for (let x = -len / 2 + 0.9; x < len / 2 - 0.5; x += 1.5) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.95), glow('#ffcf8a', 0.9)); w.position.set(x, h * 0.62, 0.262); g.add(w);
    const fr = part(new THREE.BoxGeometry(0.74, 1.08, 0.04), BRAND.anthracite, { px: 0, cast: false }); fr.position.set(x, h * 0.62, 0.24); g.add(fr);
  }
  return g;
}

export function lampPost(color = '#ffd2a2') {
  const g = new THREE.Group();
  const pole = part(new THREE.CylinderGeometry(0.05, 0.07, 2.8, 8), BRAND.anthracite, { px: 1.6 }); pole.position.y = 1.4; g.add(pole);
  const box = part(new THREE.BoxGeometry(0.34, 0.42, 0.34), BRAND.anthracite, { px: 1.6 }); box.position.y = 2.95; g.add(box);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.36), glow(color, 1.3)); glass.position.y = 2.95; g.add(glass);
  const l = new THREE.PointLight(color, 2.2, 5, 1.8); l.position.y = 2.9; g.add(l);
  return g;
}

/** A tape measure: a housing with a counter window and a tape that runs out toward a target. set(a, b, k, text). */
export function tapeMeasure({ size = 0.7 } = {}) {
  const g = new THREE.Group(), cache = new Map(), housing = new THREE.Group(); g.add(housing);
  const shell = part(new THREE.CylinderGeometry(size * 0.5, size * 0.5, size * 0.45, 32), BRAND.rougeNoir, { px: 2.4 }); shell.rotation.x = Math.PI / 2; housing.add(shell);
  const rim = part(new THREE.TorusGeometry(size * 0.5, size * 0.05, 8, 32), BRAND.anthracite, { px: 0 }); rim.position.z = size * 0.23; housing.add(rim);
  const tex = text => {
    if (cache.has(text)) return cache.get(text);
    const t = canvasTexture(768, 240, (c, w, h) => { c.fillStyle = '#120c0b'; c.fillRect(0, 0, w, h); let s = 150; c.font = `${s}px "Titan One"`; while (c.measureText(text).width > w * 0.9) { s -= 8; c.font = `${s}px "Titan One"`; } c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#ffb347'; c.shadowBlur = 10; c.fillStyle = '#ffb347'; c.fillText(text, w / 2, h / 2 + 6); });
    cache.set(text, t); return t;
  };
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.86, size * 0.27), new THREE.MeshBasicMaterial({ map: tex('0') })); screen.position.set(0, size * 0.04, size * 0.232); housing.add(screen);
  const unit = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.5, size * 0.12), new THREE.MeshBasicMaterial({ map: labelTexture('MILES', { w: 512, h: 120, bg: BRAND.rougeNoir, fg: BRAND.whiteSand, size: 90 }) })); unit.position.set(0, -size * 0.2, size * 0.233); housing.add(unit);
  const ticks = canvasTexture(512, 64, (c, w, h) => { c.fillStyle = '#efe2b8'; c.fillRect(0, 0, w, h); c.fillStyle = BRAND.anthracite; for (let i = 0; i < 32; i++) c.fillRect(i * w / 32, 0, 3, i % 4 ? 18 : 34); c.fillStyle = BRAND.rougeNoir; c.fillRect(0, h - 8, w, 8); });
  ticks.wrapS = THREE.RepeatWrapping;
  const tape = new THREE.Mesh(new THREE.BoxGeometry(1, 0.012, size * 0.22), toon('#ffffff', { map: ticks, emissive: new THREE.Color('#ffffff'), emissiveMap: ticks, emissiveIntensity: 0.25 })); g.add(tape);
  const hook = part(new THREE.BoxGeometry(0.03, size * 0.12, size * 0.24), '#c9c4bc', { px: 1 }); g.add(hook);
  const X = new THREE.Vector3(1, 0, 0);
  return {
    group: g, housing,
    set(a, b, k, text) {
      housing.position.copy(a);
      const dir = b.clone().sub(a), full = dir.length(); dir.normalize();
      const start = a.clone().addScaledVector(dir, size * 0.5), len = Math.max(0.001, (full - size * 0.5) * k), end = start.clone().addScaledVector(dir, len);
      tape.position.copy(start).lerp(end, 0.5); tape.scale.x = len; tape.quaternion.setFromUnitVectors(X, dir); ticks.repeat.x = Math.max(1, len / 1.2);
      hook.position.copy(end); hook.quaternion.copy(tape.quaternion);
      const t = tex(text); if (screen.material.map !== t) { screen.material.map = t; screen.material.needsUpdate = true; }
    },
  };
}

/** An easel chalkboard whose writing can change: draw(stateKey, painter) repaints only when the key changes. */
export function easelBoard({ w = 1.9, h = 1.3 } = {}) {
  const g = new THREE.Group(), wood = BRAND.cognac;
  for (const [x, rz] of [[-0.7, 0.12], [0.7, -0.12]]) { const leg = part(new THREE.BoxGeometry(0.07, 2.6, 0.07), wood, { px: 1.4 }); leg.position.set(x, 1.3, 0); leg.rotation.z = rz; g.add(leg); }
  const back = part(new THREE.BoxGeometry(0.07, 2.4, 0.07), wood, { px: 1.4 }); back.position.set(0, 1.2, -0.45); back.rotation.x = -0.35; g.add(back);
  const frame = part(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.07), wood, { px: 2 }); frame.position.y = 1.75; g.add(frame);
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w); const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', { map: tex, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: 0.12 })); board.position.set(0, 1.75, 0.04); g.add(board);
  let key = null;
  return {
    group: g, board,
    draw(stateKey, painter) {
      if (stateKey === key) return; key = stateKey;
      ctx.fillStyle = tint(BRAND.blueCoral, 0.06, BRAND.anthracite).getStyle(); ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = ctx.fillStyle = 'rgba(236,231,222,0.95)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      painter(ctx, c.width, c.height); tex.needsUpdate = true;
    },
  };
}

/** A plinth with a brass plaque, for statues. */
export function plinth(label = 'GRAVITY = PULL') {
  const g = new THREE.Group(), stone = tint(BRAND.whiteSand, 0.1, '#bdb3a5');
  const base = part(new THREE.BoxGeometry(1.0, 1.1, 1.0), stone, { px: 2.2 }); base.position.y = 0.55; g.add(base);
  const top = part(new THREE.BoxGeometry(1.15, 0.12, 1.15), tint(stone, 0.1, '#a99f92'), { px: 1.8 }); top.position.y = 1.16; g.add(top);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.28), toon('#ffffff', { map: labelTexture(label, { w: 768, h: 240, bg: '#b8873e', fg: BRAND.anthracite, size: 96 }) })); plaque.position.set(0, 0.62, 0.506); g.add(plaque);
  return { group: g, topY: 1.22 };
}
