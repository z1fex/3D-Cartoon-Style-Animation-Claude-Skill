---
name: render-and-quality-checks
description: Render a 3D Cartoon Animation film frame-exactly on the GPU, then prove it is clean - the automatic framing check and jump scan on every frame, the sound level check, and a by-eye review of every frame against the glitch catalogue - before the owner sees it. Use for every render that leaves this machine.
---

# 13 · Render and quality checks

Owner's rule (round 1): "watch the video for yourself, notice every bit." v1 went out with 16 glitches the owner could see. Since then nothing is delivered until every frame has been checked.

## Rendering
`recipe/tools/render.mjs` serves the package, opens the engine page (`recipe/engine/index.html?film=…`) in a headless Chrome on the GPU (Playwright's Chromium by default; Direct3D 11 through ANGLE on Windows, Metal on macOS), calls `window.renderFrame(t)` for each frame and pipes the JPEG frames into FFmpeg (H.264, CRF 17, yuv420p, faststart). About 40–75 ms a frame at 1080×1920: a 30 s film renders in about 40–70 s.

```
node recipe/tools/render.mjs <film.mjs> <outDir> --stills shots --qa      # one still per shot + contact sheet + framing check
node recipe/tools/render.mjs <film.mjs> <outDir> --stills 1.2,4.5,9.0     # stills at chosen times
node recipe/tools/render.mjs <film.mjs> <outDir> --video --name silent.mp4 [--from s --to s]
node recipe/tools/render.mjs <film.mjs> <outDir> --stills shots --no-captions
```
Every run prints the caption fonts in use (brand or stand-in) and writes `shots.json` (shot names and starts, sound cues, the music drop) and `framing-report.json`.

## Automatic check 1: framing (every frame)
Each shot lists `subjects()` as `[name, object or position function, world radius]`. After each rendered frame the engine projects them and flags:
- **cut by frame**: any part of the subject (its radius) outside the frame;
- **in caption band**: the subject's centre between 64.5% and 77% height;
- **behind camera**.
Expected flags are allowed only when they are the action (an apple falling in from above). Everything else is fixed by moving the camera, not the subject.

## Automatic check 2: jump scan (every frame)
`node recipe/tools/jump-scan.mjs <video> <outDir>/shots.json` measures the change between consecutive frames and flags any jump more than 3× its neighbourhood away from a shot change. Expected flags: caption changes (big lockups), sudden gags (a slide, a snip). Anything else is a pop, flicker or teleport to fix.

## Automatic check 3: sound levels
`python -I recipe/tools/sfx-levels.py <outDir> <outDir>/cue-sheet.txt` reports every effect against the voice and music around it. Targets: accents median about −9 dB, foley about −15 dB; nothing above about −2 dB except in a pause.

## By-eye review (every frame)
Make one sheet per second with every frame numbered, and read them all:
```
ffmpeg -i film.mp4 -vf "scale=162:288,drawtext=text='%{n}':x=3:y=3:fontsize=14:fontcolor=yellow:box=1,tile=10x3" -fps_mode vfr sec_%02d.png
```
Look for everything in [the glitch catalogue](../../references/glitch-catalogue.md), especially:
mirrored or flickering text; glows brighter than a practical light; objects passing through each other or floating; props popping in or out; characters or devices cut by the frame; faces in the caption band; dark or empty frames; helpers that switch back on (a snipped string glowing again); a number shown before its shot; a caption that does not match the voice.

Then watch strips at full rate (one frame per tile) for every gag, fall, face swap and dissolve.

## Delivery
- 1080×1920, 30 fps, H.264 in standard HD colour (BT.709, limited range) + AAC 48 kHz stereo, −14 LUFS, faststart.
- In the output folder: the MP4, `storyboard.png` (one still per shot), `poster.png` (a frame from the hook, with the title), `cue-sheet.txt`, the stems, `shots.json`, `framing-report.json`.
- Tell the owner honestly what is still weaker than the reference.

See [the delivery checklist](../../evaluation/delivery-checklist.md).
