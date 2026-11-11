# Production notes: how this style is built (learned in round 1)

## Tools and why

- **3D:** three.js r186, vendored in `recipe/engine/vendor`, MIT licence.
  - Each frame is a pure function of time, `window.renderFrame(t)`.
  - `recipe/tools/render.mjs` drives a headless Chrome on the GPU (Playwright's Chromium by default; Direct3D 11 through ANGLE on Windows) and pipes frames into FFmpeg.
  - Speed: about 40–75 ms a frame at 1080×1920, so a 30 s short renders in about 40–70 s.
  - Flat motion-graphics tools (HTML/GSAP compositions) were not used: this style is full 3D, and a frame-exact three.js page is simpler and faster.
- **Voice:** ElevenLabs `text-to-speech/{voice}/with-timestamps` gives per-character times, so word timing needs no transcription.
  - `recipe/tools/voiceover.mjs` tightens the pauses to the style's numbers.
  - If the result is still long, `atempo` (pitch kept) brings it to length; 1.09 sounded natural.
  - A key restricted to speech only is enough (it cannot list voices, so pass the voice ID). Never store it in project files.
- **Music and effects:** `recipe/tools/sound.py`, Python + NumPy, no samples.
  - It reads the film's cues, keeps the most important ones (priority × gain, at most 20 a minute and 0.35 s apart), levels the stems by measured LUFS and masters to −14 with two-pass loudnorm.
- **Captions:** v1 used Titan One (OFL) in White Sand with an Anthracite outline, 1–3 words at a time. From v3 they are editorial lockups in Helvetica Bold and Editorial New Italic (see "Captions (v3)" below and skill 11). Titan One is still used for labels on props.

## Engine pieces

| File | What it holds |
|---|---|
| `core.mjs` | Soft toon ramp, ink outlines (screen-constant back-face hull), rim light, bloom, depth of field, grade, grain, vignette, dissolves, captions |
| `faces.mjs` | Painted face decals and 18 expressions, swapped through a blink |
| `character.mjs` | Ball-bean-stick rig, poses, follow-through |
| `props.mjs`, `props2.mjs` | Props and "facts are objects" devices |
| `kit.mjs` | Topic-neutral places and light presets |
| `places.mjs`, `places2.mjs` | The example's dressed places with light rigs |

## Rules learned (keep)

- **Framing in 9:16:**
  - A vertical fov of 38–40° gives only about 23° horizontally, which is too tight. Use 44–50°.
  - Frame with an orbit (subject, distance, yaw, pitch). Place the subject about 43% from the top, so faces stay above the caption band.
- **The camera** must never enter a character. One shot went black because the camera was inside a head.
- **Shot code order:** set the camera first, then anything that faces it. Objects with faces (apples, planets) are listed in `faceCamera` and turn toward the camera automatically.
- **Pure state:** every shot sets all the state it uses, and each place's `reset(t)` clears anything a shot changes. Facts must not show their final value before their own shot: calendars and counters read time-correct values in `reset`.
- **Brand colours:**
  - Use them at full strength on clothes and hero props.
  - Environments need lifted tints of the same hues (`ENV` in `core.mjs`). Rouge Noir and Blue Coral are too dark for grass and leaves.
  - Under warm light Blue Coral goes near black, so lift it for clothes.
- **Lights:**
  - No point-light shadows: they band and stair-step on toon heads.
  - Keep practical lamps a soft, less saturated warm colour.
  - Give white hair a small self-glow.
  - Keep bloom modest (0.3–0.45), or eye whites glow.
- **Toon shading:** a 6-step linear ramp reads soft. A 3-step nearest ramp drew hard arcs across heads.
- **Nothing large at the origin by default:** an unpositioned glow string rendered as a giant cylinder. Hide helpers until a shot sets them.
- **Helpers that re-enable themselves:** `glowString.set()` switches the string back on, so set the visibility after calling `set()`. A missed snip in v2 was caused by this.
- **Framing check:** each shot lists `subjects()` as `[name, object or position function, world radius]`. `render.mjs --qa`, and every video render, write `framing-report.json` and print any subject cut by the frame or sitting in the caption band.
- **Jump scan:** a frame-to-frame difference scan catches pops, flicker and teleports. Expected flags are the sudden gags, such as a snip or a slide.
- **Caption fonts:** `engine/fonts/brand/` (Helvetica Bold, Editorial New Italic) is used first, then the stand-ins in `fonts/standin/`. Every render prints which fonts it used.
- **Printed props:** a flipping page needs a blank back face, and no two visible surfaces may share a plane.
- **Scissors and other cutting gags:** the blades must cross the line being cut, and the handles must stay clear of faces behind them.
- **Sound design (v3):** `sound.py` has 24 designed effects, all synthesised in code with no samples. The design follows earshot's documented motion-SFX techniques (github.com/Leonxlnx/earshot, MIT: `docs/motion-sfx-techniques.md`, `docs/SFX.md`), but the code is our own. Installing earshot itself was blocked by the session's safety rules, so none of its code runs here.
  - **Tiers:** accents (`ACCENT`) are capped at about 20 a minute, and foley goes on every action.
  - **Cues:** films list them as `{t, type, gain, dur?, long?, stop?}`. `stop` dips the music before an accent.
  - **Levels are measured, not fixed:** each effect's loudest 400 ms is set relative to the median 400 ms speech level (`REL`). On round 1 v3 that gives a median of −9 dB for accents and −15 dB for foley against the voice.
  - **Check script:** `recipe/tools/sfx-levels.py` re-measures every effect against the voice and music around it.
- **Captions (v3):** lockups are written as `spoken words => DISPLAY / *serif* ^BIG` (see `planCaptions` in `core.mjs`). Each display word appears on the spoken word it names. Numbers and words that don't match a spoken word appear in reading order.
- **Real physics where it reads well:** falls use g = 9.8 m/s², so a 2.8 m drop takes 0.76 s, timed to land 2 frames before its word.
