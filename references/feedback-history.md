# Feedback history

## Round 1: "How gravity was found" (26 October 2026)

**Brief (owner):** a short 30-second animation on the famous apple falling from the tree, Einstein, how gravity was found. Skin tones; brand colours in the clothes and the environment.

### v1 (18 shots, 30.2 s)
- Script opened "You're sitting under an apple tree…" and told the facts in order.
- Captions: Titan One, white with a dark outline.
- **Owner:** "There's no script of storytelling as to what will keep the viewer hooked, and then there are glitches in the visuals. Please watch the video for yourself, notice every bit. The font combination should be Helvetica + Editorial New; use our brand colours for highlights."
- **Changed:** a hook-first script with seven beats; a new voice; 16 glitches fixed (glitch catalogue 1–16); the framing check and jump scan added; brand fonts with stand-ins; caption pills in brand colours.

### v2 (20 shots, 30.3 s)
- "Everything you know about this apple is wrong" script; brand-colour pills with Editorial New italic key words; framing fixed.
- The frame-by-frame review found and fixed 6 more glitches (catalogue 17–22) before delivery.
- **Owner:** "I like this style." Four changes: (1) the captions should follow the editorial structure of the owner's books reel, not TikTok-style black-and-white; (2) Instagram loves a short topic question at the top ("how gravity was found"); (3) a visual title hook at the top for the first couple of seconds; (4) the Earth doesn't look like Earth. Also: more slight sound effects on every action, using earshot.
- **Changed:** editorial caption lockups; the title hook; a realistic Earth; a rebuilt sound engine (24 effects, two tiers, measured levels, stop-downs) after earshot's motion-SFX notes. 80 effects in the film.

### v3 (20 shots, 30.3 s): approved
- **Owner:** "I really like this. I really liked this video."
- **Next:** this package (1.0.0), written so any topic can be made the same way.

## 1.0.1: public edition (11 November 2026)
- The tools find FFmpeg on the PATH and use Playwright's own Chromium, with the right GPU setting for Windows, macOS or Linux; the contact sheet labels use the package's own font.
- Videos are now standard HD colour (BT.709, limited range, tagged). 1.0.0 wrote the browser's full-range JPEG colour, which some players and apps show wrongly.
- Re-made the approved film from this edition: every frame within 1% of v3's colours (mean difference 1.9 of 255 levels, worst frame 2.3, PSNR at least 39 dB), the same 80 effects and −14.2 LUFS. The jump scan gives v3's six flags plus the calendar page flip at 4.07 s, a gag sitting on the threshold.
- A `brand/` kit: the colours and fonts of the approved film in one place (hex codes, `palette.json`, `palette.css`, a style sheet drawn by `recipe/tools/style-sheet.mjs`), with clear notes that the fonts are included.
- Private notes and paths removed; the tool for transcribing reference videos left out (it needed a local speech runtime that isn't included).
