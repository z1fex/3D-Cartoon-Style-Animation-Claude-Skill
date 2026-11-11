---
name: motion-and-acting
description: Act every clause of a 3D Cartoon Animation film - pose keys that land 4 frames before their word, dead-still holds, head follow-through, real-gravity falls and physical gags - with the engine's pose library. Use when building each shot.
---

# 7 · Motion and acting

## The reference's measured rules
- **Holds are dead still** (under 0.5 px of head movement a frame): no breathing, swaying or idle bounce. Life comes from the camera, blinks, face swaps and props.
- **Gestures take about 5 frames and finish 3–5 frames before their word.** By the time the word is heard, the pose is there (`LEAD = 4 * F`).
- **The body follows the hand:** the head keeps turning 2–4 frames after the hand stops (the rig's head lags 3 frames automatically).
- Walk: a step every 5–6 frames with a bob of about 7% of the head height. Sit: dip 3 frames, rise 5, come down over 11, bounce on contact. Jolt: up about half a head in 2 frames.
- Feet stay planted; nothing passes through anything; every frame is a pure function of time `t` (no state carried between frames).

## Pose keys
```js
rig.animate(t, [[0, 'readGround'], [W(10) - LEAD, 'lookGroundR', 4 * F], [W(15) - LEAD, 'pointDown']]);
```
Each key is `[time, poseName or pose object, optional transition length]`. The pose is fully reached at its time, starting `dur` earlier (default 5 frames, ease-out). `rig.pose(POSES.x)` sets a pose instantly (for holds).

**Pose library** (`POSES` in character.mjs), all original:
- Standing: `stand, wagFinger, handsHips, present, snip, drop, delightedStand, wave`.
- Sitting on the ground: `sitGround, readGround` (holding a book), `jumpGround, lookGround, holdApple, thinkGround` (hand to chin), `pointUp, pointDown, shrugGround`.
- Add your own as plain objects of joint angles (radians): `hipsY, lean, tilt, bob, headPitch, headYaw, headRoll`, and per side L/R: `raise, fwd, twist, elbow, leg, legOut`. A pose only lists what differs from the relaxed stand. Films can add poses locally: `POSES.bookShield = { ...POSES.sitGround, fwdL: 2.55, … }`.

## Physics that reads
- **Falls use real gravity** (g = 9.8 m/s²): a 2.8 m drop takes 0.76 s. Solve the start time from the landing word: `t0 = landAt - sqrt(2h/g)`, land 2 frames before the word, then a small settle bounce.
- **Throws:** a lerp from the hand to the target plus a parabola `1.4·u·(1−u)` height.
- **Springs and stretchy surfaces:** a damped cosine (`0.5 + 0.16·e^(−5k)·cos(18k)`) for a trampoline's dent.
- **Rolling into a dent:** a shrinking spiral that ends resting against the heavy object (end radius ≥ the sum of the two radii plus a margin; v2 had the apple pass into the ball).

## Gags (idea → physical action)
| Idea | Gag | Example |
|---|---|---|
| a force or link | a glowing string that tightens, twangs and gets snipped | Earth pulls the apple; Einstein cuts it |
| a correction | strike out a word on a board and chalk the new one | PULL → BENT SPACE |
| a closure | doors swing shut, a notice slaps on with an overshoot | the plague notice |
| a question | the right signpost board lights up | DOWN |
| a refusal or "no" | a finger wag (with a small elbow wobble) | Einstein's "isn't a pull" |
| a shock | a jolt plus a shocked face swap | the walker in the template |
| a playful denial | the object scoots sideways and springs back | the apple "never sideways" |

## Checks
- Every action lands on a named word (write it in the storyboard).
- Held props sit in the hands every frame (`handPos`).
- Nothing pops: a prop that appears or disappears does so on a cut or with a motion, never mid-hold (the jump scan finds pops).
