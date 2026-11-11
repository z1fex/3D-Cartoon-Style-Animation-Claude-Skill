# Example: How gravity was found (approved, round 1 v3)

The first film made in this style, approved by the owner on 26 October 2026 ("I really like this. I really liked this video."). Use it as the reference for quality, pacing and structure. Its **topic** is specific; its **method** is the package's.

| File | What |
|---|---|
| `final/How gravity was found - v3.mp4` | the approved film: 1080×1920, 30 fps, 30.3 s, −14.2 LUFS |
| `final/storyboard.png`, `final/poster.png` | one still per shot; the cover frame with the title hook |
| `final/cue-sheet.txt` | all 80 sound effects (10 accents, 70 foley) with times and levels |
| `final/stem-*.wav`, `final/mix.wav` | voice, music and effects stems; the master |
| `film.mjs` | the film's source: 20 shots, captions, title, cues |
| `vo/` | the narration text, ElevenLabs alignment, tightened word timings, the final voice |
| [script.md](script.md) | the final script with its seven beats and sources |
| [storyboard.md](storyboard.md) | the shot-by-shot plan |
| `earlier-versions/` | v1 and v2 videos and storyboards, the v1 script and the v1 frame review: what changed and why is in [feedback history](../../references/feedback-history.md) |

## Re-render it
```
node recipe/tools/render.mjs examples/how-gravity-was-found/film.mjs <out> --video --name silent.mp4
python -I recipe/tools/sound.py examples/how-gravity-was-found <out>/silent.mp4 <out>/shots.json "<out>/How gravity was found.mp4"
```
(Run from the package root. About 45 s for the picture and 2 minutes for the sound.)
