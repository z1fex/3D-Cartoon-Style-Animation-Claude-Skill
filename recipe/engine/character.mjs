// Cartoon characters: a ball for a head, a bean for a body, thin stick limbs, mitten hands, a painted face.
// Poses are plain numbers; a pose timeline blends between them so gestures land before their word and holds stay dead still.
import { THREE, BRAND, toon, part, tint, ease, clamp01, F, rand } from './core.mjs';
import { faceDecal, faceAt } from './faces.mjs';

export const HEAD_R = 0.42, BODY_H = 0.8, LEG_L = 0.52, ARM_U = 0.3, ARM_F = 0.28;

/** A bean body from a lathe profile, split at `split` (0..1 of height) into top and bottom colours. */
function bean(top, bottom, split = 0.34, width = 1) {
  const prof = [[0, 0], [0.2, 0.02], [0.27, 0.09], [0.3, 0.22], [0.3, 0.38], [0.28, 0.55], [0.24, 0.7], [0.17, 0.78], [0, 0.8]].map(([x, y]) => new THREE.Vector2(x * width, y));
  const cut = split * BODY_H, below = [], above = [];
  for (let i = 0; i < prof.length; i++) { (prof[i].y <= cut ? below : above).push(prof[i]); }
  const a = below.at(-1), b = above[0], k = (cut - a.y) / (b.y - a.y), mid = new THREE.Vector2(a.x + (b.x - a.x) * k, cut);
  const g = new THREE.Group();
  g.add(part(new THREE.LatheGeometry([...below, mid], 40), bottom));
  g.add(part(new THREE.LatheGeometry([mid, ...above], 40), top));
  return g;
}
function stick(len, r = 0.034, color = BRAND.anthracite) { const m = part(new THREE.CylinderGeometry(r, r, len, 10), color, { px: 1.8 }); m.position.y = -len / 2; return m; }

/**
 * Builds a character. spec: { skin, top, bottom, hair: 'newton'|'einstein'|'cap', hairColor, face: { mustache, browColor } , width }
 */
