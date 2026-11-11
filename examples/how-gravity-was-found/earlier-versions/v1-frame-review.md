# v1 review: every frame checked (26 Oct 2026)

**Owner's notes:**
- No storytelling that keeps a viewer hooked.
- Visual glitches.
- Use Helvetica + Editorial New, with brand colours for highlights.

**How it was checked:**
- All 906 frames, one sheet per second (30 frames each).
- An automatic frame-to-frame jump scan, which flags sudden changes away from shot changes.

## Story problems

1. **No hook.** The first line, "You're sitting under an apple tree", has no tension and asks no question, so there is no reason to stay past second 2.
2. **No open loop.** Nothing is promised early that the ending pays off.
3. **The twist arrives late and generic.** "But here's the weird part" comes at 18 s, and nothing before it builds tension.
4. **Facts are listed, not dramatised.** There are no stakes: why was Newton at the farm, and why does it matter?
5. **Shots linger.** The calendar holds for 3.5 s and the counter for 2.3 s. The reference averages 1.1 s a picture.

## Visual glitches (frame numbers at 30 fps)

| # | Frames | Glitch | Cause | Fix |
|---|---|---|---|---|
| 1 | 106–109, 551–560 | Calendar pages show **mirrored numbers** while flipping | The flipping page was double-sided with the same texture | Blank paper back face |
| 2 | 515–665 | **Study window flickers** every frame (Moon and stars blink) | The window glass and its frame were in the same plane (z-fighting) | Separate the planes, and add a "no coplanar faces" rule |
| 3 | 217–257 | **Blown-out white blob** at the right edge | The lit signpost board glowed too bright, and bloom spread it | Softer sign glow, higher bloom threshold |
| 4 | 405–475 | **Bright diagonal streak** across the bottom | The Earth–Moon string passed right by the camera | Keep strings away from the lens; the tape measure replaces this shot |
| 5 | 260–292 | **Pale halo** floating over the apple | The leaf was thin, pale and detached from the stem | A green leaf attached to the stem |
| 6 | 0–43, 830–899 | **White specks floating** above the grass | Flower balls hovering above the ground | Removed |
| 7 | 296–315, 668–715 | **Eye whites glow** on the Earth faces | Bright sun plus bloom on pure-white eyes | Sand-white eyes, lower space sun, higher bloom threshold |
| 8 | 73–96, 830–899 | The landed apple is **half hidden in the grass**, its face unreadable | It landed in tall grass at the frame edge | It lands on a clear patch, in frame |
| 9 | 718–769 | The **bowling ball appears floating in mid-air**, and **Einstein faces away** | The ball's start point was not in his hands; he was turned side-on | The ball starts in his hands; he is turned three-quarters to camera |
| 10 | 784–795 | The rolling **apple leaves the frame** for 10 frames | The spiral was wider than the shot | Smaller spiral, and the camera holds the dent |
| 11 | 637–665 | **The snip can't be seen** | Tiny scissors behind a tiny desk model | Close-up of a larger model, scissors in his hand |
| 12 | 668–715 | **Papers poke through** the bending grid | The grid dent dipped through the papers on the desk | Papers cleared in that shot |
| 13 | 174–196 | The **AGE label is cut off** | Its label sank into the crate | Counter raised |
| 14 | 197–257, 365–380 | **Subjects cut by the frame edge** (Newton, the signpost, the Moon, the Earth) | Framing checked on one still only | An automatic per-frame framing check |
| 15 | 405–512 | **Empty black frames** (a counter alone in the void, two dots in space) | No set dressing | A big Earth horizon, stars and a tape measure |
| 16 | throughout | Shoes read as black holes | Anthracite shoes in shadow | Cognac leather shoes |

## Status in v2

All 16 glitches above are fixed in `v2/out/How gravity was found - v2.mp4`, and the new story is in `script-v2.md`.

**Final checks:**
- **Framing check:** 2 flags left, both intended. One is the apple falling in from above the frame; the other is 1 frame of the rolling apple at the trampoline edge.
- **Jump scan:** 2 flags left, both intended: the sideways slide and the snip.
- **Every frame of v2 was reviewed by eye.** That review found 6 more problems, all now fixed:
  - the dark hook shot;
  - characters cut at the frame edge;
  - the clipped CLOSED sign;
  - the grid dent sinking through the desk;
  - the apple passing into the bowling ball;
  - a string glowing again after the snip.

## New engine checks (kept in the skill)

- **Framing check:** every frame, each shot's named subjects must sit inside the safe area and above the caption band.
- **Jump scan:** sudden frame-to-frame changes away from a shot change are flagged.
- **Rules:**
  - Double-sided printed surfaces need a blank back.
  - No two visible surfaces in the same plane.
  - Nothing glows brighter than a practical light.
