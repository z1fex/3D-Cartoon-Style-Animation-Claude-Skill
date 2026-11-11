// Dressed places for the 3D Cartoon style, each with its own light rig. Sets are never empty: every place
// carries props, practical lights and depth. A place returns { scene, lens, reset(t), ...named parts }.
import { THREE, BRAND, RIM, ENV, tint, toon, glow, part, canvasTexture, rand } from './core.mjs';
import * as P from './props.mjs';

function rig(scene, { rim, rimStrength, hemi, sun, fill, shadowBox = 8, shadowAt = [0, 0, 0] }) {
  const h = new THREE.HemisphereLight(hemi[0], hemi[1], hemi[2]); scene.add(h);
  const s = new THREE.DirectionalLight(sun[0], sun[1]); s.position.set(...sun[2]); s.castShadow = true;
  s.shadow.mapSize.set(2048, 2048); s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02; s.shadow.radius = 3;
  Object.assign(s.shadow.camera, { left: -shadowBox, right: shadowBox, top: shadowBox, bottom: -shadowBox, near: 0.5, far: 60 });
  s.target.position.set(...shadowAt); scene.add(s, s.target);
  if (fill) { const f = new THREE.DirectionalLight(fill[0], fill[1]); f.position.set(...fill[2]); scene.add(f); }
  return () => { RIM.rimColor.value.set(rim); RIM.rimStrength.value = rimStrength; };
}

/** The orchard at Woolsthorpe, golden hour. */
export function orchard() {
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(new THREE.Color('#dfa274'), 22, 85);
  scene.add(P.skyDome('#e3cdb3', '#e0945a', ENV.grassDark));
  const setRim = rig(scene, { rim: '#ffcf94', rimStrength: 0.36, hemi: ['#ffe0bc', ENV.grassDark, 0.62], sun: ['#ffbd74', 2.6, [-9, 7.5, -7]], fill: ['#ffe6cc', 0.72, [6, 5, 10]], shadowBox: 7, shadowAt: [0.5, 0, 0.5] });
  scene.add(P.ground(ENV.grass));
  scene.add(P.meadow({ seed: 5, radius: 16, clear: [[0, 0, 0.7], [0.35, 0.9, 0.9], [3.2, 1.6, 1.9], [2.4, -0.4, 0.4], [-0.5, 1.05, 0.42]] }));
  const tree = P.appleTree({ seed: 11 }); scene.add(tree.group);
  for (const [x, z, s] of [[-6, -6, 0.8], [5.5, -8, 0.9], [-11, -3, 1.0], [10, -4, 0.85], [-3, -13, 1.1], [7, -15, 1.0]]) { const t = P.appleTree({ seed: 30 + x * 3 + z }); t.group.position.set(x, 0, z); t.group.scale.setScalar(s); scene.add(t.group); }
  const fence = P.fence({ length: 22 }); fence.position.set(0, 0, -7); scene.add(fence);
  const house = P.manor(); house.position.set(-7.5, 0, -19); house.rotation.y = 0.35; scene.add(house);
  // Hero props.
  const hero = P.apple(0.16, { face: true }); scene.add(hero.group);
  const cal = P.calendar({ w: 0.62, h: 0.74, header: 'YEAR' }); cal.group.position.set(0, 2.2, 0.36); cal.group.rotation.x = -0.05; scene.add(cal.group);
  const nail = part(new THREE.SphereGeometry(0.03, 8, 6), '#8a8580', { px: 1 }); nail.position.set(0, 2.62, 0.4); scene.add(nail);
  const crate = part(new THREE.BoxGeometry(0.7, 0.55, 0.55), tint(BRAND.cognac, 0.2), { px: 2 }); crate.position.set(1.45, 0.275, 1.05); crate.rotation.y = -0.35; scene.add(crate);
  const age = P.flipCounter({ cells: 2, label: 'AGE' }); age.group.scale.setScalar(0.8); age.group.position.set(1.45, 1.0, 1.05); age.group.rotation.y = -0.35; scene.add(age.group);
  const sign = P.signpost([['UP', 0.5, 2.3], ['SIDEWAYS', 0, 1.92], ['DOWN', -0.5, 1.54]]); sign.group.position.set(2.5, 0, -0.5); sign.group.rotation.y = -0.25; scene.add(sign.group);
  const book = part(new THREE.BoxGeometry(0.36, 0.05, 0.27), BRAND.rougeNoir, { px: 1.6 }); scene.add(book);
  const tramp = P.trampoline(1.5); tramp.group.position.set(3.4, 0, 1.9); scene.add(tramp.group);
  const ball = P.bowlingBall(0.3); scene.add(ball);
  const lens = { focus: 5, aperture: 0.0009, maxblur: 0.0075, bloom: 0.32 };
  return {
    scene, lens, tree, hero, cal, age, sign, book, tramp, ball, crate, faceCamera: [hero.group],
    reset() { setRim(); cal.set('1665', '1666', 1); age.set('23'); for (let i = 0; i < 3; i++) sign.light(i, 0); tramp.group.visible = false; ball.visible = false; tramp.surface.setDent(0); book.visible = true; },
  };
}