export function makeCharacter(spec) {
  const root = new THREE.Group(); root.name = spec.name ?? 'character';
  const hips = new THREE.Group(); hips.position.y = LEG_L; root.add(hips);
  const torso = new THREE.Group(); hips.add(torso);
  const body = bean(spec.top, spec.bottom, spec.split ?? 0.34, spec.width ?? 1); torso.add(body);
  if (spec.extras) spec.extras(torso);

  // Head on a neck pivot.
  const neck = new THREE.Group(); neck.position.y = BODY_H - 0.02; neck.rotation.order = 'YXZ'; torso.add(neck);
  const head = new THREE.Group(); head.position.y = HEAD_R * 0.9; neck.add(head);
  head.add(part(new THREE.SphereGeometry(HEAD_R, 48, 32), spec.skin, { px: 2.8 }));
  const face = faceDecal(HEAD_R, { skin: spec.skin, ...(spec.face ?? {}) }); head.add(face.mesh);
  buildHair(head, spec);

  // Arms: shoulder (raise sideways) -> swing (forward) -> elbow -> mitten hand.
  const arms = {};
  for (const [side, x] of [['L', 0.25], ['R', -0.25]]) {
    const shoulder = new THREE.Group(); shoulder.position.set(x, BODY_H - 0.16, 0); torso.add(shoulder);
    const swing = new THREE.Group(); shoulder.add(swing); swing.add(stick(ARM_U, 0.033));
    const elbow = new THREE.Group(); elbow.position.y = -ARM_U; swing.add(elbow); elbow.add(stick(ARM_F, 0.031));
    const hand = part(new THREE.SphereGeometry(0.07, 20, 14), spec.hands ?? spec.skin, { px: 1.8 }); hand.scale.set(1, 1.12, 0.86); hand.position.y = -ARM_F - 0.06; elbow.add(hand);
    const grip = new THREE.Group(); grip.position.y = -ARM_F - 0.07; elbow.add(grip);
    arms[side] = { shoulder, swing, elbow, hand, grip, sign: side === 'L' ? 1 : -1 };
  }
  // Legs with rounded shoes.
  const legs = {};
  for (const [side, x] of [['L', 0.11], ['R', -0.11]]) {
    const hip = new THREE.Group(); hip.position.set(x, 0.02, 0); hips.add(hip); hip.add(stick(LEG_L, 0.036));
    const shoe = part(new THREE.SphereGeometry(0.085, 20, 12), spec.shoes ?? tint(BRAND.cognac, 0.25, BRAND.anthracite), { px: 1.8 }); shoe.scale.set(0.95, 0.62, 1.4); shoe.position.set(0, -LEG_L + 0.01, 0.045); hip.add(shoe);
    legs[side] = { hip };
  }
  root.traverse(o => { if (o.isMesh && !o.userData.ink) o.castShadow = true; });

  const rig = { root, hips, torso, neck, head, face, arms, legs };
  /** Applies a pose object (see POSES) instantly. */
  rig.pose = p => {
    hips.position.y = LEG_L + (p.hipsY ?? 0); torso.rotation.x = p.lean ?? 0; torso.rotation.z = p.tilt ?? 0; torso.position.y = p.bob ?? 0;
    neck.rotation.set(p.headPitch ?? 0, p.headYaw ?? 0, p.headRoll ?? 0);
    for (const s of ['L', 'R']) {
      const a = arms[s];
      a.shoulder.rotation.z = a.sign * (p['raise' + s] ?? 0.12);
      a.swing.rotation.x = -(p['fwd' + s] ?? 0.04); a.swing.rotation.y = a.sign * (p['twist' + s] ?? 0);
      a.elbow.rotation.x = -(p['elbow' + s] ?? 0.1);
      legs[s].hip.rotation.x = -(p['leg' + s] ?? 0); legs[s].hip.rotation.z = a.sign * (p['legOut' + s] ?? 0.02);
    }
  };
  /** Pose at time t from [time, poseName or object] keys: each change takes `dur` and lands at its key time; the head lags by 3 frames. */
  rig.animate = (t, keys, { dur = 5 * F, lag = 3 * F } = {}) => rig.pose(blendKeys(t, keys, dur, lag));
  /** Face at time t from [time, expression] swaps (swap through a blink) plus optional natural blinks. */
  rig.faceAt = (t, swaps, blinks) => { const [n, b] = faceAt(t, swaps, blinks); face.set(n, b); };
  /** World position of a hand's grip point ('L', 'R' or 'both' for the midpoint), after the current pose. */
  rig.handPos = side => {
    root.updateMatrixWorld(true);
    if (side === 'both') return arms.L.grip.getWorldPosition(new THREE.Vector3()).add(arms.R.grip.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
    return arms[side].grip.getWorldPosition(new THREE.Vector3());
  };
  /** World position of the head centre (for camera framing and focus). */
  rig.headPos = () => { root.updateMatrixWorld(true); return head.getWorldPosition(new THREE.Vector3()); };
  rig.pose(POSES.stand);
  return rig;
}

function buildHair(head, spec) {
  const c = spec.hairColor ?? '#3a2a22';
  if (spec.hair === 'newton') { // long curled 17th-century wig
    const cap = part(new THREE.SphereGeometry(HEAD_R * 1.05, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.4), c, { px: 2.4 }); cap.rotation.x = -0.62; head.add(cap);
    for (let i = 0; i < 26; i++) {
      const a = Math.PI * (0.62 + 0.76 * (i % 13) / 12) + Math.PI / 2, row = Math.floor(i / 13), y = -0.02 - row * 0.2 - 0.04 * Math.sin(i), rr = HEAD_R * (1.0 + 0.05 * row);
      const curl = part(new THREE.SphereGeometry(0.105 + 0.02 * rand(i), 16, 12), c, { px: 2 }); curl.position.set(Math.cos(a) * rr, y, -Math.abs(Math.sin(a)) * rr * 0.92 - 0.02); head.add(curl);
    }
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const curl = part(new THREE.SphereGeometry(0.1, 16, 12), c, { px: 2 }); curl.position.set(s * HEAD_R * 0.98, -0.08 - k * 0.15, -0.12 + 0.02 * k); head.add(curl); }
  } else if (spec.hair === 'einstein') { // wild white hair around the back and sides, high forehead
    for (let i = 0; i < 34; i++) {
      const a = Math.PI * 0.35 + Math.PI * 1.3 * rand(i * 3 + 1) + Math.PI / 2, el = -0.35 + 1.0 * rand(i * 7 + 2);
      const rr = HEAD_R * (1.0 + 0.12 * rand(i * 5 + 3)), d = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), -Math.abs(Math.sin(a)) * Math.cos(el));
      const tuft = part(new THREE.SphereGeometry(0.09 + 0.06 * rand(i * 11), 14, 10), toon(c, { emissive: new THREE.Color(c), emissiveIntensity: 0.18 }), { px: 2 }); tuft.position.copy(d.multiplyScalar(rr)); head.add(tuft);
    }
  } else if (spec.hair === 'cap' || spec.hair === 'short') { // a close cap of hair
    const cap = part(new THREE.SphereGeometry(HEAD_R * 1.05, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.46), c, { px: 2.4 }); cap.rotation.x = -0.3; head.add(cap);
  } else if (spec.hair === 'bob') { // a rounded bob to the jaw, with a fringe
    const cap = part(new THREE.SphereGeometry(HEAD_R * 1.07, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), c, { px: 2.4 }); cap.rotation.x = -0.75; head.add(cap);
    for (const s of [-1, 1]) { const side = part(new THREE.SphereGeometry(HEAD_R * 0.42, 20, 14), c, { px: 2 }); side.scale.set(0.7, 1.15, 1); side.position.set(s * HEAD_R * 0.86, -HEAD_R * 0.2, -HEAD_R * 0.12); head.add(side); }
  } else if (spec.hair === 'bun' || spec.hair === 'ponytail') { // a cap plus a bun on top or a tail at the back
    const cap = part(new THREE.SphereGeometry(HEAD_R * 1.05, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), c, { px: 2.4 }); cap.rotation.x = -0.45; head.add(cap);
    if (spec.hair === 'bun') { const bun = part(new THREE.SphereGeometry(HEAD_R * 0.34, 20, 14), c, { px: 2.2 }); bun.position.set(0, HEAD_R * 1.05, -HEAD_R * 0.3); head.add(bun); }
    else { const tail = part(new THREE.CapsuleGeometry(HEAD_R * 0.16, HEAD_R * 0.7, 6, 12), c, { px: 2 }); tail.position.set(0, -HEAD_R * 0.05, -HEAD_R * 1.08); tail.rotation.x = 0.35; head.add(tail); }
  } else if (spec.hair === 'curly') { // a cloud of curls over the top and back
    for (let i = 0; i < 30; i++) {
      const a = Math.PI * 2 * rand(i * 3 + 7), el = 0.15 + 1.25 * rand(i * 7 + 5), d = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
      if (d.z > 0.35 && d.y < 0.75) continue; // keep the face clear
      const curl = part(new THREE.SphereGeometry(0.1 + 0.04 * rand(i), 14, 10), c, { px: 2 }); curl.position.copy(d.multiplyScalar(HEAD_R * 1.02)); head.add(curl);
    }
  } else if (spec.hair === 'spiky') { // short cones standing up
    const cap = part(new THREE.SphereGeometry(HEAD_R * 1.03, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.42), c, { px: 2.2 }); cap.rotation.x = -0.3; head.add(cap);
    for (let i = 0; i < 9; i++) { const a = -1.0 + 2.0 * i / 8, sp = part(new THREE.ConeGeometry(0.06, 0.2, 8), c, { px: 1.8 }); sp.position.set(Math.sin(a) * HEAD_R * 0.7, HEAD_R * 0.86, -Math.cos(a) * HEAD_R * 0.25 - 0.05); sp.rotation.set(-0.3, 0, -a * 0.5); head.add(sp); }
  } // 'bald' (or no hair): nothing
  buildHat(head, spec); buildGlasses(head, spec); buildBeard(head, spec);
}

