---
name: look-lighting-and-brand
description: The "Cinema" toon look of the 3D Cartoon Animation style (soft banded shading, ink outlines, rim light, depth of field, bloom, grade, grain), the light presets, and how the owner's brand palette is used on clothes, props, sets and real-world objects. Use when building any place, prop or character.
---

# 5 · Look, lighting and brand

## The look (all in `recipe/engine/core.mjs`)
| Element | Setting | Why |
|---|---|---|
| Shading | `toon(color)`: MeshToonMaterial with a 6-step **linear** ramp (88, 112, 150, 196, 232, 255) | Reads round and soft. A 3-step nearest ramp drew hard arcs across heads (round 1). |
| Ink outline | `part(geometry, color, { px })` adds a back-face hull pushed out a constant number of **screen pixels** (default 2.6 px; 1–2 px for small parts, 3 px for big ones) | The cartoon line, the same weight at any distance. |
| Rim light | `RIM.rimColor` / `RIM.rimStrength`, set by each place's light preset | Separates characters from the background. |
| Tone mapping | Neutral, exposure 1.0 | Keeps brand colours true. |
| Depth of field | Bokeh pass; each shot returns `focus` = its orbit distance, `aperture` 0.0004–0.0025, `maxblur` 0.005–0.008 | The miniature, "animated film" feel. Close inserts get the higher aperture. |
| Bloom | Unreal bloom, threshold 0.97, strength 0.25–0.45 per place | Only lights, screens and LED digits glow. Above 0.45, eye whites start to glow. |
| Grade | contrast 1.14 with a 1.06 gain, warmth 0.02, vignette 0.34, grain 0.026 | A slightly rich, filmic finish. |

## Light presets (`kit.mjs → LIGHT`, used by `lightRig(scene, preset)`)
| Preset | Use for | Character |
|---|---|---|
| `golden` | history, nostalgia, outdoor stories | warm low sun, long soft shadows, warm rim |
| `day` | how-it-works, science outdoors | neutral bright sun, blue sky |
| `night` | studies, mysteries, interiors | cool moonlight plus warm practical lamps |
| `space` | astronomy | hard white sun, cool blue rim, stars |
| `studio` | objects and diagrams on a plain backdrop | soft even key, no fog |

Lighting rules learned in round 1:
- No shadows from point lights: their shadow maps band on toon heads. Only the key (directional) light casts shadows.
- Practical lamps are soft, low-saturation warm (`#ffd2a2`), 2–3.5 intensity.
- Faces under a tree canopy need a front fill (the `front` value in each preset, plus a hero key light for close-ups).
- Nothing brighter than a practical light: signs glow at 0.5 emissive at most; glowing strings at 1.9×.
- Painted eye whites are sand-white (`#f1ece3`), not pure white, so sun plus bloom can't blow them out.

## The owner's brand palette (`BRAND` in core.mjs)
| Name | Hex | Where |
|---|---|---|
| Rouge Noir | `#5B0D18` | the hero's clothes, roofs, doors, title-hook box, counter labels |
| Blue Coral | `#083B3A` | a second character's clothes (lifted with `tint` so it isn't black), leaves, ocean-ish sets |
| Cognac | `#8A4E2A` | wood: trees, fences, frames, desks, shoes |
| White Sand | `#E7E3DD` | walls, paper, captions, highlights |
| Anthracite | `#1B1B1F` | ink lines, limbs, dark trousers |
| Brand red (highlight) | `#E0394F` | caption italic words; Rouge Noir lifted to read on any background (same hue, 352°) |

**How to use them:**
- Clothes and hero props: the brand colours at full strength, or lifted a little with `tint(hex, k, toward)` when a dark colour would read as black under warm light (Einstein's sweater is `tint(BRAND.blueCoral, 0.22, '#2f8a80')`).
- Environments: lifted tints of the same hues, from `ENV` in core.mjs (grass, leaves). Pure Rouge Noir or Blue Coral is too dark for nature.
- **Real things look real.** When the topic shows something everyone knows (the Earth, the Moon, the sky, fire, water, an apple), it keeps its real colours. The owner rejected a brand-coloured Earth in round 1: it is now blue oceans, green land, deserts, ice caps, clouds and a thin blue halo.

## Faces and skin
Skin tones, chosen per character from `SKIN` in character.mjs (light, fair, medium, tan, brown, deep), mixed across a cast. White faces are the reference's other option; this series uses skin tones.

## Per-shot lens values
Each shot's `apply()` returns `{ focus, fov, aperture?, maxblur?, bloom? }`. The orbit helper returns `focus` = distance and `fov`; add `aperture` for inserts (0.0012–0.0025) and lower it for wide or space shots (0.0002–0.0008).