/** Earth and Moon in space, hard sunlight and a cool rim. */
export function space() {
  const scene = new THREE.Scene();
  scene.add(P.skyDome('#071012', tint(BRAND.blueCoral, 0.05, BRAND.anthracite), '#040708'));
  scene.add(P.stars(900, 150, 7));
  const setRim = rig(scene, { rim: '#a8d6ff', rimStrength: 0.6, hemi: ['#8fb3b6', '#1b1b1f', 0.35], sun: ['#fff1dc', 2.3, [-12, 5, 9]], fill: ['#6f9ea0', 0.5, [10, -2, 6]], shadowBox: 12 });
  const e = P.earth(2.2); scene.add(e.group);
  const m = P.moon(0.68); scene.add(m.group);
  const hero = P.apple(0.32, { face: true }); scene.add(hero.group);
  const pull = P.glowString(); scene.add(pull.mesh);
  const pull2 = P.glowString(); scene.add(pull2.mesh);
  const panel = P.ledPanel({ w: 1.9, h: 0.5 }); scene.add(panel.group);
  const lens = { focus: 8, aperture: 0.0004, maxblur: 0.005, bloom: 0.42 };
  return { scene, lens, earth: e, moon: m, hero, pull, pull2, panel, faceCamera: [e.group, m.group, hero.group], reset() { setRim(); pull.mesh.visible = pull2.mesh.visible = false; panel.group.visible = false; hero.group.visible = true; } };
}