/** A point on the head sphere: az = degrees toward screen right, el = degrees up, at radius r × HEAD_R. */
const onHead = (az, el, r = 1) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(HEAD_R * r); };

/** Hats: 'cap' (peaked cap), 'tophat', 'helmet' (round space or safety helmet shell), 'hardhat', 'beret', 'crown'. */
function buildHat(head, spec) {
  if (!spec.hat) return;
  const c = spec.hatColor ?? BRAND.anthracite, hat = new THREE.Group(); head.add(hat);
  if (spec.hat === 'cap') {
    hat.add(part(new THREE.SphereGeometry(HEAD_R * 1.08, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.45), c, { px: 2.4 }));
    const peak = part(new THREE.CylinderGeometry(HEAD_R * 0.62, HEAD_R * 0.62, 0.025, 28, 1, false, -Math.PI / 2, Math.PI), c, { px: 2 }); peak.position.set(0, HEAD_R * 0.32, HEAD_R * 0.62); peak.rotation.x = 0.12; hat.add(peak);
  } else if (spec.hat === 'tophat') {
    const brim = part(new THREE.CylinderGeometry(HEAD_R * 1.25, HEAD_R * 1.25, 0.03, 32), c, { px: 2.2 }); brim.position.y = HEAD_R * 0.78; hat.add(brim);
    const crown = part(new THREE.CylinderGeometry(HEAD_R * 0.78, HEAD_R * 0.82, HEAD_R * 1.15, 28), c, { px: 2.2 }); crown.position.y = HEAD_R * 1.35; hat.add(crown);
    const band = part(new THREE.CylinderGeometry(HEAD_R * 0.825, HEAD_R * 0.83, HEAD_R * 0.18, 28), spec.hatBand ?? BRAND.rougeNoir, { px: 0 }); band.position.y = HEAD_R * 0.9; hat.add(band);
  } else if (spec.hat === 'helmet' || spec.hat === 'hardhat') {
    hat.add(part(new THREE.SphereGeometry(HEAD_R * 1.1, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), spec.hatColor ?? (spec.hat === 'hardhat' ? '#e8b23a' : BRAND.whiteSand), { px: 2.4 }));
    const rim = part(new THREE.TorusGeometry(HEAD_R * 1.1, 0.025, 8, 40), BRAND.anthracite, { px: 0 }); rim.rotation.x = Math.PI / 2; hat.add(rim);
    if (spec.hat === 'hardhat') { const ridge = part(new THREE.BoxGeometry(0.06, 0.05, HEAD_R * 1.9), spec.hatColor ?? '#e8b23a', { px: 1.6 }); ridge.position.y = HEAD_R * 1.08; hat.add(ridge); }
  } else if (spec.hat === 'beret') {
    const b = part(new THREE.SphereGeometry(HEAD_R * 0.95, 30, 16), c, { px: 2.2 }); b.scale.set(1.15, 0.38, 1.1); b.position.set(-HEAD_R * 0.12, HEAD_R * 0.9, -HEAD_R * 0.05); b.rotation.z = 0.18; hat.add(b);
  } else if (spec.hat === 'crown') {
    const gold = spec.hatColor ?? '#d6a650', ring = part(new THREE.CylinderGeometry(HEAD_R * 0.7, HEAD_R * 0.72, HEAD_R * 0.34, 24, 1, true), gold, { px: 2, opts: { side: THREE.DoubleSide } }); ring.position.y = HEAD_R * 0.98; hat.add(ring);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, p = part(new THREE.ConeGeometry(0.05, 0.14, 6), gold, { px: 1.4 }); p.position.set(Math.sin(a) * HEAD_R * 0.7, HEAD_R * 1.2, Math.cos(a) * HEAD_R * 0.7); hat.add(p); }
  }
}

