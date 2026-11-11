---
name: characters-and-faces
description: Build original 3D cartoon characters for any topic (ball head, bean body, stick limbs, mitten hands) with skin tones, brand-colour outfits, hair, hats, glasses and beards, and act them with painted faces that swap through a blink. Use when casting a film.
---

# 6 · Characters and faces

## The body
`makeCharacter(spec)` in `recipe/engine/character.mjs` builds a rig: head radius 0.42, body 0.8 tall, legs 0.52, arms 0.30 + 0.28. The proportions are the style: a big ball head, a bean body split into a top and bottom colour, thin Anthracite stick limbs, mitten hands in the skin colour, rounded Cognac shoes.

```js
const host = makeCharacter({
  name: 'host', skin: SKIN.tan,
  top: BRAND.blueCoral, bottom: BRAND.anthracite, split: 0.32, width: 1.0,
  hair: 'curly', hairColor: '#2a1d18',
  hat: null, glasses: true, beard: false,
  face: { browColor: BRAND.anthracite, browThick: 3.4, mustache: null },
  extras: torso => { /* add a cravat, buttons, a badge, a tool belt… */ },
});
host.root.position.set(x, 0, z); place.scene.add(host.root);
```

| Option | Values |
|---|---|
| `skin` | `SKIN.light / fair / medium / tan / brown / deep`, or any hex. Mix across the cast. |
| `top`, `bottom`, `split`, `width` | the bean's two colours, where they meet (0–1 of height), and a width factor (1.06 for a stockier build) |
| `hair` | `short` (or `cap`), `bob`, `bun`, `ponytail`, `curly`, `spiky`, `bald`, and two period wigs: `newton` (long curls) and `einstein` (wild white hair with a self-glow) |
| `hat` / `hatColor` | `cap`, `tophat` (with `hatBand`), `helmet` (round shell), `hardhat`, `beret`, `crown` |
| `glasses` | `true` or a frame colour: round frames over the painted eyes |
| `beard` | `true` (hair colour) or a colour |
| `face` | `{ browColor, browThick, mustache }`: brow colour and weight, an optional painted mustache colour |
| `extras(torso)` | add costume parts with `part(geometry, color)`: cravats, collars, buttons, badges, tools |

**Designing a character for a new topic:** pick a silhouette first (hair or hat shape is the strongest cue at phone size), then one brand colour for the top, then a skin tone. Historical people are drawn as our own toons: period hair and clothes are enough (Newton's curled wig and Rouge Noir coat; Einstein's wild white hair, mustache and Blue Coral sweater). Never copy a copyrighted character.

**Objects with faces** (apples, planets, molecules, machines): give them `faceDecal(radius, { skin: <body colour> })` from faces.mjs, set the lids' colour to the body colour, and add the object's group to the place's `faceCamera` list so it turns to the camera.

## Faces
Flat painted decals on the front of the head (`faceDecal`): brows, eyes with pupils and highlights, a mouth, **no nose**, all from one family of shapes. No lip sync; the face does the acting.

Expressions (`EXPRESSIONS` in faces.mjs): `neutral, content, sleepy, surprised, shocked, curious, thinking, eureka, delighted, smug, knowing, confused, worried` (with a sweat drop), `proud` (blush), `no, wheee, dizzy` (spiral eyes), `lookDown`. To add one, copy an entry and change brows `[inner, outer]` (degrees), `lid` (0 open … 1 closed), `look` (pupil offset), `eye` and `pupil` scale, and `mouth` (`flat, smile, smirk, side, wavy, o, grin, shout`).

## Face swaps (the reference's rule, measured)
- Swap only **through a blink**: one half-closed frame, one closed frame, then the new face.
- The new face appears **2 frames before the stressed word** (`W(i) - FACE`).
- Never morph between expressions.
- The main character gets a new face about every 1.2 s; objects swap on their story beat (the apple goes `smug → shocked` on "wrong").
- Natural blinks during long holds: pass a `blinks` list of times.

```js
rig.faceAt(t, [[0, 'curious'], [W(17) - FACE, 'smug']], [0.75, 6.2]);   // swaps, then natural blinks
objectFace.set('shocked');                                              // instant set for objects
```

## Hands and held props
`rig.handPos('L' | 'R' | 'both')` returns the world position of a hand after the current pose; put held props there every frame (the book in Newton's hands, the bowling ball before Einstein drops it). `rig.headPos()` gives the head centre for framing.

## Checks
- At phone size, can you tell every character apart by silhouette alone?
- Lids match the skin or body colour (no see-through blinks).
- Faces face the camera in every shot where they act.
