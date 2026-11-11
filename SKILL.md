---
name: 3d-cartoon-animation
description: Make vertical 3D cartoon explainer shorts (30-60 s, 9:16) on any topic. Big-headed toon characters live a story told to "you"; painted faces swap through blinks; the camera never stops; every spoken number lands as a physical object; editorial captions (bold sans capitals + italic serif words in brand red, fonts included); a topic question at the top; a designed sound on every action. Use for history, science, tech, "how it works" and "what happens when" explainers.
version: 1.0.1
---

# 3D Cartoon Animation

Version 1.0.1 (public edition) · method and look approved by the owner on round 1 ("How gravity was found", v3, 26 October 2026). 1.0.1 makes the tools run on any computer; films render the same as in 1.0.0.

**"The owner"** in these files is the person the films are made for: whoever asks for the film and approves it.

**Storyboard first** (the owner's rule, 27 October 2026). Every film, and every new version, starts as a storyboard in the owner's framework. Nothing is voiced, built in detail or rendered until they approve it (skill 4).

This package is a complete, reusable way to make one kind of video: a short, fast, warm 3D cartoon explainer. It works for **any topic**. The worked example is about gravity, but nothing in the method depends on it: the skills say how to find the hook, cast the characters, build the places, turn each number into an object, time every gesture to the voice, design the sound and check every frame, for whatever the next topic is.

## What a finished video is

- **Format:** 1080×1920, 30 fps, 30–60 s. One narration clause = one shot (a new picture about every 1.1–1.5 s). The last line loops into the first frame.
- **Story:** a hook in the first 2 s that opens a question; an early payoff; stakes told to "you"; escalation; a re-hook two-thirds in; a twist shown as one literal picture; a loop ending.
- **Look:** soft toon shading, ink outlines, warm practical lights, rim light, depth of field, light bloom and grain. Skin-tone faces; brand colours (Rouge Noir, Blue Coral, Cognac, White Sand, Anthracite) on clothes, props and sets. Real things look real (the Earth is blue and green).
- **Characters:** ball head, bean body, stick limbs, mitten hands; painted faces with no lip sync; faces swap through a blink just before the stressed word; holds are dead still.
- **Camera:** always moving, creeping between moves, accelerating into 6-frame dissolves on the first word of each sentence.
- **Facts are objects:** every spoken number lands on its frame as a counter, calendar, tape measure, gauge or lit sign.
- **Text:** a topic question at the top for the first 2–3 s ("How was *gravity* found?"), and editorial caption lockups at 70% height (`EVERYTHING` over *you know*).
- **Sound:** a voice (ElevenLabs), an original music bed 18 LU under it, a quiet foley sound on every visible action and an accent on every story beat, mastered to −14 LUFS.

## The pipeline (each step is a skill)

| # | Step | Skill | Output |
|---|---|---|---|
| 1 | Turn the topic into a film idea | [topic-to-film](skills/01-topic-to-film/SKILL.md) | angle, hook, cast, places, number list, the big picture |
| 2 | Write the script | [script-and-retention](skills/02-script-and-retention/SKILL.md) | `script.md` with sources |
| 3 | Record the voice and time every word | [voiceover-and-timing](skills/03-voiceover-and-timing/SKILL.md) | `vo/voice-final.wav`, `vo/words-final.json` |
| 4 | **Storyboard every shot; the owner approves it** | [storyboard-and-shot-plan](skills/04-storyboard-and-shot-plan/SKILL.md) | `storyboard.md`, storyboard stills, the owner's board (`storyboard/<v>/<Title> - storyboard <n>.png` and `.html`) |
| 5 | Set the look | [look-lighting-and-brand](skills/05-look-lighting-and-brand/SKILL.md) | light preset, palette, lens per shot |
| 6 | Build the cast | [characters-and-faces](skills/06-characters-and-faces/SKILL.md) | rigs, outfits, face swaps |
| 7 | Act every clause | [motion-and-acting](skills/07-motion-and-acting/SKILL.md) | pose keys, gags, physics |
| 8 | Move the camera | [camera-and-transitions](skills/08-camera-and-transitions/SKILL.md) | an orbit move per shot |
| 9 | Make the numbers physical | [facts-as-objects](skills/09-facts-as-objects/SKILL.md) | a device per number |
| 10 | Build and dress the places | [sets-and-props](skills/10-sets-and-props/SKILL.md) | places from the kit, dressed |
| 11 | Write the on-screen text | [captions-and-title-hook](skills/11-captions-and-title-hook/SKILL.md) | caption lockups, title question |
| 12 | Design the sound | [sound-design-and-mix](skills/12-sound-design-and-mix/SKILL.md) | cue list, mix, stems |
| 13 | Render and check every frame | [render-and-quality-checks](skills/13-render-and-quality-checks/SKILL.md) | the MP4, the QA record |
| 14 | Review with the owner and learn | [review-rounds-and-learning](skills/14-review-rounds-and-learning/SKILL.md) | feedback, next version, package update |

Do the steps in this order. Steps 4–11 all happen inside one file per film (`film.mjs`), so in practice you plan the storyboard, then build shot by shot, rendering stills as you go.

## Non-negotiables

1. **Storyboard first.** The owner approves the board (skill 4) before the voice is recorded, the shots are built in detail, or anything is rendered.
2. **Copy the technique, never content.** Every character, set, sign, joke and invented brand name is our own. Real historical people are drawn as our own toon characters; never draw a copyrighted character.
3. **Hook first.** The first 2 seconds must open a question; the title question names the topic.
4. **Every number becomes an object**, landing on its spoken word. Never a plain text overlay.
5. **Gestures land 4 frames before their word; faces swap 2 frames before, through a blink.**
6. **Every visible action has a sound; no sound without an action.**
7. **Every frame is checked** (automatic framing check and jump scan, then by eye) before the owner sees it.
8. **Facts are sourced.** When sources disagree, hedge in plain words.
9. **The owner's brand:** skin-tone faces, the five brand colours plus Brand Red, and the included fonts: TeX Gyre Heros Bold + Instrument Serif Italic for captions, Titan One for labels (or licensed Helvetica Bold + Editorial New Italic if the owner adds them; say which). All in [brand/](brand/README.md).

## Quick start for a new topic

1. Copy `templates/new-film/` to `examples/<topic-slug>/`.
2. Fill [the new-topic worksheet](templates/new-topic-worksheet.md) (skill 1) and write the script (skill 2) into `SCRIPT` in `film.mjs`.
3. Build the shots with draft timing and render storyboard stills:
   `node recipe/tools/render.mjs examples/<slug>/film.mjs <outDir> --stills shots --qa`
4. **Storyboard first.**
   - Copy `templates/storyboard.json` to `examples/<slug>/storyboard/v1/storyboard-1.json`, with one panel per shot and its still.
   - Draw the board: `node recipe/tools/storyboard-board.mjs examples/<slug>/storyboard/v1/storyboard-1.json`.
   - Give the owner the board, and revise it (`storyboard-2`, …) until they approve it.
   - Then record the voice:
   `ELEVENLABS_API_KEY=… node recipe/tools/voiceover.mjs examples/<slug>` (after writing `vo/text.txt`).
5. Re-time to the real words (automatic), render the video, then the sound:
   `node recipe/tools/render.mjs examples/<slug>/film.mjs <out> --video --name silent.mp4`
   `python -I recipe/tools/sound.py examples/<slug> <out>/silent.mp4 <out>/shots.json "<out>/<Title>.mp4"`
6. Check: framing report, `node recipe/tools/jump-scan.mjs <video> <out>/shots.json`, `python -I recipe/tools/sfx-levels.py <out> <out>/cue-sheet.txt`, then every frame by eye (skill 13).

## Where things are

| Path | What |
|---|---|
| `skills/` | the 14 step skills |
| `recipe/engine/` | the renderer: `core.mjs` (look, post, captions, compositing, checks), `faces.mjs`, `character.mjs`, `props.mjs`, `props2.mjs`, `kit.mjs` (topic-neutral places and light presets), `places.mjs` / `places2.mjs` (the example's dressed places), `index.html`, `vendor/three` (three.js r186, MIT), `fonts/` |
| `recipe/tools/` | `storyboard-board.mjs` (the owner's storyboard board, as a PNG and a clickable HTML page), `render.mjs`, `voiceover.mjs`, `sound.py`, `jump-scan.mjs`, `sfx-levels.py`, `paths.mjs` (where FFmpeg, Chrome and Playwright are found) |
| `templates/` | `new-film/film.mjs` (a topic-neutral starter that runs on draft timing) and the worksheets |
| `examples/how-gravity-was-found/` | the approved film: source, voice, final video, storyboard, cue sheet, stems, earlier versions |
| `references/` | the reference study, the owner's direction, the engine API, the glitch catalogue, feedback history, engine notes |
| `brand/` | the colours and fonts of the approved film: `palette.json`, `palette.css`, `style-sheet.png` (drawn by `recipe/tools/style-sheet.mjs`) |
| `evaluation/` | delivery checklist, acceptance criteria, known limits |
| `preview/` | `style-card.json`: the style's name, look and format in one card, pointing at the example's poster, film and storyboard |

## Setting up on a new machine

The tools need:
- Node 22+;
- FFmpeg 6+ with ffprobe, on the PATH;
- Python 3.10+ with NumPy;
- a graphics card that Chrome can use for WebGL2.

In the package folder, run `npm install`, `npx playwright install chromium` and `pip install -r requirements.txt`; the README has the full steps. If FFmpeg is elsewhere, set `CARTOON_FFMPEG`. To use another Chrome, set `CARTOON_CHROME` (see `recipe/tools/paths.mjs`).

Films must live inside the package folder (`examples/<slug>/`), because the renderer serves the package to the browser. The voice needs an ElevenLabs API key with text-to-speech permission, passed as `ELEVENLABS_API_KEY` for the one command and never written into a file.
