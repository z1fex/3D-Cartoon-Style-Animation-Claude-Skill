---
name: review-rounds-and-learning
description: Run review rounds with the owner on a 3D Cartoon Animation film (deliver, take feedback, fix, re-check every frame, re-deliver), record what was learned, and fold it back into this package so the next topic starts better. Use after each delivery and whenever the owner gives feedback.
---

# 14 · Review rounds and learning

## A round
0. **Every round starts with a storyboard** that the owner approves (skill 4). Each revision is a new board; keep the earlier ones.
1. **Deliver** the video, its storyboard and an honest list of what is still weaker than the reference.
2. **Take the feedback** in the owner's words. Write it into the round notes before changing anything.
3. **Classify each point:** story, picture glitch, look, text, sound, or a new rule for the style.
4. **Fix**, then re-run every check in skill 13. The owner should never find a glitch the checks could have found.
5. **Re-deliver** as a new version (v2, v3…) in its own folder; keep the earlier versions for comparison.
6. **Learn:** for every point, decide whether it is a rule for all future films. If it is, put it in the right skill, the [owner's direction](../../references/owner-direction.md), the [glitch catalogue](../../references/glitch-catalogue.md) or the engine, and record it in the [feedback history](../../references/feedback-history.md).

## Round 1, as the pattern (How gravity was found)
| Version | Owner's feedback | What changed in the package |
|---|---|---|
| v1 | "No script or storytelling that keeps the viewer hooked"; "glitches in the visuals, watch every bit"; "Helvetica + Editorial, brand colours for highlights" | The retention structure (skill 2); every-frame review and the automatic framing check and jump scan (skill 13); 16 glitch fixes (glitch catalogue); brand font loading with honest stand-ins (skill 11) |
| v2 | "I like this style", plus: editorial captions like the books reel, not TikTok black-and-white; a topic question at the top for the first seconds; the Earth must look like Earth; more subtle sound on every action (with earshot as a reference) | Editorial lockups and the title hook (skill 11); "real things look real" (skill 5); the two-tier sound system with 24 designed effects and measured levels (skill 12) |
| v3 | "I really liked this video": approved | The package was written from it (this version, 1.0.0) |

## Versioning this package
- A new rule, effect, device, place or character option → a minor version (1.1.0), with a line in `references/feedback-history.md` and the manifest's file list regenerated.
- A change that alters how existing films render → a major version (2.0.0); keep the old version's folder for re-rendering old films.
- Every new topic made with the package goes into `examples/<slug>/` with its final video, storyboard and cue sheet, so the package's examples grow with the channel.
