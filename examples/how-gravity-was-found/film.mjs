// Round 1 v3, "Everything you know about this apple is wrong": 20 shots, one per narration clause, on the
// hook-first script (script-v2.md). Gestures land 4 frames before their word, faces swap through a blink
// 2 frames before, every spoken number lands as an object, and each shot names its subjects for the framing check.
import { THREE, BRAND, F, v3, prog, ease, travel, clamp01, mix, part } from '../../recipe/engine/core.mjs';
import { makeCharacter, OUTFITS, POSES } from '../../recipe/engine/character.mjs';
import * as Places2 from '../../recipe/engine/places2.mjs';

const G = 9.8, LEAD = 4 * F, FACE = 2 * F;

export async function build() {
  const { words, duration } = await (await fetch(new URL('./vo/words-final.json', import.meta.url))).json();
  const W = i => words[i].start;
  const farm = Places2.farm(), campus = Places2.campus(), space = Places2.space2(), study = Places2.study2();

  // ---------- cast ----------
  const newton = makeCharacter({ name: 'newton', ...OUTFITS.newton }); farm.scene.add(newton.root);
  const einstein = makeCharacter({ name: 'einstein', ...OUTFITS.einstein }); study.scene.add(einstein.root);
  const einsteinOut = makeCharacter({ name: 'einstein-orchard', ...OUTFITS.einstein }); farm.scene.add(einsteinOut.root);
  Object.assign(POSES, {
    lookGroundR: { ...POSES.lookGround, headYaw: -0.6, headPitch: 0.32 },
    lookUpGround: { ...POSES.sitGround, headPitch: -0.5, headYaw: -0.15 },
    bookShield: { hipsY: POSES.sitGround.hipsY, lean: -0.12, headPitch: -0.4, legL: Math.PI / 2, legR: Math.PI / 2, legOutL: 0.12, legOutR: 0.12, fwdL: 2.55, fwdR: 2.55, elbowL: 1.05, elbowR: 1.05, raiseL: 0.28, raiseR: 0.28 },
    boredGround: { ...POSES.sitGround, lean: -0.24, headRoll: 0.14, headPitch: 0.1 },
    holdBall: { fwdL: 1.25, fwdR: 1.25, elbowL: 0.55, elbowR: 0.55, raiseL: 0.12, raiseR: 0.12, headPitch: 0.25 },
  });
  const NEWTON_AT = v3(0.35, 0, 0.62);

  // ---------- per-frame state that shots change ----------
  const farmReset = farm.reset, studyReset = study.reset, spaceReset = space.reset;
  farm.reset = t => {
    farmReset(t);
    newton.root.position.copy(NEWTON_AT); newton.root.rotation.set(0, 0, 0); newton.root.visible = true;
    einsteinOut.root.visible = false; farm.hero.group.visible = true; farm.heroLight.intensity = 0;
    const y = t < W(15) - LEAD ? '1665' : '1666'; farm.cal.set(y, y, 1); farm.age.set(t < W(20) ? '00' : '23');
    farm.book.visible = true; farm.book.rotation.set(-0.55, 0, 0);
  };
  study.reset = t => {
    studyReset(t);
    einstein.root.visible = true; study.lamp.group.visible = true; einstein.root.position.set(-0.45, 0, 0.8); einstein.root.rotation.set(0, 0, 0); einstein.arms.R.elbow.rotation.z = 0;
    const y = t < W(60) ? '1914' : '1915'; study.cal.set(y, y, 1); study.cal.group.visible = true; gridStand.visible = false;
  };
  space.reset = t => { spaceReset(t); space.hero.group.visible = false; space.moon.group.visible = true; };

  // ---------- helpers ----------
  /** Camera on an orbit around a subject: [at, distance, yaw°, pitch°, fov]. The subject sits ~43% from the top. */
  const move = (cam, t, s, from, to) => {
    const u = travel((t - s.start) / (s.end + 6 * F - s.start)), L = k => mix(from[k], to[k], u), at = new THREE.Vector3().lerpVectors(v3(...from[0]), v3(...to[0]), u);
    const d = L(1), yaw = L(2) * Math.PI / 180, pitch = L(3) * Math.PI / 180, fov = L(4);
    cam.position.copy(at).add(v3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(d));
    cam.lookAt(at.clone().add(v3(0, -d * Math.tan(fov * Math.PI / 360) * 0.14, 0))); return { focus: d, fov };
  };
  /** Free fall under real gravity, landing exactly at landAt, then a small settle bounce. */
  const fall = (t, landAt, from, to) => {
    const h = from.y - to.y, dur = Math.sqrt(2 * h / G), t0 = landAt - dur;
    if (t <= t0) return { p: from.clone(), state: 'hang' };
    if (t < landAt) { const dt = t - t0; return { p: v3(mix(from.x, to.x, dt / dur), from.y - 0.5 * G * dt * dt, mix(from.z, to.z, dt / dur)), state: 'fall' }; }
    const k = t - landAt; return { p: v3(to.x, to.y + Math.max(0, Math.sin(Math.min(k / 0.22, 1) * Math.PI)) * 0.08 * Math.exp(-k * 4), to.z), state: 'landed' };
  };
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const bookIn = (rig, flat = false) => { farm.book.position.copy(rig.handPos('both')).add(v3(0, 0.03, 0.05)); farm.book.rotation.set(flat ? 0 : -0.55, 0, 0); };
  const head = rig => () => rig.headPos(); const HR = 0.46;
  const HANG = v3(-0.45, 2.95, 0.95), BESIDE = v3(-0.5, 0.15, 1.05);
  const LAND = W(32) - FACE;            // "beside"
  const earthDesk = v3(0.05, 1.18, -0.45), appleDesk = v3(0.62, 1.22, -0.3);
  const stand = h => { const g = new THREE.Group(); g.add(part(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 16), BRAND.anthracite, { px: 1.2 })); const rod = part(new THREE.CylinderGeometry(0.012, 0.012, h, 6), '#c9c4bc', { px: 1 }); rod.position.y = h / 2; g.add(rod); study.scene.add(g); return g; };
  const standE = stand(0.22), standA = stand(0.26);
  const gridStand = new THREE.Group(); study.scene.add(gridStand);
  for (const [x, z] of [[-0.72, -0.72], [0.72, -0.72], [-0.72, 0.72], [0.72, 0.72]]) { const post = part(new THREE.BoxGeometry(0.06, 0.32, 0.06), BRAND.cognac, { px: 1.2 }); post.position.set(0.2 + x, 0.95 + 0.16, -0.5 + z); gridStand.add(post); }
  for (const [x, z, w, d] of [[0, -0.74, 1.54, 0.05], [0, 0.74, 1.54, 0.05], [-0.74, 0, 0.05, 1.54], [0.74, 0, 0.05, 1.54]]) { const rail = part(new THREE.BoxGeometry(w, 0.05, d), BRAND.cognac, { px: 1.2 }); rail.position.set(0.2 + x, 1.27, -0.5 + z); gridStand.add(rail); } standE.position.set(earthDesk.x, 0.955, earthDesk.z); standA.position.set(appleDesk.x, 0.955, appleDesk.z);
  const moonAt = v3(3.36, 3.72, -2.52), APPLE_SPACE = v3(1.9, 2.55, 0.9);
  const boardText = (strike, write) => (c, w, h) => {
    c.lineWidth = 9; c.font = '600 128px "Titan One"'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('GRAVITY =', 70, h * 0.32); c.fillText('PULL', 70, h * 0.68);
    if (strike > 0) { c.lineWidth = 14; c.strokeStyle = '#e8c8a8'; c.beginPath(); c.moveTo(56, h * 0.68); c.lineTo(56 + 330 * strike, h * 0.68 - 22 * strike); c.stroke(); }
    if (write > 0) { c.save(); c.beginPath(); c.rect(410, 0, 600 * write, h); c.clip(); c.fillStyle = '#f2d9b2'; c.font = '600 116px "Titan One"'; c.fillText('BENT', 430, h * 0.6); c.fillText('SPACE', 430, h * 0.86); c.restore(); }
  };

  const shots = [
    { name: 'Hook: this apple', w: 0, set: farm, subjects: () => [['apple', farm.hero.group, 0.17]], apply(t, cam, s) {
      newton.pose(POSES.readGround); newton.face.set('content'); bookIn(newton); farm.heroLight.intensity = 2.6;
      const shake = t > W(7) - FACE ? Math.sin((t - W(7)) * 46) * 0.035 * Math.exp(-(t - W(7)) * 5) : 0;
      farm.hero.group.position.copy(HANG).add(v3(shake, 0, 0)); farm.hero.face.set(t < W(7) - FACE ? 'smug' : 'shocked');
      return move(cam, t, s, [HANG.toArray(), 1.6, 12, 1, 44], [HANG.toArray(), 1.15, 6, 1, 44]);
    } },
    { name: 'It never hit his head', w: 8, set: farm, subjects: () => [['Newton', head(newton), HR]], apply(t, cam, s) {
      newton.animate(t, [[0, 'bookShield'], [W(10) - LEAD, 'readGround', 7 * F]]); newton.faceAt(t, [[0, 'worried'], [W(10) - FACE, 'smug']]);
      bookIn(newton, t < W(10) - LEAD - 3 * F);
      farm.hero.group.position.copy(HANG); farm.hero.face.set('smug');
      return move(cam, t, s, [[0.35, 0.95, 0.62], 3.0, 22, 9, 46], [[0.35, 0.95, 0.62], 2.6, 14, 7, 46]);
    } },
    { name: '1666', w: 14, set: farm, subjects: () => [['calendar', farm.cal.group, 0.3]], apply(t, cam, s) {
      const k = prog(t, W(15) - LEAD - 0.24, W(15) - LEAD, ease.in); farm.cal.set('1665', '1666', k);
      newton.pose(POSES.readGround); newton.face.set('content'); bookIn(newton); farm.hero.group.position.copy(HANG);
      return move(cam, t, s, [[0, 2.18, 0.36], 1.9, 10, 3, 44], [[0, 2.18, 0.36], 1.5, 4, 2, 44]);
    } },
    { name: 'Plague shuts his university', w: 16, set: campus, subjects: () => [['gate', () => v3(0, 1.8, 0.1)]], apply(t, cam, s) {
      const shut = prog(t, W(17) - LEAD - 0.3, W(17) - LEAD, ease.in), slap = prog(t, W(19) - LEAD - 0.12, W(19) - LEAD + 0.1, ease.back);
      campus.gate.set(shut, t > W(19) - LEAD - 0.12 ? slap : 0);
      return move(cam, t, s, [[0, 1.75, 0], 7.2, 14, 5, 48], [[0, 1.75, 0], 6.0, 6, 3, 48]);
    } },
    { name: 'Isaac, twenty-three', w: 20, set: farm, subjects: () => [['Newton', head(newton), HR], ['age', farm.age.group, 0.3]], apply(t, cam, s) {
      const k = prog(t, s.start + 2 * F, W(22) - LEAD, ease.out); farm.age.set(String(Math.round(23 * k)).padStart(2, '0'));
      newton.pose(POSES.boredGround); newton.faceAt(t, [[0, 'neutral'], [W(22) - FACE, 'sleepy']]); bookIn(newton);
      farm.hero.group.position.copy(HANG);
      return move(cam, t, s, [[0.9, 1.1, 0.8], 4.8, 4, 7, 48], [[0.9, 1.1, 0.8], 4.3, 8, 6, 48]);
    } },
    { name: 'Stuck on the family farm', w: 23, set: farm, subjects: () => [['Newton', head(newton), HR], ['age', farm.age.group, 0.3]], apply(t, cam, s) {
      newton.pose(POSES.boredGround); newton.face.set('sleepy'); bookIn(newton); farm.hero.group.position.copy(HANG);
      return move(cam, t, s, [[0.45, 1.4, 0.4], 7.0, 10, 8, 50], [[0.45, 1.5, 0.3], 9.2, 14, 10, 50]);
    } },
    { name: 'An apple drops beside him', w: 29, set: farm, subjects: () => [['Newton', head(newton), HR], ['apple', farm.hero.group, 0.17]], apply(t, cam, s) {
      const a = fall(t, LAND, HANG, BESIDE); farm.hero.group.position.copy(a.p);
      farm.hero.face.set(a.state === 'hang' ? 'sleepy' : a.state === 'fall' ? 'shocked' : 'dizzy');
      newton.animate(t, [[0, 'boredGround'], [LAND + 2 * F, 'lookGroundR', 4 * F]]); newton.faceAt(t, [[0, 'sleepy'], [LAND + F, 'surprised']]); bookIn(newton);
      return move(cam, t, s, [[-0.05, 0.55, 0.85], 4.2, -14, 22, 48], [[-0.05, 0.5, 0.85], 3.7, -8, 20, 48]);
    } },
    { name: 'Why straight down?', w: 34, set: farm, subjects: () => [['Newton', head(newton), HR], ['DOWN sign', () => farm.sign.boards[2].pivot.getWorldPosition(new THREE.Vector3()).add(v3(0.5, -0.2, 0)), 0.6]], apply(t, cam, s) {
      newton.animate(t, [[0, 'lookGroundR'], [W(35) - LEAD, 'lookUpGround'], [W(36) - LEAD, 'pointDown']]); newton.faceAt(t, [[0, 'surprised'], [W(35) - FACE, 'thinking'], [W(36) - FACE, 'curious']]);
      farm.hero.group.position.copy(BESIDE); farm.hero.face.set('dizzy'); bookIn(newton);
      farm.sign.light(2, prog(t, W(36) - LEAD - 0.1, W(36) - LEAD));
      return move(cam, t, s, [[1.6, 1.25, 0.2], 8.6, 2, 7, 50], [[1.65, 1.25, 0.2], 7.9, 6, 6, 50]);
    } },
    { name: 'Why never sideways?', w: 37, set: farm, subjects: () => [['apple', farm.hero.group, 0.17]], apply(t, cam, s) {
      newton.animate(t, [[0, 'pointDown'], [W(39) - LEAD, 'shrugGround']]); newton.faceAt(t, [[0, 'curious'], [W(39) - FACE, 'confused']]); bookIn(newton);
      const slide = prog(t, W(39) - 0.15, W(39) + 0.1, ease.out) - prog(t, W(39) + 0.32, W(39) + 0.56, ease.inOut);
      farm.hero.group.position.copy(BESIDE).add(v3(-0.18 * slide, 0, 0)); farm.hero.face.set(t < W(39) - FACE ? 'curious' : 'confused');
      return move(cam, t, s, [[-0.55, 0.24, 1.05], 1.5, -22, 15, 46], [[-0.55, 0.24, 1.05], 1.2, -13, 12, 46]);
    } },
    { name: 'The Earth pulls it', w: 40, set: space, subjects: () => [['Earth face', () => space.earth.group.position.clone().add(v3(0.6, 0.3, 2.0))], ['apple', space.hero.group]], apply(t, cam, s) {
      const cv = move(cam, t, s, [[0.9, 1.2, 0.4], 9.2, 16, 9, 48], [[1.0, 1.2, 0.4], 10.2, 21, 11, 48]);
      const e = space.earth, a = space.hero, pull = prog(t, W(42) - LEAD - 0.12, W(42) - LEAD, ease.back);
      e.body.spin = t * 0.18; e.face.set(t < W(41) - FACE ? 'neutral' : 'smug');
      a.group.visible = true; a.group.position.copy(APPLE_SPACE.clone().lerp(v3(1.6, 2.25, 0.8), pull)); a.face.set(t < W(42) - FACE ? 'curious' : 'surprised');
      const dir = a.group.position.clone().normalize(); space.pull.set(dir.clone().multiplyScalar(e.radius * 0.98), a.group.position.clone().addScaledVector(dir, -a.radius * 0.9), 0.028 + 0.02 * Math.sin(Math.min(1, pull) * Math.PI));
      return cv;
    } },
    { name: 'The same pull reaches the Moon', w: 46, set: space, subjects: () => [['Moon', () => mixV(v3(1.6, 2.25, 0.8), moonAt, prog(lastT, W(46), W(52) - LEAD, ease.inOut))]], apply(t, cam, s) {
      lastT = t; const grow = prog(t, s.start + 0.1, W(52) - LEAD, ease.inOut), at = v3(1.6, 2.1, 0.6).lerp(moonAt, grow);
      const cv = move(cam, t, s, [at.toArray(), 10.5, 22, 6, 50], [at.toArray(), 9.5, 28, 5, 50]);
      const e = space.earth, m = space.moon, a = space.hero; e.body.spin = t * 0.18; e.face.set('smug');
      a.group.visible = true; a.group.position.set(1.6, 2.25, 0.8); a.face.set('surprised');
      const dirA = a.group.position.clone().normalize(); space.pull.set(dirA.clone().multiplyScalar(e.radius * 0.98), a.group.position.clone().addScaledVector(dirA, -a.radius * 0.9));
      m.group.position.copy(moonAt); m.face.set(t < W(52) - FACE ? 'sleepy' : 'surprised');
      const dirM = moonAt.clone().normalize(), from = dirM.clone().multiplyScalar(e.radius * 0.98);
      space.pull2.set(from, from.clone().lerp(moonAt.clone().addScaledVector(dirM, -m.radius), grow), 0.03);
      return cv;
    } },
    { name: '240,000 miles', w: 53, set: space, subjects: () => [['counter', space.tape.housing], ['Moon', space.moon.group]], apply(t, cam, s) {
      const e = space.earth, m = space.moon; e.body.spin = t * 0.18; e.face.set('smug'); m.group.position.copy(moonAt); m.face.set('surprised');
      const dirM = moonAt.clone().normalize(), a = dirM.clone().multiplyScalar(e.radius + 0.42), b = moonAt.clone().addScaledVector(dirM, -m.radius);
      const k = prog(t, W(53) - 0.05, W(58) - LEAD, ease.out), out = prog(t, s.start, W(58) - LEAD, ease.inOut);
      space.tape.group.visible = true; space.tape.set(a, b, Math.max(0.02, out), k >= 1 ? '240,000' : fmt(Math.floor(240 * k) * 1000));
      // Side view of the whole line: the camera sits square to the Earth-Moon line and creeps in.
      const v = v3(0, 0.1, 0.4), perp = v.sub(dirM.clone().multiplyScalar(v.dot(dirM))).normalize(), u = travel((t - s.start) / (s.end + 6 * F - s.start));
      const look = a.clone().lerp(b, 0.35); cam.position.copy(look).addScaledVector(perp, mix(10.6, 10.0, u)); cam.lookAt(look);
      space.tape.housing.lookAt(cam.position);
      return { focus: cam.position.distanceTo(look), fov: 50, aperture: 0.0003 };
    } },
    { name: 'For 250 years', w: 60, set: study, subjects: () => [['statue', head(study.statue), 0.38], ['YEARS counter', study.years.group, 0.45]], apply(t, cam, s) {
      einstein.root.visible = false;
      const k = prog(t, s.start + 2 * F, W(65) - LEAD, ease.out); study.years.set(String(Math.round(250 * k)).padStart(3, ' '));
      study.statue.pose(POSES.present); study.statue.face.set('proud');
      return move(cam, t, s, [[1.9, 2.0, -0.6], 5.2, -10, 3, 48], [[1.9, 2.0, -0.6], 4.7, -15, 2, 48]);
    } },
    { name: 'Then Einstein rewrote it', w: 69, set: study, subjects: () => [['Einstein', head(einstein), HR], ['board', study.easel.board, 0.7]], apply(t, cam, s) {
      einstein.root.position.set(-0.7, 0, 0.3); einstein.root.rotation.y = -0.45;
      einstein.animate(t, [[0, 'handsHips'], [W(71) - LEAD, 'present']]); einstein.faceAt(t, [[0, 'smug'], [W(70) - FACE, 'knowing']]);
      const strike = prog(t, W(71) - LEAD - 0.05, W(71) + 0.2, ease.out), write = prog(t, W(71) + 0.2, W(72) + 0.32, ease.linear);
      study.easel.draw(`${Math.round(strike * 20)}|${Math.round(write * 30)}`, boardText(Math.round(strike * 20) / 20, Math.round(write * 30) / 30));
      return move(cam, t, s, [[-1.55, 1.65, -0.1], 6.4, 16, 3, 48], [[-1.55, 1.65, -0.1], 5.9, 12, 3, 48]);
    } },
    { name: 'There is no pull', w: 73, set: study, subjects: () => [['apple', study.miniApple.group, 0.07], ['Earth', study.mini.earth.group, 0.17]], apply(t, cam, s) {
      const snipAt = W(76) - FACE, m = study.mini;
      einstein.root.position.set(-0.85, 0, -1.55); einstein.root.rotation.y = 0.45; einstein.pose(POSES.wagFinger); einstein.faceAt(t, [[0, 'knowing'], [snipAt, 'smug']]);
      einstein.arms.R.elbow.rotation.z = t < snipAt - 0.2 ? Math.sin((t - s.start) * 14) * 0.25 : 0;
      m.earth.group.visible = true; m.earth.group.position.copy(earthDesk); m.earth.face.set(t < snipAt ? 'neutral' : 'surprised');
      study.miniApple.group.visible = true; study.miniApple.group.position.copy(appleDesk); study.miniApple.face.set(t < snipAt ? 'neutral' : 'shocked');
      m.pull.set(earthDesk, appleDesk, 0.008); m.pull.mesh.visible = t < snipAt;
      const mid = earthDesk.clone().lerp(appleDesk, 0.5), inK = prog(t, s.start, snipAt - 0.14, ease.out);
      study.snips.group.visible = true; study.snips.group.scale.setScalar(0.9); study.snips.group.position.copy(mid).add(v3(0.4 * (1 - inK), 0.27 + 0.25 * (1 - inK), 0.14)); study.snips.group.rotation.set(0, 0, Math.PI); study.snips.set(1 - prog(t, snipAt - 0.1, snipAt, ease.in));
      study.lamp.group.visible = false;
      return move(cam, t, s, [mid.clone().add(v3(0, 0.1, 0)).toArray(), 2.5, 0, 10, 46], [mid.clone().add(v3(0, 0.06, 0)).toArray(), 2.25, -4, 8, 46]);
    } },
    { name: 'Mass bends space and time', w: 77, set: study, subjects: () => [['Earth', study.mini.earth.group, 0.17]], apply(t, cam, s) {
      const m = study.mini, gp = v3(0.2, 1.27, -0.5), sink = prog(t, W(78) - LEAD - 0.22, W(78) - LEAD, ease.back);
      for (const p of study.papers) p.visible = false; study.mug.visible = false; standE.visible = standA.visible = false; study.cal.group.visible = false; gridStand.visible = true;
      m.grid.mesh.visible = true; m.grid.mesh.position.copy(gp); m.grid.setDent(0.12 * sink, 0.36);
      m.earth.group.visible = true; m.earth.group.position.copy(gp).add(v3(0, 0.17 + 0.32 * (1 - sink) - 0.12 * sink, 0)); m.earth.face.set(sink > 0.5 ? 'wheee' : 'neutral');
      einstein.root.position.set(0.35, 0, -1.9); einstein.pose(POSES.present); study.lamp.group.visible = false; einstein.face.set('smug');
      return move(cam, t, s, [gp.toArray(), 2.0, 30, 36, 44], [gp.toArray(), 1.7, 22, 31, 44]);
    } },
    { name: 'A bowling ball on a trampoline', w: 82, set: farm, subjects: () => [['Einstein', head(einsteinOut), HR], ['ball', farm.ball, 0.3]], apply(t, cam, s) {
      const tr = farm.tramp, c = tr.group.position, top = c.y + tr.top, landAt = W(88) - FACE, dur = 0.5, t0 = landAt - dur;
      tr.group.visible = true; farm.ball.visible = true; einsteinOut.root.visible = true; einsteinOut.root.position.set(4.8, 0, 2.75); einsteinOut.root.rotation.y = -0.85;
      einsteinOut.animate(t, [[0, 'holdBall'], [t0 + 2 * F, 'drop', 3 * F], [landAt + 4 * F, 'delightedStand']]); einsteinOut.faceAt(t, [[0, 'knowing'], [landAt + F, 'delighted']]);
      const held = einsteinOut.handPos('both').add(v3(0, 0.12, 0)), rest = v3(c.x, top + 0.3, c.z); let depth = 0, bp;
      if (t < t0) bp = held; else if (t < landAt) { const u = (t - t0) / dur; bp = held.clone().lerp(rest, u); bp.y += 1.4 * u * (1 - u); }
      else { const k = t - landAt; depth = 0.5 + 0.16 * Math.exp(-k * 5) * Math.cos(k * 18); bp = rest.clone(); bp.y -= depth; }
      tr.surface.setDent(depth, 0.62); farm.ball.position.copy(bp);
      newton.pose(POSES.sitGround); newton.face.set('curious'); bookIn(newton); farm.hero.group.position.copy(BESIDE); farm.hero.face.set('curious');
      return move(cam, t, s, [[4.3, 1.1, 2.3], 6.4, -2, 12, 48], [[4.35, 1.05, 2.3], 5.8, 3, 10, 48]);
    } },
    { name: 'The apple rolls into the dent', w: 89, set: farm, subjects: () => [['apple', farm.hero.group, 0.17], ['ball', farm.ball, 0.3]], apply(t, cam, s) {
      const tr = farm.tramp, c = tr.group.position, top = c.y + tr.top; tr.group.visible = true; farm.ball.visible = true;
      einsteinOut.root.visible = true; einsteinOut.root.position.set(4.8, 0, 2.75); einsteinOut.root.rotation.y = -0.85; einsteinOut.pose(POSES.delightedStand); einsteinOut.face.set('delighted');
      tr.surface.setDent(0.5, 0.62); farm.ball.position.set(c.x, top + 0.3 - 0.5, c.z);
      const k = prog(t, W(91) - 0.1, W(96) - LEAD, ease.in), ang = 1.2 + k * Math.PI * 1.4, r = mix(0.82, 0.6, k);
      const x = Math.cos(ang) * r, z = Math.sin(ang) * r, y = top + tr.surface.heightAt(x, z, 0.5, 0.62) + 0.16;
      farm.hero.group.position.set(c.x + x, y, c.z + z); farm.hero.face.set(k < 0.05 ? 'curious' : k < 1 ? 'wheee' : 'proud');
      newton.pose(POSES.sitGround); newton.face.set('surprised'); bookIn(newton);
      return move(cam, t, s, [[c.x, 0.42, c.z], 4.3, -4, 44, 46], [[c.x, 0.4, c.z], 3.8, -10, 40, 46]);
    } },
    { name: 'So yes', w: 97, set: farm, subjects: () => [['Newton', head(newton), HR]], apply(t, cam, s) {
      newton.animate(t, [[0, 'sitGround'], [W(98) - LEAD, 'shrugGround']]); newton.faceAt(t, [[0, 'surprised'], [W(98) - FACE, 'knowing']]); bookIn(newton);
      farm.hero.group.position.copy(HANG); farm.hero.face.set('smug');
      return move(cam, t, s, [[0.35, 0.95, 0.62], 2.9, 8, 6, 46], [[0.35, 0.95, 0.62], 2.6, 4, 5, 46]);
    } },
    { name: 'Loop: this apple is wrong', w: 99, set: farm, subjects: () => [['apple', farm.hero.group, 0.17]], apply(t, cam, s) {
      newton.pose(POSES.readGround); newton.face.set('content'); bookIn(newton); farm.heroLight.intensity = 2.6;
      farm.hero.group.position.copy(HANG); farm.hero.face.set(t < W(106) - FACE ? 'curious' : 'smug');
      return move(cam, t, s, [HANG.toArray(), 1.05, 0, 1, 44], [HANG.toArray(), 1.6, 12, 1, 44]);
    } },
  ];
  let lastT = 0; const mixV = (a, b, k) => a.clone().lerp(b, k);
  shots.forEach((s, i) => { s.start = i === 0 ? 0 : W(s.w); s.end = i + 1 < shots.length ? W(shots[i + 1].w) : duration + 0.1; });

  // ---------- sound: a cue on every visible action ----------
  // Accents (the sound tool keeps up to ~20 a minute) land on the big story beats; foley is quiet and goes on
  // everything that moves. `dur` makes a sustained sound (creak, whir, chalk, roll); `stop` dips the music before an accent.
  const fallDur = Math.sqrt(2 * (HANG.y - BESIDE.y) / G);
  /** Times where a counter driven by k = prog(t, a, b, ease.out) changes its shown value, at least `gap` apart. */
  const changes = (a, b, value, gap = 0.055) => { const out = []; let last = value(a), lastT = -1; for (let t = a; t <= b + 1e-6; t += 1 / 240) { const v = value(t); if (v !== last && t - lastT >= gap) { out.push(t); lastT = t; } last = v; } return out; };
  const T = [
    // Shot 1, hook: the title pops on, the apple shivers on "wrong".
    [0.02, 'pop', 0.7], [W(7) - FACE, 'rattle', 0.9], [W(7) - FACE, 'pop', 0.5],
    // Shot 2: the book comes down from over his head.
    [W(8) - 0.12, 'whoosh', 0.5], [W(10) - LEAD - 0.12, 'swish', 0.8], [W(10) - LEAD + 0.06, 'tap', 0.7],
    // Shot 3: the year flips to 1666.
    [W(15) - LEAD - 0.2, 'flip', 1], [W(15) - LEAD + 0.02, 'tick', 0.6],
    // Shot 4: Cambridge doors creak shut, then the plague notice slaps on.
    [W(16) - 0.08, 'whoosh', 0.7], [W(17) - LEAD - 0.32, 'creak', 0.9, { dur: 0.34 }], [W(17) - LEAD, 'slam', 1, { stop: true }], [W(19) - LEAD - 0.04, 'slap', 1],
    // Shot 5: AGE rolls up to 23 (a tick on every change).
    [W(20) - 0.08, 'whoosh', 0.6],
    ...changes(W(20) + 2 * F, W(22) - LEAD, t => Math.round(23 * prog(t, W(20) + 2 * F, W(22) - LEAD, ease.out))).map(t => [t, 'tick', 0.8]),
    // Shot 6: the farm, a bird or two.
    [W(24) + 0.1, 'chirp', 0.8], [W(27) - 0.05, 'chirp', 0.6],
    // Shot 7: the apple falls and lands beside him.
    [LAND - fallDur, 'swish', 0.7], [LAND, 'thunk', 1, { stop: true }], [LAND + 0.22, 'tap', 0.45], [LAND + 2 * F, 'pop', 0.35],
    // Shot 8: he looks up, then points down; the DOWN sign lights.
    [W(35) - LEAD - 0.1, 'swish', 0.5], [W(36) - LEAD - 0.1, 'swish', 0.6], [W(36) - LEAD, 'click', 0.9], [W(36) - LEAD + 0.03, 'light', 0.8],
    // Shot 9: the apple scoots sideways and springs back.
    [W(39) - 0.15, 'slide', 0.8], [W(39) + 0.32, 'boing', 0.4],
    // Shot 10: into space; the Earth tugs the apple on its string.
    [W(40) - 0.1, 'whoosh', 1, { long: true }], [W(42) - LEAD - 0.12, 'stretch', 0.7, { dur: 0.16 }], [W(42) - LEAD, 'twang', 1],
    // Shot 11: the same string reaches out to the Moon.
    [W(46) + 0.1, 'whir', 0.5, { dur: W(52) - LEAD - W(46) - 0.1 }], [W(52) - LEAD, 'twang', 0.85], [W(52) - FACE, 'pop', 0.4],
    // Shot 12: the tape measure runs out, its counter ratchets up, and dings at 240,000.
    [W(53) - 0.05, 'whir', 0.8, { dur: W(58) - LEAD - W(53) + 0.05 }],
    ...changes(W(53) - 0.05, W(58) - LEAD, t => Math.floor(240 * prog(t, W(53) - 0.05, W(58) - LEAD, ease.out)), 0.07).map(t => [t, 'tick', 0.55]),
    [W(58) - LEAD, 'ding', 1],
    // Shot 13: the study; YEARS rolls up to 250 beside the marble Newton.
    [W(60) - 0.08, 'whoosh', 0.7],
    ...changes(W(60) + 2 * F, W(65) - LEAD, t => Math.round(250 * prog(t, W(60) + 2 * F, W(65) - LEAD, ease.out)), 0.06).map(t => [t, 'tick', 0.7]),
    [W(65) - LEAD, 'tap', 0.8],
    // Shot 14 (music drops out): Einstein strikes out PULL and chalks BENT SPACE.
    [W(71) - LEAD - 0.12, 'swish', 0.6], [W(71) - LEAD - 0.05, 'chalk', 1, { dur: 0.26 }], [W(71) + 0.2, 'chalk', 0.8, { dur: W(72) + 0.12 - W(71) }],
    // Shot 15: the scissors slide in and snip the string.
    [W(73) + 0.02, 'swish', 0.5], [W(76) - FACE, 'snip', 1, { stop: true }], [W(76) - FACE + 0.05, 'pop', 0.45],
    // Shot 16: the Earth sinks into the grid.
    [W(78) - LEAD - 0.2, 'stretch', 0.9, { dur: 0.26 }], [W(78) - LEAD, 'thud', 0.8],
    // Shot 17: back outside; the bowling ball drops onto the trampoline.
    [W(82) - 0.08, 'whoosh', 0.7], [W(88) - FACE - 0.5, 'swish', 0.7], [W(88) - FACE, 'boing', 1, { stop: true }], [W(88) - FACE, 'thud', 0.6],
    // Shot 18: the apple rolls round and into the dent.
    [W(91) - 0.1, 'roll', 0.9, { dur: W(96) - LEAD - W(91) + 0.1 }], [W(96) - LEAD, 'tap', 0.7], [W(96) - LEAD + 0.05, 'pop', 0.4],
    // Shot 19 and 20: a shrug, and the loop back to the apple.
    [W(98) - LEAD - 0.1, 'swish', 0.5], [W(99) - 0.08, 'whoosh', 0.5], [W(106) - FACE, 'pop', 0.5],
  ];
  const cues = T.map(([t, type, gain, extra]) => ({ t: +t.toFixed(3), type, gain, ...(extra ?? {}) })).sort((a, b) => a.t - b.t);

  // ---------- captions: editorial lockups (Helvetica Bold capitals + Editorial New Italic in brand red) ----------
  const captions = [
    'Everything you know => ^EVERYTHING / *you know*',
    'about this apple => ABOUT THIS / ^*apple*',
    'is wrong. => IS / ^*wrong.*',
    'It probably never hit => IT PROBABLY / *never* ^HIT',
    "Newton's head. => NEWTON'S / ^*head.*",
    'Sixteen sixty-six: => ^1666',
    'plague shuts his university, => *plague* SHUTS / HIS ^UNIVERSITY',
    'so Isaac, twenty-three, => ISAAC, / ^*23*',
    'is stuck on the family farm. => STUCK ON / THE ^*family farm.*',
    'An apple drops beside him. => AN APPLE DROPS / ^*beside him.*',
    'Why straight down? => WHY / ^*straight down?*',
    'Why never sideways? => WHY NEVER / ^*sideways?*',
    'The Earth pulls it, he says, => THE ^EARTH / *pulls it*',
    'and the same pull reaches the Moon, => THE SAME PULL / *reaches the* ^MOON',
    'two hundred and forty thousand miles away. => ^240,000 / *miles away.*',
    'For two hundred and fifty years, => FOR / ^*250 years,*',
    'that was gravity. => THAT WAS / ^GRAVITY',
    'Then Einstein rewrote it. => THEN ^EINSTEIN / *rewrote it.*',
    'There is no pull. => THERE IS / ^*no pull.*',
    'Mass bends space and time, => MASS ^BENDS / *space and time,*',
    'like a bowling ball on a trampoline, => LIKE A *bowling ball* / ON A ^TRAMPOLINE',
    'and the apple just rolls into the dent. => THE APPLE / *rolls into the* ^DENT',
    'So yes: => ^SO *yes:*',
    'everything you know => ^EVERYTHING / *you know*',
    'about this apple => ABOUT THIS / ^*apple*',
    'is wrong. => IS / ^*wrong.*',
  ];
  // The topic hook at the top for the first seconds, as a question.
  const title = { text: 'How was *gravity* found?', start: 0, end: W(8) + 0.4 };
  return { duration: duration + 0.1, words, shots, captions, title, cues, musicDrop: [W(69) - 0.1, W(77)] };
}
