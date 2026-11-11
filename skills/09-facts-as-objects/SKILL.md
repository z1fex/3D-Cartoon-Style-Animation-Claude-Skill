---
name: facts-as-objects
description: Turn every spoken number in a 3D Cartoon Animation film into an in-world device that lands on its exact word - flip counters, calendars, tape measures, LED panels, signs, gauges - and choose the right device for each kind of number. Use for every number in the script.
---

# 9 · Facts are objects

The reference's sixth rule: a spoken number is never a text overlay. It is a physical thing in the world that lands on its exact frame. The caption also shows the numeral (skill 11), so the number is seen twice and heard once.

## Choosing a device
| Kind of number | Device | Engine |
|---|---|---|
| a year or date | a calendar whose page flips (or flutters through many years) | `P.calendar({ header })` → `set(before, after, k)` |
| an age, a count, a small total | a split-flap counter with a label | `P.flipCounter({ cells, label })` → `set(text)` |
| a big number (thousands, millions) | an LED panel that counts up | `P.ledPanel({ w, h })` → `set(text)` |
| a distance | a tape measure that runs out between the two places, its counter rolling | `P2.tapeMeasure({ size })` → `set(a, b, k, text)` |
| a span of time | a counter beside the thing that lasted (a statue on a plinth) | `flipCounter` + `P2.plinth(label)` |
| a choice among options | signpost boards that light up | `P.signpost([[label, angle, y], …])` → `light(i, k)` |
| a formula or rule | a chalkboard or easel line, struck out and rewritten | `P.chalkboard(paint)`, `P2.easelBoard()` → `draw(key, painter)` |
| a speed, a pressure, a share | a gauge whose needle overshoots and settles (build from `part()`; see "New devices") | — |
| a time of day, a duration | clock hands sweeping forward (build from `part()`) | — |

## Timing
- Counting devices roll with `ease.out` from the start of the number's words to the last word of the number: `k = prog(t, W(first) - 0.05, W(last) - LEAD, ease.out)`, and show the exact final value from `k = 1`.
- A calendar flip takes about 0.24 s and lands at `W(i) - LEAD`; a flutter through many years steps every 75 ms and lands on the word.
- The device's final state must be correct **before** its own shot too: each place's `reset(t)` sets time-correct values (v1 showed 1666 before the narration reached it).
- Sound: a tick on every visible change of the counter (at least 45–70 ms apart), and an accent when it lands (a ding, a tap). Skill 12 generates the ticks from the same progress function.

## Making devices read
- Big, front-facing, inside the frame, above the caption band. Inserts can fill a third of the frame.
- Labels in Titan One on brand-colour plates (`labelTexture`).
- Flipping pages need a blank back face (v1 showed mirrored numbers). No two visible surfaces in one plane (the v1 window flickered).
- LED glow stays modest (`shadowBlur` 10–12 on the digits, colour ×1.15): above that it blooms into a blob.

## New devices
Build from `part(geometry, color, { px })` and `canvasTexture(w, h, draw)`, and give every device the same shape of API: a `group` to place, and a `set(...)` that is a pure function of the shot's progress (no stored state). Cache textures by their text so a counter costs nothing per frame (see `flipCounter`). Add the device to `props2.mjs` (or a new `props3.mjs`) and document it here.

## Example (gravity)
1666 → the calendar on the tree flips 1665 → 1666. 23 → AGE counter rolls 00 → 23. 240,000 miles → a tape measure from Earth to Moon, its window counting to 240,000. 250 years → a YEARS counter beside a marble Newton on a "GRAVITY = PULL" plinth. 1915 → the desk calendar flutters from 1666 to 1915.
