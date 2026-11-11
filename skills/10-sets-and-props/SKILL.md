---
name: sets-and-props
description: Build the places of a 3D Cartoon Animation film for any topic from the place kit (exterior, interior, studio void, outer space), dress them densely with props in brand colours, and make new props in the style. Use when planning and building each place.
---

# 10 · Sets and props

## Rules
- **Dense and lived-in.** No empty corners, no bare floors, no characters alone in a void (v1's tape measure "floating in black" read as a glitch). Practical lights (lamps, windows, signs), props and invented signs in every place.
- **Say when and where at a glance:** period props, a sign, a calendar, a window view.
- **Build each place once and reuse it** across shots; change camera and props between shots, not the place.
- **Leave clear patches** where action happens (the grass is cleared where the apple lands so it is never hidden).

## Start from the kit (`recipe/engine/kit.mjs`)
| Builder | What you get | Options |
|---|---|---|
| `Kit.exterior({ time, ground, grass, clear })` | sky dome, ground, grass tufts, light preset | `time`: golden / day / night; `clear`: `[[x, z, radius]]` patches without grass |
| `Kit.interior({ wall, wainscot, floor, light, window })` | plank floor, back and left walls, a Rouge Noir wainscot, a window (day or night view) | `window`: 'night', 'day' or null |
| `Kit.studioVoid({ color })` | a curved cyclorama backdrop for objects and diagrams | any brand colour |
| `Kit.outerSpace()` | dark sky, stars, the space light | add `P.earth()`, `P.moon()` |

Each returns `{ scene, lens, reset(t), faceCamera }`. Extend `reset` in your film to put shot-changed state back every frame (visibility of helpers, counter values, door angles).

## The prop library (all original, all in brand colours)
- **Nature:** `appleTree`, `meadow` (instanced grass), `haystack`, `well`, `skyDome`, `ground`, `stars`.
- **Buildings and street:** `manor` (house with lit windows), `fence`, `gateway` (stone college gate with swinging doors and a notice), `stoneWall`, `lampPost`, `cart`.
- **Interior:** `desk`, `lamp` (with a soft point light), `bookshelf`, `chalkboard`, `easelBoard` (rewritable), `plinth` (with a brass plaque), `scissors`.
- **Science and space:** `earth` (realistic colours, clouds, halo, face), `moon` (craters, face), `gridSurface` (a sheet that dents: `setDent(depth, width)`), `trampoline`, `bowlingBall`, `glowString` (a pluckable link: `set(a, b, r)`).
- **Devices:** see skill 9 (calendar, flipCounter, ledPanel, signpost, tapeMeasure).
- **Characters' props:** `apple` (optionally with a face), book (a box in Rouge Noir), held in `handPos`.

The example's dressed places (`places.mjs`, `places2.mjs`: orchard / farm, campus, space2, study2) show how a kit place becomes a story place; reuse them for related topics (history outdoors, a scientist's study) or copy their pattern.

## Making a new prop
```js
export function telescope() {
  const g = new THREE.Group();
  const tube = part(new THREE.CylinderGeometry(0.08, 0.11, 1.2, 20), BRAND.cognac, { px: 2 }); tube.rotation.z = 1.1; tube.position.y = 1.2; g.add(tube);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), glow('#bfe3ff', 1.2)); …
  return { group: g };
}
```
- Shapes: simple primitives with `part()` (toon material plus ink outline). Rounded, slightly chunky proportions.
- Colours: brand colours or their tints; real things in real colours.
- Text on props: `labelTexture(text, { bg, fg, size })` in Titan One.
- Glowing parts: `glow(color, strength)` and keep them modest.
- Moving parts: put them on a pivot `Group` and give the prop a `set(...)` driven by shot progress.
- Helpers that are not always shown (strings, scissors, overlays) start **hidden** and are hidden again in `reset` (v1 drew an unpositioned string as a giant cylinder).

## Checks
- Every place has at least three readable props and one practical light.
- No surfaces share a plane (flicker); printed parts have blank backs.
- Action areas are clear of grass, papers and clutter (v2 had papers poking through the bending grid).
