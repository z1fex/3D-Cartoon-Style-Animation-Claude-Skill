// Places added in round 1 v2. farm(), space2() and study2() extend the round-1 places with more dressing;
// campus() is a new Cambridge college gateway on a cobbled street under an overcast sky.
import { THREE, BRAND, RIM, ENV, tint, toon, part, canvasTexture, rand } from './core.mjs';
import * as P from './props.mjs';
import * as P2 from './props2.mjs';
import * as Places from './places.mjs';
import { makeCharacter } from './character.mjs';

/** The orchard dressed as a working farm: haystacks, a cart, a well. */
export function farm() {
  const o = Places.orchard();
  for (const [x, z, s, seed] of [[-3.4, -2.6, 1.0, 3], [-4.9, -3.9, 0.8, 7], [-2.3, -4.6, 0.7, 11]]) { const h = P2.haystack(seed); h.position.set(x, 0, z); h.scale.setScalar(s); o.scene.add(h); }
  const c = P2.cart(); c.position.set(-3.2, 0, 0.7); c.rotation.y = 0.6; o.scene.add(c);
  // A soft front fill so faces under the tree read, and a warm key for hero close-ups (shots switch it on).
  const front = new THREE.DirectionalLight('#ffe6cc', 0.5); front.position.set(2, 4, 10); o.scene.add(front);
  const key = new THREE.PointLight('#ffd3a0', 0, 4.5, 1.4); key.position.set(0.2, 3.35, 2.3); o.scene.add(key); o.heroLight = key;
  const w = P2.well(); w.position.set(5.6, 0, -3.2); o.scene.add(w);
  return o;
}

/** A Cambridge college gateway with stone walls, lamps and cobbles. */
export function campus() {
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(new THREE.Color('#8fa3a0'), 12, 40);
  scene.add(P.skyDome('#b9c3bd', '#d8c9b2', '#5d6a66'));
  const hemi = new THREE.HemisphereLight('#e6efe9', tint(BRAND.cognac, 0.2, BRAND.anthracite), 0.85); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffe2c0', 1.6); sun.position.set(-6, 9, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 40 }); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe3df', 0.55); fill.position.set(6, 4, 6); scene.add(fill);
  const cob = canvasTexture(512, 512, (c, w) => { c.fillStyle = '#7f776d'; c.fillRect(0, 0, w, w); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const sh = 0.72 + rand(x * 13 + y * 7) * 0.22; c.fillStyle = `rgb(${Math.round(176 * sh)},${Math.round(166 * sh)},${Math.round(152 * sh)})`; c.beginPath(); c.ellipse((x + 0.5 + (y % 2) * 0.5) * w / 8, (y + 0.5) * w / 8, w / 17, w / 19, 0, 0, Math.PI * 2); c.fill(); } });
  cob.wrapS = cob.wrapT = THREE.RepeatWrapping; cob.repeat.set(34, 34);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), toon('#ffffff', { map: cob })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const gate = P2.gateway({ name: 'CAMBRIDGE' }); scene.add(gate.group);
  for (const s of [-1, 1]) { const wall = P2.stoneWall(7, 3.0); wall.position.set(s * 5.3, 0, -0.1); scene.add(wall); }
  for (const x of [-2.4, 2.4]) { const l = P2.lampPost(); l.position.set(x, 0, 1.2); scene.add(l); }
  for (const [x, z, r] of [[-3.4, 1.6, 0.3], [-2.9, 2.0, -0.2], [3.3, 1.8, 0.5]]) { const b = part(new THREE.BoxGeometry(0.6, 0.5, 0.6), BRAND.cognac, { px: 1.8 }); b.position.set(x, 0.25, z); b.rotation.y = r; scene.add(b); }
  const c = P2.cart(); c.position.set(4.6, 0, 2.6); c.rotation.y = -0.5; scene.add(c);
  const lens = { focus: 6, aperture: 0.0012, maxblur: 0.007, bloom: 0.3 };
  return { scene, lens, gate, reset() { RIM.rimColor.value.set('#fff0dc'); RIM.rimStrength.value = 0.3; gate.set(0, 0); } };
}

/** Space with the Earth-to-Moon tape measure. */
export function space2() {
  const s = Places.space(); const tape = P2.tapeMeasure({ size: 1.7 }); s.scene.add(tape.group);
  const reset = s.reset; s.tape = tape; s.reset = t => { reset(t); tape.group.visible = false; };
  return s;
}

/** The study with an easel chalkboard, a marble Newton on a plinth, a YEARS counter and a desk apple. */
export function study2() {
  const s = Places.study();
  const easel = P2.easelBoard(); easel.group.position.set(-2.55, 0, -0.55); easel.group.rotation.y = 0.55; s.scene.add(easel.group);
  const pl = P2.plinth('GRAVITY = PULL'); pl.group.position.set(2.35, 0, -0.9); pl.group.rotation.y = -0.45; s.scene.add(pl.group);
  const stone = '#d2cbc0';
  const statue = makeCharacter({ name: 'statue', skin: stone, top: stone, bottom: '#c7bfb3', hands: stone, shoes: '#bdb5a9', hair: 'newton', hairColor: '#c2b9ad', split: 0.3, face: { browColor: '#8f877c' } });
  statue.root.scale.setScalar(0.82); statue.root.position.set(0, pl.topY, 0); pl.group.add(statue.root);
  const years = P.flipCounter({ cells: 3, label: 'YEARS' }); years.group.scale.setScalar(0.72); years.group.position.set(1.45, 2.05, -0.5); years.group.rotation.y = -0.35; s.scene.add(years.group);
  const yStand = part(new THREE.CylinderGeometry(0.05, 0.08, 1.75, 8), BRAND.cognac, { px: 1.4 }); yStand.position.set(1.45, 0.875, -0.5); s.scene.add(yStand);
  const miniApple = P.apple(0.06, { face: true }); s.scene.add(miniApple.group); s.faceCamera.push(miniApple.group);
  Object.assign(s, { easel, plinth: pl, statue, years, miniApple });
  const reset = s.reset; s.reset = t => { reset(t); miniApple.group.visible = false; years.set('  0'); };
  return s;
}
