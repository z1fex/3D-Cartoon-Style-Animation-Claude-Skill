---
name: storyboard-and-shot-plan
description: Plan a 3D Cartoon Animation film shot by shot - one shot per narration clause, with the words, place, subject, action and its landing word, face swaps, camera move, number device, caption lockup and sound cues - and review it as rendered stills. Use after the voiceover (or with draft timing) and before building shots.
---

# 4 · Storyboard and shot plan

## One clause = one shot
Split the narration at commas, colons and full stops. Each piece is a shot, starting on the first word of its clause. A 30 s film is about 20 shots (1.0–2.4 s each); never hold a shot longer than about 2.5 s without a new action inside it.

## The storyboard row
For every shot, write one row (copy [the storyboard template](../../templates/storyboard-template.md)):

| Field | What to write | Example (shot 12, gravity) |
|---|---|---|
| **#, time** | shot number, start–end in seconds | 12 · 15.91–17.90 |
| **Words** | the exact clause | "two hundred and forty thousand miles away." |
| **Place** | which set | space |
| **Subject(s)** | what must be in frame (the framing check uses these) | the tape-measure counter, the Moon |
| **Action → landing word** | what happens and the word it lands on | the tape runs out from Earth to the Moon; the counter rolls and stops on "away" |
| **Faces** | expression swaps and their words | Earth smug; Moon surprised |
| **Camera** | the orbit move: subject, distance, yaw, pitch, fov at start → end | side view of the whole line, creeping in 10.6 → 10.0 |
| **Number object** | the device for each number (skill 9) | tape measure + "240,000 MILES" counter |
| **Caption** | the lockup (skill 11) | `^240,000 / *miles away.*` |
| **Sound** | foley and accents (skill 12) | tape whir + counter ticks; a ding on 240,000 |

## Shot rhythm
- Alternate distances: wide → medium → close → insert (an object or device) → wide.
- Put the **device inserts** on the numbers and the **close-ups** on the face reactions.
- Change place at the beats (stakes, escalate, twist), and enter each new place with a moving camera and a soft whoosh.
- The hook shot and the loop shot are the same framing, so the loop is seamless.

## Timing helpers (in film.mjs)
- `LEAD = 4 * F`: a gesture or device reaches its key pose 4 frames before its word.
- `FACE = 2 * F`: a face swap's new face appears 2 frames before its word (after a half-closed and a closed frame).
- Shot `w`: the index of the shot's first word; `s.start = W(w)`, `s.end` = the next shot's start.

## Review the storyboard as pictures
Render one still per shot and a contact sheet, plus the framing check, before animating details:
`node recipe/tools/render.mjs examples/<slug>/film.mjs <outDir> --stills shots --qa`

Look for: the subject readable at phone size, the caption band clear, the place obvious, and the story readable with the sound off.

## The owner approves the storyboard first
The owner's rule (27 October 2026): "I want you to first create storyboards… so that I myself can loop… if I like the storyboard, and then you can generate." This is not optional. Use the owner's storyboard board (`recipe/tools/storyboard-board.mjs`):
- **The header:** title · duration · size · BPM · scene count, then a few plain lines on the film, then "Decisions for you".
- **One numbered panel per shot:** its time and title, the words, the rendered still, an `explains:` line, a `sound:` line, a `→ motion` line, a tag ("kept from v2", "new") and 👍/👎.
- **The story leads** (the owner, 27 October 2026: "make sure the edit happens according to the story and how well we can explain using the visuals").
  - Put the story in one sentence in the board's `story`.
  - On every panel, write what part of the story the shot carries and how its picture explains it. A shot that explains nothing is redrawn.

Write `storyboard/<v>/storyboard-<n>.json` (`templates/storyboard.json`), pointing at the stills, and draw it:
`node recipe/tools/storyboard-board.mjs examples/<slug>/storyboard/<v>/storyboard-<n>.json`
- **What it writes:** a PNG, and a clickable HTML page. On the page, the owner marks 👍/👎 and presses "Copy feedback".
- **Then stop.** Give the owner the board, and revise into `storyboard-2`, `storyboard-3`… (keeping the earlier boards) until they approve.
- **Only then** record the voice and build the shots in detail. The finished film must match the approved panels.

## Worked example
[The gravity film's storyboard](../../examples/how-gravity-was-found/storyboard.md): 20 shots, every field filled.
