// Topic-neutral place kit: start any new set from one of these and dress it with props.
// Every builder returns { scene, lens, reset(t), faceCamera: [] , ... } like the dressed places, so a film can use it directly.
import { THREE, BRAND, RIM, ENV, tint, toon, glow, part, canvasTexture, rand } from './core.mjs';
import * as P from './props.mjs';

/**
 * Light presets. Each sets hemisphere, key (shadowed sun), fill and the toon rim colour.
 * golden: warm low sun (history, nostalgia)   day: neutral bright (how-things-work, science)
 * night: cool moonlight + warm practicals (mystery, study)   space: hard white sun, cool rim (astronomy)
 * studio: soft even key for a plain backdrop (diagrams, objects on a table)
 */
export const LIGHT = {
  golden: { rim: '#ffcf94', rimStrength: 0.36, hemi: ['#ffe0bc', ENV.grassDark, 0.62], sun: ['#ffbd74', 2.6, [-9, 7.5, -7]], fill: ['#ffe6cc', 0.72, [6, 5, 10]], front: 0.5, fog: '#dfa274', sky: ['#e3cdb3', '#e0945a', ENV.grassDark] },
  day: { rim: '#ffffff', rimStrength: 0.3, hemi: ['#e8f2ff', ENV.grassDark, 0.8], sun: ['#fff4e2', 2.4, [-6, 10, 6]], fill: ['#dce9ff', 0.6, [6, 4, 8]], front: 0.4, fog: '#bcd6e8', sky: ['#7fb3e0', '#cfe3f0', ENV.grassDark] },
  night: { rim: '#ffcf96', rimStrength: 0.3, hemi: ['#86a6bf', tint(BRAND.cognac, 0.3, BRAND.anthracite), 0.42], sun: ['#9dc0e0', 1.1, [-2.5, 6, -6]], fill: ['#ffd7aa', 0.75, [4, 4, 8]], front: 0.25, fog: '#1d1612', sky: ['#04161a', tint(BRAND.blueCoral, 0.05, BRAND.anthracite), '#05090a'] },
  space: { rim: '#a8d6ff', rimStrength: 0.6, hemi: ['#8fb3b6', '#1b1b1f', 0.35], sun: ['#fff1dc', 2.3, [-12, 5, 9]], fill: ['#6f9ea0', 0.5, [10, -2, 6]], front: 0, fog: null, sky: ['#071012', tint(BRAND.blueCoral, 0.05, BRAND.anthracite), '#040708'] },
  studio: { rim: '#fff0dc', rimStrength: 0.32, hemi: ['#fff6ec', '#cfc7bc', 0.9], sun: ['#fff2e0', 1.8, [-4, 8, 6]], fill: ['#ffffff', 0.7, [5, 3, 8]], front: 0.45, fog: null, sky: null },
};

/** Adds a light preset to a scene and returns the function that sets its rim (call it in reset). */
export function lightRig(scene, preset = 'day', { shadowBox = 8, at = [0, 0, 0] } = {}) {
  const L = typeof preset === 'string' ? LIGHT[preset] : preset;
  scene.add(new THREE.HemisphereLight(...L.hemi));
  const sun = new THREE.DirectionalLight(L.sun[0], L.sun[1]); sun.position.set(...L.sun[2]); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -shadowBox, right: shadowBox, top: shadowBox, bottom: -shadowBox, near: 0.5, far: 60 });
  sun.target.position.set(...at); scene.add(sun, sun.target);
  if (L.fill) { const f = new THREE.DirectionalLight(L.fill[0], L.fill[1]); f.position.set(...L.fill[2]); scene.add(f); }
  if (L.front) { const f = new THREE.DirectionalLight('#ffeedd', L.front); f.position.set(2, 4, 10); scene.add(f); }
  return () => { RIM.rimColor.value.set(L.rim); RIM.rimStrength.value = L.rimStrength; };
}

/** An outdoor place: sky dome, ground, grass (with clear patches where action happens), light preset. */
export function exterior({ time = 'golden', ground = ENV.grass, grass = true, clear = [[0, 0, 1.2]], seed = 5 } = {}) {
  const scene = new THREE.Scene(), L = LIGHT[time];
  if (L.fog) scene.fog = new THREE.Fog(new THREE.Color(L.fog), 22, 85);
  if (L.sky) scene.add(P.skyDome(...L.sky));
  const setRim = lightRig(scene, time, { shadowBox: 7 });
  scene.add(P.ground(ground)); if (grass) scene.add(P.meadow({ seed, radius: 16, clear }));
  return { scene, lens: { focus: 5, aperture: 0.0009, maxblur: 0.0075, bloom: 0.32 }, faceCamera: [], reset() { setRim(); } };
}

