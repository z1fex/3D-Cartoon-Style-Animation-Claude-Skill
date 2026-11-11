---
name: camera-and-transitions
description: Frame and move the camera in a 3D Cartoon Animation film - an orbit around a named subject placed 43% from the top, 44-50° vertical fov, a travel curve that is fast at the cuts and creeps between them, and 6-frame dissolves on the first word of each sentence. Use for every shot.
---

# 8 · Camera and transitions

## The reference's rules
- The camera moves in about 90% of frames. It **creeps** (about 5% a second) between moves, **accelerates into every transition**, and **arrives in the next shot already moving**. No handheld shake; every move starts on a word.
- Shots join with a **6-frame dissolve** (0.2 s) starting on the first word of the new sentence, while both shots keep moving. Hard cuts are rare (`transition: 'cut'` on a shot).
- Special transitions for big beats: fly through a door, zoom into an eye, dive into a slot, a whip-pan blur.
- A close-up may crop the top of the head, never the eyes.

## The orbit move (copy it into each film)
```js
// [at, distance, yaw°, pitch°, fov] at the shot's start → end
return move(cam, t, s, [[x, y, z], 4.4, 16, 5, 48], [[x, y, z], 3.9, 10, 4, 48]);
```
- `at` is the subject (a head, a device, the midpoint of two things). The helper aims slightly above it so the subject sits **about 43% from the top**, clear of the caption band (64–77%).
- `yaw` swings round the subject (positive = from screen right), `pitch` raises the camera.
- Distance shrinks 10–15% over a shot (a push-in), or grows for a reveal.
- The travel curve `travel(u)` has speed 1.8 at both ends and 0.6 in the middle: fast out of the last dissolve, a creep through the middle, fast into the next.

## Framing in 9:16
- **Use a vertical fov of 44–50°.** At 38–40° the horizontal view is only about 23°, too tight for two subjects.
- Two subjects (a character and a device): aim at their midpoint and pull back until both fit; the framing check measures it.
- Never put the camera inside a character (v1 shot 1 went black that way).
- Objects with faces turn to the camera automatically (`faceCamera` on the place).
- Wide establishing shots: keep the hero in frame and avoid half-cut props at the edges (the AGE counter in v2 shot 6).

## Special camera work used in the example
- **Following a growing thing:** the string reaching the Moon. The camera's subject is lerped along the string with the same progress as the string, so the tip stays in frame (v1 missed the Moon).
- **A side view of a long object:** the tape measure. The camera sits square to the Earth–Moon line, so the whole length is visible; the Moon was moved closer to fit (a cartoon cheat is fine when the counter says the real number).

## Checks
- The framing check (skill 13) passes for every subject in every frame.
- The hook and the loop shots match, so the loop is seamless.
- Every place change enters on a moving camera, with a soft whoosh (skill 12).