/** Round glasses in front of the painted eyes (spec.glasses = true or a frame colour). */
function buildGlasses(head, spec) {
  if (!spec.glasses) return;
  const c = typeof spec.glasses === 'string' ? spec.glasses : BRAND.anthracite;
  for (const s of [-1, 1]) { const p = onHead(s * 15.5, 6, 1.05), ring = part(new THREE.TorusGeometry(HEAD_R * 0.12, 0.012, 8, 28), c, { px: 0 }); ring.position.copy(p); ring.lookAt(p.clone().multiplyScalar(3)); head.add(ring); }
  const bridge = part(new THREE.CylinderGeometry(0.008, 0.008, HEAD_R * 0.14, 6), c, { px: 0 }); bridge.position.copy(onHead(0, 7, 1.06)); bridge.rotation.z = Math.PI / 2; head.add(bridge);
}

/** A rounded beard below the mouth (spec.beard = true or a colour; defaults to the hair colour). */
function buildBeard(head, spec) {
  if (!spec.beard) return;
  const c = typeof spec.beard === 'string' ? spec.beard : spec.hairColor ?? '#3a2a22';
  const b = part(new THREE.SphereGeometry(HEAD_R * 0.62, 28, 18), c, { px: 2.2 }); b.scale.set(1.15, 0.62, 0.72); b.position.copy(onHead(0, -42, 0.72)); head.add(b);
}

