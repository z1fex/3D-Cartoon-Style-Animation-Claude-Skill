---
name: captions-and-title-hook
description: Write and lay out the on-screen text of a 3D Cartoon Animation film - the topic question at the top for the first 2-3 seconds, and editorial caption lockups (bold sans capitals + italic serif words in brand red, stacked, mixed sizes, word-by-word reveal; the fonts are included). Use after the script and voice timings exist.
---

# 11 · Captions and the title hook

Owner's direction (round 1): no TikTok-style black-and-white captions. The text is **editorial**, like a magazine spread: `THEY ^ALL` in big white capitals with *read* and *books* in a red serif italic tucked underneath. And a topic question at the top for the first seconds, because the Instagram algorithm favours a clear "what is this about" hook.

## The topic question (title hook)
- A short question naming the topic: "How was *gravity* found?", "Why is the sky *blue?*", "How fast is a *sneeze?*".
- The bold sans in White Sand at 15% height (76 px), with the key word in the italic serif on a Rouge Noir rounded box.
- On screen from the **first frame** (it is in the cover frame), held for the hook line (2–3 s), fading out over 8 frames.
- Punctuation that follows the highlighted word goes inside the asterisks (`*sneeze?*`), because the box has padding.
- In `film.mjs`: `const title = { text: 'How was *gravity* found?', start: 0, end: W(8) + 0.4 };` and return it with the film.

## Caption lockups
One card per clause (or per half of a long clause), not word-by-word subtitles. In `film.mjs` the `captions` list pairs each spoken phrase with its lockup:

```js
const captions = [
  'Everything you know => ^EVERYTHING / *you know*',
  'plague shuts his university, => *plague* SHUTS / HIS ^UNIVERSITY',
  'two hundred and forty thousand miles away. => ^240,000 / *miles away.*',
];
```

**Syntax** (parsed by `planCaptions` in core.mjs):
- Left of `=>`: the exact spoken words (checked against the voice timings; every word must be covered once, in order).
- Right of `=>`: the lockup. ` / ` starts a new row. Plain words are **bold sans capitals** in White Sand. `*words*` are the **italic serif** in brand red (`#E0394F`). A leading `^` makes a token **big** (1.62×).
- With no `=>`, the spoken words are shown as one row of capitals.

**Writing good lockups:**
- Make the **one word that carries the meaning big**: the claim, the number, the object (`^EVERYTHING`, `^240,000`, `^TRAMPOLINE`).
- Put the **emotional or surprising word in italic red** (*wrong.*, *never*, *no pull.*, *family farm.*).
- Two rows, short over long or long over short; at most about 4 tokens.
- Numbers as numerals (`^1666`, `^23`, `^250 years`); you may drop filler words ("he says") but never change meaning.

**Layout** (automatic): rows centred and staggered (first row a little left, second a little right), the italic row tucked up so it slightly overlaps the capitals, the whole card centred at 70% height and scaled to fit 88% of the width with 5% margins. Each token pops in (4 frames, a small overshoot) on the spoken word it names; tokens that are not spoken words (numerals) appear in reading order. A soft two-pass shadow separates the text from any background: no outline and no pills.

## Fonts
- **Included, used by default** (the approved film uses them): **TeX Gyre Heros Bold** for the bold sans (GUST Font License) and **Instrument Serif Italic** for the italic serif (SIL OFL). Labels on props use **Titan One** (SIL OFL). All are in `recipe/engine/fonts/`, with their licences; see [brand/](../../brand/README.md).
- **Optional:** the lockups were designed around **Helvetica Bold** and **Editorial New Italic**, which are paid fonts (Monotype; Pangram Pangram, whose free trial is personal-use only). If the owner has licensed files, put them in `recipe/engine/fonts/brand/` (`Helvetica-Bold.otf|ttf`, `EditorialNew-Italic.otf|ttf`) and the engine uses them instead.
- Every render log says which fonts it used. Never call the included fonts Helvetica or Editorial New.

## Checks
- The title is visible in frame 0 and gone by the end of the hook.
- Every caption is readable at phone size on its background (red on red scenes: check the shadow does its job).
- No face sits in the caption band (64–77%); the framing check enforces it.