/**
 * An interior room: floor planks, two walls (back and left) with a wainscot band, an optional window (day or night view),
 * and the night preset by default. Dress it with props (desk, lamp, bookshelf, boards, counters).
 */
export function interior({ wall = tint(BRAND.whiteSand, 0.12, BRAND.cognac), wainscot = BRAND.rougeNoir, floor = BRAND.cognac, light = 'night', window: win = 'night', width = 14 } = {}) {
  const scene = new THREE.Scene(), L = LIGHT[light]; if (L.fog) scene.fog = new THREE.Fog(new THREE.Color(L.fog), 9, 30);
  const setRim = lightRig(scene, light, { shadowBox: 5 });
  const planks = canvasTexture(512, 512, (c, w) => { for (let i = 0; i < 8; i++) { c.fillStyle = tint(floor, 0.3 + 0.08 * (i % 3), BRAND.anthracite).getStyle(); c.fillRect(0, i * w / 8, w, w / 8); c.fillStyle = 'rgba(27,27,31,0.35)'; c.fillRect(0, i * w / 8, w, 4); } });
  planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(3, 3);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(width, 12), toon('#ffffff', { map: planks })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  const wm = toon(wall);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(width, 6), wm); back.position.set(0, 3, -2.6); back.receiveShadow = true; scene.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), wm); left.position.set(-4.5, 3, 2); left.rotation.y = Math.PI / 2; left.receiveShadow = true; scene.add(left);
  const wb = part(new THREE.BoxGeometry(width, 1.1, 0.06), wainscot, { px: 0 }); wb.position.set(0, 0.55, -2.57); scene.add(wb);
  const wl = part(new THREE.BoxGeometry(0.06, 1.1, 12), wainscot, { px: 0 }); wl.position.set(-4.47, 0.55, 2); scene.add(wl);
  if (win) {
    const view = canvasTexture(512, 640, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      if (win === 'night') { g.addColorStop(0, '#04161a'); g.addColorStop(1, BRAND.blueCoral); } else { g.addColorStop(0, '#7fb3e0'); g.addColorStop(1, '#dbe9f2'); }
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      if (win === 'night') { for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(231,227,221,${0.4 + rand(i) * 0.6})`; c.beginPath(); c.arc(rand(i + 1) * w, rand(i + 2) * h * 0.7, 1.5 + rand(i + 3) * 2, 0, 7); c.fill(); } }
      else { c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(rand(i + 9) * w, h * (0.2 + 0.3 * rand(i + 11)), 70, 22, 0, 0, 7); c.fill(); } }
    });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: view, color: new THREE.Color('#ffffff').multiplyScalar(1.2) })); glass.position.set(-1.9, 2.5, -2.545); scene.add(glass);
    const sash = part(new THREE.BoxGeometry(1.68, 2.08, 0.08), BRAND.cognac, { px: 2, cast: false }); sash.position.set(-1.9, 2.5, -2.64); scene.add(sash);
    for (const [w, h] of [[0.06, 1.9], [1.5, 0.06]]) { const bar = part(new THREE.BoxGeometry(w, h, 0.06), BRAND.cognac, { px: 1.2 }); bar.position.set(-1.9, 2.5, -2.505); scene.add(bar); }
  }
  return { scene, lens: { focus: 3, aperture: 0.0016, maxblur: 0.008, bloom: 0.36 }, faceCamera: [], reset() { setRim(); } };
}

/** A plain studio backdrop (a curved cyclorama) for objects and diagrams: clean, bright, one colour. */
export function studioVoid({ color = BRAND.whiteSand, floor = null } = {}) {
  const scene = new THREE.Scene(); const setRim = lightRig(scene, 'studio', { shadowBox: 5 });
  const cyc = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 12, 64, 1, true, Math.PI * 0.6, Math.PI * 0.8), toon(color, { side: THREE.BackSide })); cyc.position.set(0, 6, 2); cyc.receiveShadow = true; scene.add(cyc);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(9, 64), toon(floor ?? tint(color, 0.08, BRAND.cognac))); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  return { scene, lens: { focus: 4, aperture: 0.0012, maxblur: 0.006, bloom: 0.25 }, faceCamera: [], reset() { setRim(); } };
}

/** Space: stars, a dark sky, the space preset. Add P.earth(), P.moon() or your own bodies. */
export function outerSpace({ stars = 900 } = {}) {
  const scene = new THREE.Scene(); scene.add(P.skyDome(...LIGHT.space.sky)); scene.add(P.stars(stars, 150, 7));
  const setRim = lightRig(scene, 'space', { shadowBox: 12 });
  return { scene, lens: { focus: 8, aperture: 0.0004, maxblur: 0.005, bloom: 0.42 }, faceCamera: [], reset() { setRim(); } };
}