/** Skin tones for the owner's skin-tone series (light to deep). Mix them across a cast. */
export const SKIN = { light: '#f6d3b8', fair: '#f3ceb4', medium: '#e0b08a', tan: '#c98e62', brown: '#9c6542', deep: '#6e4430' };

/** Pose library (radians). Missing values are the relaxed stand. */
export const POSES = {
  stand: {},
  sitGround: { hipsY: -LEG_L + 0.06, lean: -0.18, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.12, legOutR: 0.12, fwdL: 0.55, fwdR: 0.55, elbowL: 0.9, elbowR: 0.9, raiseL: 0.18, raiseR: 0.18 },
  readGround: { hipsY: -LEG_L + 0.06, lean: -0.18, headPitch: 0.38, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.12, legOutR: 0.12, fwdL: 0.85, fwdR: 0.85, elbowL: 1.25, elbowR: 1.25, raiseL: 0.05, raiseR: 0.05 },
  jumpGround: { hipsY: -LEG_L + 0.14, lean: 0.05, headPitch: -0.12, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.15, legOutR: 0.15, fwdL: 0.6, fwdR: 0.6, elbowL: 1.4, elbowR: 1.4, raiseL: 0.5, raiseR: 0.5 },
  lookGround: { hipsY: -LEG_L + 0.06, lean: -0.08, headYaw: 0.55, headPitch: 0.3, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.12, legOutR: 0.12, fwdL: 0.5, fwdR: 0.5, elbowL: 0.9, elbowR: 0.9, raiseL: 0.18, raiseR: 0.18 },
  holdApple: { hipsY: -LEG_L + 0.06, lean: -0.1, headPitch: 0.1, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.12, legOutR: 0.12, fwdR: 1.35, elbowR: 1.05, raiseR: 0.05, fwdL: 0.5, elbowL: 0.9, raiseL: 0.18 },
  thinkGround: { hipsY: -LEG_L + 0.06, lean: -0.12, headPitch: -0.18, headRoll: 0.12, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.12, legOutR: 0.12, fwdR: 1.0, elbowR: 2.25, raiseR: 0.32, fwdL: 0.75, elbowL: 1.3, raiseL: 0.1 },
  pointUp: { hipsY: -LEG_L + 0.06, lean: -0.16, headPitch: -0.35, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.12, legOutR: 0.12, fwdR: 2.75, elbowR: 0.1, raiseR: 0.12, fwdL: 0.5, elbowL: 0.9, raiseL: 0.18 },
  pointDown: { hipsY: -LEG_L + 0.06, lean: 0.02, headPitch: 0.42, headYaw: 0.45, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.12, legOutR: 0.12, fwdR: 0.95, elbowR: 0.05, raiseR: 0.45, fwdL: 0.5, elbowL: 0.9, raiseL: 0.18 },
  shrugGround: { hipsY: -LEG_L + 0.06, lean: -0.12, headRoll: -0.16, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.12, legOutR: 0.12, fwdL: 0.55, fwdR: 0.55, raiseL: 0.75, raiseR: 0.75, elbowL: 1.55, elbowR: 1.55, twistL: -0.4, twistR: -0.4 },
  // Standing gestures.
  wagFinger: { headRoll: 0.08, fwdR: 1.25, elbowR: 1.55, raiseR: 0.32, fwdL: 0.25, elbowL: 1.9, raiseL: 0.45 },
  handsHips: { fwdL: 0.1, raiseL: 0.75, elbowL: 2.1, fwdR: 0.1, raiseR: 0.75, elbowR: 2.1 },
  present: { fwdL: 0.9, raiseL: 0.62, elbowL: 0.45, fwdR: 0.2, raiseR: 0.2, elbowR: 0.4, headYaw: -0.3 },
  snip: { fwdR: 1.25, elbowR: 0.55, raiseR: 0.12, fwdL: 0.4, elbowL: 1.1, raiseL: 0.3, headPitch: 0.25 },
  drop: { lean: 0.12, fwdL: 1.35, elbowL: 0.35, raiseL: 0.18, fwdR: 1.35, elbowR: 0.35, raiseR: 0.18, headPitch: 0.35 },
  delightedStand: { fwdL: 0.3, raiseL: 1.25, elbowL: 0.9, fwdR: 0.3, raiseR: 1.25, elbowR: 0.9, headPitch: -0.1 },
  wave: { fwdR: 0.25, raiseR: 2.4, elbowR: 0.6 },
};

