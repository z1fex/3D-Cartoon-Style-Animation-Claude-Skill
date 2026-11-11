# Known limits (1.0.1)

What the style cannot do yet, and what would fix it.

| Limit | Effect | Path forward |
|---|---|---|
| Faces are drawn in code | simpler than the reference's painted faces | an original painted face sheet (owner-approved art, or an image model) loaded as decal textures; `faceDecal` already takes textures |
| Nobody walks | acting is poses, gestures and camera; no walk cycles | add a walk cycle to `character.mjs` using the reference's numbers (a step every 5–6 frames, a 7% bob, planted feet) |
| Hands don't grip | held props are placed at `handPos`, not wrapped by fingers | mitten hands make this acceptable; add a "hold" pose per prop if needed |
| Sets are lighter than the reference's | fewer small details per place | keep adding props to `props2.mjs`; every new film adds to the library |
| Music is synthesised | a pleasant marimba bed, not a produced track | the owner can supply a licensed track; the mix handles it |
| Effects are synthesised | they read well as cartoon foley; not recordings | earshot's fitted-recording approach or a licensed library could replace individual types |
| Captions use free look-alikes | the included TeX Gyre Heros and Instrument Serif stand in for Helvetica and Editorial New, which are paid fonts | if you own them, drop the files into `recipe/engine/fonts/brand/` |
| Tested on Windows only | the tools pick the right GPU setting for Windows, macOS and Linux, but only Windows 11 has been tried | if a render is black or very slow, set `CARTOON_CHROME` to a desktop Chrome, or try another `--use-angle` value in `recipe/tools/paths.mjs` |
| Length | proven at 30 s | 50–60 s needs no new method, only more shots |
