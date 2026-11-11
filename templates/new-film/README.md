# Starter film (any topic)

`film.mjs` is a working four-shot film on a placeholder topic ("How fast is a sneeze?"). It shows every building block once:
- a kit interior and exterior and a studio void, all dressed;
- an original host (tan skin, curly hair, glasses) and a walker (light skin, bob, beret);
- a flip counter landing on its number;
- a jolt gag;
- a chalk diagram;
- caption lockups, the title hook and sound cues.

It renders before any voiceover exists (draft timing at about 3.3 words a second).

## Make a new film from it
1. Copy this folder to `examples/<topic-slug>/`.
2. Replace `SCRIPT` with your narration (skills 1–2) and the title, captions and shots with yours (skills 4–11).
3. Storyboard stills with draft timing: `node recipe/tools/render.mjs examples/<slug>/film.mjs <out> --stills shots --qa`.
4. Write `vo/text.txt` (the same narration, numbers spelled as spoken), run `voiceover.mjs`, then fit the length to `vo/voice-final.wav` and `vo/words-final.json` (skill 3). The film re-times itself.
5. Render, add sound, check every frame (skills 12–13).

## Helpers to copy from the example film when you need them
- `changes(a, b, value, gap)`: times at which a counter's shown value changes (for tick cues). It is in `examples/how-gravity-was-found/film.mjs` and also below in this template.
- `fall(t, landAt, from, to)`: a real-gravity fall that lands on a word.
- `bookIn(rig)`: a prop held in both hands, following the pose.