const HEAD_KEYS = ['headPitch', 'headYaw', 'headRoll'];
function poseOf(p) { return typeof p === 'string' ? (POSES[p] ?? (() => { throw Error('Unknown pose ' + p); })()) : p; }
/** Blends pose keys: each key's pose is fully reached at its time, starting `dur` earlier. Head channels lag. */
function blendKeys(t, keys, dur, lag) {
  const at = (tt, filter) => {
    let prev = poseOf(keys[0][1]), out = { ...prev };
    for (let i = 1; i < keys.length; i++) {
      const [kt, kp] = keys[i], next = poseOf(kp), d = keys[i][2] ?? dur;
      if (tt >= kt) { prev = next; out = { ...next }; continue; }
      if (tt > kt - d) { const k = ease.out(clamp01((tt - (kt - d)) / d)); out = {}; for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) { const a = prev[key] ?? DEF[key] ?? 0, b = next[key] ?? DEF[key] ?? 0; out[key] = a + (b - a) * k; } }
      break;
    }
    return out;
  };
  const body = at(t), head = at(t - lag);
  for (const k of HEAD_KEYS) body[k] = head[k] ?? 0;
  return body;
}
const DEF = { raiseL: 0.12, raiseR: 0.12, fwdL: 0.04, fwdR: 0.04, elbowL: 0.1, elbowR: 0.1, legOutL: 0.02, legOutR: 0.02 };

/** Brand outfits for this series. */
export const OUTFITS = {
  newton: { skin: '#f6d3b8', top: BRAND.rougeNoir, bottom: tint(BRAND.cognac, 0.05), hair: 'newton', hairColor: tint(BRAND.cognac, 0.55, BRAND.anthracite), split: 0.3,
    extras: torso => {
      const cravat = part(new THREE.ConeGeometry(0.09, 0.2, 14), BRAND.whiteSand, { px: 1.8 }); cravat.position.set(0, BODY_H - 0.14, 0.2); cravat.rotation.x = Math.PI + 0.25; torso.add(cravat);
      for (let i = 0; i < 3; i++) { const b = part(new THREE.SphereGeometry(0.022, 10, 8), '#d6a650', { px: 1.2 }); b.position.set(0, BODY_H * (0.56 - 0.12 * i), 0.282 - 0.01 * i); torso.add(b); }
    } },
  einstein: { skin: '#f3ceb4', top: tint(BRAND.blueCoral, 0.22, '#2f8a80'), bottom: BRAND.anthracite, hair: 'einstein', hairColor: BRAND.whiteSand, split: 0.32, width: 1.06,
    face: { mustache: '#ece8e2', browColor: '#bdb8b0', browThick: 4.2 },
    extras: torso => { for (const s of [-1, 1]) { const c = part(new THREE.BoxGeometry(0.12, 0.05, 0.09), BRAND.whiteSand, { px: 1.6 }); c.position.set(s * 0.07, BODY_H - 0.07, 0.17); c.rotation.set(0.5, 0, s * 0.5); torso.add(c); } } },
};
