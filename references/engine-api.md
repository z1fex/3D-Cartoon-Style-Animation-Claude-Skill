# Engine reference (`recipe/engine/`)

The engine is a set of ES modules loaded by `index.html` in a headless browser (three.js r186 via an import map). A film is one module that exports `async build()` and returns `{ duration, words, shots, captions?, title?, cues?, musicDrop? }`. Every frame is a pure function of time.

## A film module
```js
export async function build() {
  return {
    duration,                 // seconds
    words,                    // [{ text, start, end }] from vo/words-final.json (or draft timing)
    shots: [{ name, w, set, start, end, transition?: 'cut', subjects?: () => [[name, objOrFn, radius]], apply(t, cam, shot) { …; return { focus, fov, aperture?, maxblur?, bloom? } } }],
    captions: ['spoken words => LOCKUP / *italic* ^BIG', …],
    title: { text: 'How was *gravity* found?', start: 0, end: 2.4 },
    cues: [{ t, type, gain, dur?, long?, stop? }],
    musicDrop: [start, end],  // optional: the bed drops to the pad alone between these times
  };
}
```
`renderFilm` picks the shot whose start is the latest ≤ t, cross-dissolves over 6 frames from the previous shot (both still animating), then draws the caption and the title. Before each shot's `apply`, the shot's place `reset(t)` runs; after it, objects in the place's `faceCamera` list turn to the camera.

## core.mjs
| Export | What |
|---|---|
| `FPS` (30), `W` × `H` (1080 × 1920), `F` (1/30) | the format |
| `BRAND`, `tint(hex, k, toward)`, `ENV` | the palette, colour mixing, lifted environment tints |
| `clamp01`, `mix`, `ease.{linear,inOut,out,in,back}`, `prog(t, a, b, ease)`, `travel(u)`, `v3`, `rand(seed)` | time and maths helpers |
| `toon(color, opts)`, `glow(color, strength)`, `ink(mesh, px, color)`, `part(geometry, color, { px, cast, receive, opts })`, `canvasTexture(w, h, draw)`, `RIM` | materials, outlines, textures, the rim light |
| `Studio` | the renderer, post chain (render → bokeh → bloom → grade → output) and the compositing canvas |
| `renderFilm(studio, film, t, captions)` | composes one frame |
| `framing(studio, shot)` | projects the shot's subjects; flags `cut by frame`, `in caption band`, `behind camera` |
| `planCaptions(words, lines)`, `drawCaption(ctx, captions, t)`, `drawTitle(ctx, title, t)`, `captionChunks(words)`, `CAPTION_FONT`, `HIGHLIGHT` | the editorial captions and title hook |

## faces.mjs
`EXPRESSIONS` (18 presets), `drawFace(ctx, expression, style)`, `faceDecal(radius, { skin, browColor, browThick, mustache })` → `{ mesh, set(name, blink) }`, `faceAt(t, swaps, blinks)` → `[name, blink]` (the blink-swap rule).

## character.mjs
`makeCharacter(spec)` → `{ root, hips, torso, neck, head, face, arms, legs, pose(p), animate(t, keys, { dur, lag }), faceAt(t, swaps, blinks), handPos(side), headPos() }`. `POSES` (the pose library), `OUTFITS` (newton, einstein), `SKIN` (six skin tones), `HEAD_R`, `BODY_H`, `LEG_L`. Spec options in skill 6.

## kit.mjs (topic-neutral places)
`LIGHT` presets (golden, day, night, space, studio), `lightRig(scene, preset)`, `exterior(opts)`, `interior(opts)`, `studioVoid(opts)`, `outerSpace(opts)`.

## props.mjs
Environment: `skyDome, ground, meadow, stars`. Orchard and buildings: `apple, appleTree, fence, manor`. Devices: `labelTexture, calendar, flipCounter, signpost, ledPanel, glowString`. Space: `earth, moon`. Spacetime: `gridSurface, trampoline, bowlingBall`. Study: `desk, lamp, bookshelf, chalkboard, scissors`.

## props2.mjs
`haystack, cart, well, gateway, stoneWall, lampPost, tapeMeasure, easelBoard, plinth`.

## places.mjs, places2.mjs (the example's dressed places)
`orchard, space, study` and `farm, campus, space2, study2`. They show how kit-style places are dressed for a story; reuse or copy them.

## Tools (`recipe/tools/`)
| Tool | Use |
|---|---|
| `render.mjs <film> <out> [--stills shots|t1,t2] [--video --name f.mp4 --from --to] [--qa] [--no-captions]` | frame-exact GPU render, stills, contact sheet, framing report |
| `voiceover.mjs <filmDir> [voiceId]` (env `ELEVENLABS_API_KEY`, `VO_SPEED`) | ElevenLabs voice with timestamps, tightened pauses, `words.json` |
| `sound.py <filmDir> <silent.mp4> <shots.json> <out.mp4> [bpm]` | music bed, effects, measured mix, master, mux, stems, cue sheet |
| `jump-scan.mjs <video> <shots.json>` | frame-to-frame jump check |
| `sfx-levels.py <outDir> <cue-sheet.txt>` | effect levels against the voice |
| `paths.mjs` | where FFmpeg, Chrome and Playwright are found (env `CARTOON_FFMPEG`, `CARTOON_CHROME`, `CARTOON_PLAYWRIGHT`) |