/** Einstein's study, Berlin 1915, at night. */
export function study() {
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(new THREE.Color('#1d1612'), 9, 30);
  const setRim = rig(scene, { rim: '#ffcf96', rimStrength: 0.3, hemi: ['#86a6bf', tint(BRAND.cognac, 0.3, BRAND.anthracite), 0.42], sun: ['#9dc0e0', 1.1, [-2.5, 6, -6]], fill: ['#ffd7aa', 0.75, [4, 4, 8]], shadowBox: 5 });
  const planks = canvasTexture(512, 512, (c, w) => { for (let i = 0; i < 8; i++) { c.fillStyle = tint(BRAND.cognac, 0.3 + 0.08 * (i % 3), BRAND.anthracite).getStyle(); c.fillRect(0, i * w / 8, w, w / 8); c.fillStyle = 'rgba(27,27,31,0.35)'; c.fillRect(0, i * w / 8, w, 4); } });
  planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), toon('#ffffff', { map: planks })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallMat = toon(tint(BRAND.whiteSand, 0.12, BRAND.cognac));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat); back.position.set(0, 3, -2.6); back.receiveShadow = true; scene.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), wallMat); left.position.set(-4.5, 3, 2); left.rotation.y = Math.PI / 2; left.receiveShadow = true; scene.add(left);
  const wains = part(new THREE.BoxGeometry(14, 1.1, 0.06), BRAND.rougeNoir, { px: 0 }); wains.position.set(0, 0.55, -2.57); scene.add(wains);
  const wainsL = part(new THREE.BoxGeometry(0.06, 1.1, 12), BRAND.rougeNoir, { px: 0 }); wainsL.position.set(-4.47, 0.55, 2); scene.add(wainsL);
  // Night window with stars.
  const night = canvasTexture(512, 640, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#04161a'); g.addColorStop(1, BRAND.blueCoral); c.fillStyle = g; c.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(231,227,221,${0.4 + rand(i) * 0.6})`; c.beginPath(); c.arc(rand(i + 1) * w, rand(i + 2) * h * 0.7, 1.5 + rand(i + 3) * 2, 0, 7); c.fill(); } c.fillStyle = '#efe6d2'; c.beginPath(); c.arc(w * 0.72, h * 0.22, 42, 0, 7); c.fill(); });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: night, color: new THREE.Color('#ffffff').multiplyScalar(1.25) })); win.position.set(-1.9, 2.5, -2.545); scene.add(win);
  const sash = part(new THREE.BoxGeometry(1.68, 2.08, 0.08), BRAND.cognac, { px: 2, cast: false }); sash.position.set(-1.9, 2.5, -2.64); scene.add(sash);
  for (const [x, y, w, h] of [[-1.9, 2.5, 0.06, 1.9], [-1.9, 2.5, 1.5, 0.06]]) { const bar = part(new THREE.BoxGeometry(w, h, 0.06), BRAND.cognac, { px: 1.2 }); bar.position.set(x, y, -2.505); scene.add(bar); }
  const shelf = P.bookshelf(); shelf.position.set(2.9, 0, -2.3); scene.add(shelf);
  const shelf2 = P.bookshelf({ w: 1.6, seed: 44 }); shelf2.position.set(-4.2, 0, 0.8); shelf2.rotation.y = Math.PI / 2; scene.add(shelf2);
  const board = P.chalkboard((c, w, h) => { c.lineWidth = 5; for (let i = 0; i <= 12; i++) { c.beginPath(); for (let j = 0; j <= 40; j++) { const x = 60 + j / 40 * (w - 120), d = Math.exp(-((x - w / 2) ** 2) / 9000) * 90; const y = 70 + i * (h - 140) / 12 + d * Math.sin(i / 12 * Math.PI); j ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.beginPath(); c.arc(w / 2, h / 2 + 20, 46, 0, 7); c.fill(); c.font = '64px "Titan One"'; c.fillText('G = 8πT', 70, h - 50); }, { w: 2.2, h: 1.3 });
  board.position.set(0.4, 2.75, -2.52); scene.add(board);
  const d = P.desk(); d.position.set(0.2, 0, -0.6); scene.add(d);
  const l = P.lamp(); l.group.position.set(1.1, 0.95, -0.85); scene.add(l.group);
  const cal = P.calendar({ w: 0.5, h: 0.6, header: 'YEAR', color: BRAND.blueCoral }); cal.group.position.set(-0.55, 1.26, -0.85); cal.group.rotation.x = -0.2; scene.add(cal.group);
  const papers = []; for (let i = 0; i < 5; i++) { const p = part(new THREE.BoxGeometry(0.42, 0.006, 0.56), BRAND.whiteSand, { px: 1 }); p.position.set(-0.1 + i * 0.12 - 0.3, 0.955 + i * 0.006, -0.35 + (i % 2) * 0.06); p.rotation.y = (rand(i + 70) - 0.5) * 0.6; scene.add(p); papers.push(p); }
  const mug = part(new THREE.CylinderGeometry(0.07, 0.065, 0.15, 14), BRAND.rougeNoir, { px: 1.4 }); mug.position.set(0.75, 1.03, -0.4); scene.add(mug);
  // Desk model: Earth and Moon joined by a glowing string, and the grid that will bend.
  const mini = { earth: P.earth(0.16), moon: P.moon(0.06), pull: P.glowString(), grid: P.gridSurface({ size: 1.5, seg: 64, lines: 12 }) };
  scene.add(mini.earth.group, mini.moon.group, mini.pull.mesh, mini.grid.mesh);
  const snips = P.scissors(); scene.add(snips.group);
  const lens = { focus: 3, aperture: 0.0016, maxblur: 0.008, bloom: 0.36 };
  return { scene, lens, desk: d, lamp: l, cal, mini, snips, papers, mug, faceCamera: [mini.earth.group, mini.moon.group], reset() { setRim(); for (const p of papers) p.visible = true; mug.visible = true; cal.set('1914', '1915', 1); mini.grid.mesh.visible = mini.earth.group.visible = mini.moon.group.visible = mini.pull.mesh.visible = false; snips.group.visible = false; } };
}
