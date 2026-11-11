---
name: voiceover-and-timing
description: Record the narration with ElevenLabs (with per-character timestamps), tighten pauses to the style's numbers, fit the length, and produce the word timings every shot, face, gesture, caption and sound is placed on. Use after the script is final.
---

# 3 · Voiceover and timing

Everything in this style is timed to words, so the word timings are the spine of the film.

## Making the voice
1. Write the exact narration to `examples/<slug>/vo/text.txt` (numbers spelled as spoken: "sixteen sixty-six", "two hundred and forty thousand").
2. Run `ELEVENLABS_API_KEY=… VO_SPEED=1.15 node recipe/tools/voiceover.mjs examples/<slug> [voiceId]`.
   - Model `eleven_multilingual_v2`, endpoint `text-to-speech/{voice}/with-timestamps` (it returns per-character times, so no transcription is needed).
   - Settings used in round 1: stability 0.38, similarity 0.8, style 0.45, speaker boost on, speed 1.15 (`VO_SPEED`). Voice "George" (`JBFqnCBsd6RMkjVDRZzb`), a warm British narrator; any voice works.
   - It writes `raw.mp3`, `alignment.json` (cached: delete it to re-generate), `voice.wav` (48 kHz mono) and `words.json`.
3. **Pause tightening** is automatic: after a sentence the gap becomes 0.20 s, after a comma 0.10 s, inner gaps are cut to 0.12 s; speech itself is untouched (6 ms crossfades at every cut). The reference measured 0.2 s after a sentence and never more than about 0.33 s.
4. **Fit the length.** If the tightened voice is still long, speed it with `atempo` (pitch kept) and rescale the word times by the same factor. Round 1: raw 32.9 s → tightened 31.1 s → `atempo=1.03` → 30.2 s. Keep the factor ≤ 1.10; beyond that, cut words instead.

```
ffmpeg -i vo/voice.wav -af atempo=1.03 -ar 48000 -ac 1 vo/voice-final.wav
node -e "const fs=require('fs'),j=require('./vo/words.json'),k=1.03;fs.writeFileSync('vo/words-final.json',JSON.stringify({duration:+(j.duration/k).toFixed(3),tempo:k,words:j.words.map(w=>({...w,start:+(w.start/k).toFixed(3),end:+(w.end/k).toFixed(3)}))},null,1))"
```

## The word timings
`vo/words-final.json` is `{ duration, words: [{ text, start, end }] }` in seconds. In `film.mjs` the helper `W(i)` is the start of word *i*. Print the list with indices once and keep it beside the storyboard: every shot starts on `W(firstWordOfClause)`, and every action is written as `W(i) - LEAD` (4 frames before) or `W(i) - FACE` (2 frames before).

## Draft timing before the voice exists
The starter film (`templates/new-film/film.mjs`) times its `SCRIPT` at about 3.3 words a second when `vo/words-final.json` is missing, so the storyboard stills can be made and approved before spending voice credits. Nothing else changes when the real timings arrive: the shots re-time themselves.

## The key
The owner's ElevenLabs key needs text-to-speech permission (a speech-only key is enough; it cannot list voices, so pass the voice ID). Pass it as an environment variable for the one command. Never write it into a file, a script or the package. If it is not available, ask the owner for it.

## Checks
- `words-final.json` word count equals the script's word count.
- The voice ends within 0.3 s of `duration`.
- Loudness is normalised later (skill 12); don't normalise here.
