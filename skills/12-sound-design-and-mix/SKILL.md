---
name: sound-design-and-mix
description: Design the sound of a 3D Cartoon Animation film - an original music bed, a quiet foley sound on every visible action, accents on story beats, measured levels against the voice, stop-downs before the biggest hits - with the engine's 24 synthesised effects, and master it to -14 LUFS. Use after the picture is locked.
---

# 12 · Sound design and mix

Owner's direction (round 1): "slight sound effects when there is an action, everything." Effects design follows earshot's documented motion-design practice (github.com/Leonxlnx/earshot, MIT; `docs/motion-sfx-techniques.md`, `docs/SFX.md`); our code in `recipe/tools/sound.py` is our own and uses no samples.

## The layers
| Layer | Level | Notes |
|---|---|---|
| **Voice** | −16 LUFS (speech reference ≈ −19 dBFS, 400 ms RMS) | fills 93–98% of the runtime |
| **Music bed** | 18 LU under the voice, **no ducking** | original, in C major (C–Am–F–G, 100 BPM): marimba, plucked bass, pad, kick, shaker. Drops to the pad alone for the re-hook (`musicDrop: [start, end]`) |
| **Foley** | ~15 dB under the voice (ticks ~21, birds ~22) | a sound on **every** visible action |
| **Accents** | ~9 dB under the voice | story beats only, at most ~20 a minute, with a 7 dB music dip in the 0.35 s before the biggest (`stop: true`) |
| **Master** | −14 LUFS integrated, true peak −1.5 dBTP | two-pass linear loudnorm |

## The effects (24, in sound.py)
| Type | Tier | Use on | Design |
|---|---|---|---|
| `whoosh` (`long: true` for big moves) | foley | entering a new place, big camera moves | pink noise through three moving bands (1 : 1.6 : 2.5) following the speed; pan sweep; peak lands on the cue |
| `swish` | foley | an arm, a book, a gesture, a throw | thin bright flick, 0.2 s |
| `pop` | foley | the title appearing, a face swap on an object, small arrivals | tonal blip sweeping up into the key, tick, daughter ring |
| `tick` | foley | **every step of a counter** | tiny bright knock with a varied ping (round robin) |
| `tap` | foley | small objects landing, counters settling | a damped wood block |
| `flip` | foley | calendar pages | paper swish and settle |
| `slap` | foley | a notice or paper slapped on | broadband smack and flutter |
| `creak` (`dur`) | foley | doors and hinges | stick-slip pulses through wood resonances |
| `click` | foley | switches, signs turning on | press and latch 35 ms apart |
| `light` | foley | a sign lighting | soft hum and a small chime in key |
| `chirp` | foley | outdoor life (sparingly) | two small bird whistles |
| `rattle` | foley | leaves, shivers | filtered noise bursts at a wobble rate |
| `slide` | foley | a scoot or sideways slip | a soft squeak gliding |
| `stretch` (`dur`) | foley | rubber, a string tightening, a surface bending | a rising rough creak |
| `whir` (`dur`) | foley | a tape running out, a mechanism turning | ratchet clicks over flutter |
| `chalk` (`dur`) | foley | writing, striking out on a board | a scratchy band chopped by the stroke |
| `roll` (`dur`) | foley | something rolling | low rumble at the roll rate plus surface ticks |
| `thunk` | accent | a soft object landing (the apple on grass) | a dull falling body plus a low-passed transient |
| `thud` | accent | a heavy settle | sub 90 → 42 Hz with body and transient |
| `slam` | accent | doors shutting | wood body, crack, latch and a stone-arch room tail |
| `snip` | accent | cutting | two blade clicks and a metallic shing |
| `boing` | accent | springs, trampolines | a wobbling falling tone |
| `twang` | accent | a taut string plucked | harmonic partials with a pitch wobble |
| `ding` | accent | a number landing, a payoff | a C6 bell with inharmonic partials |

To add an effect: write `fx_<name>(rng, …)` returning a mono or stereo array at unit peak (layers that peak together, banded so they don't fight, a moving filter on anything that moves, tonal parts in C major, no leading silence, a short fade at the end), add it to `FX`, `REL` and either `ACCENT` or the foley set, and to `SUSTAINED` if it takes `dur`.

## Cues (in film.mjs)
```js
{ t: W(17) - LEAD, type: 'slam', gain: 1, stop: true }            // an accent with a music dip before it
{ t: W(53) - 0.05, type: 'whir', gain: 0.8, dur: 1.4 }              // a sustained foley sound
...changes(a, b, value, 0.06).map(t => ({ t, type: 'tick', gain: 0.7 }))   // a tick on every counter change
```
- `t` is when the sound's attack lands (whooshes: when their peak lands); the mixer leads it by 10 ms, never later than the picture.
- `gain` adjusts within the type's level (0.5 ≈ −6 dB). Each cue gets ±1.2 dB of random variation and its own noise seed, so repeats never sound identical.
- Write cues shot by shot from the storyboard's sound column. Every visible action gets one; every accent sits on a story beat.

## Levels are measured, not guessed
`sound.py` levels the voice to −16 LUFS, measures the speech reference (the median 400 ms RMS while speaking), and sets every effect so its loudest 400 ms sits at `REL[type]` dB from that reference. On round 1 v3 this gave accents a median of −9 dB and foley −15 dB against the voice. Check any mix with:
`python -I recipe/tools/sfx-levels.py <outDir> <outDir>/cue-sheet.txt`

## Outputs
`stem-voice.wav`, `stem-music.wav`, `stem-sfx.wav`, `mix.wav` (mastered), `cue-sheet.txt` (every placed effect with its tier and level), and the final MP4 (H.264 copied from the silent render, AAC 192 kb/s).

## Licensing
Everything here is synthesised. If the owner supplies a music track, they must hold its licence; set it as the bed at −34 LUFS with no ducking, and keep the effects.
