# Study: 3D Cartoon style

**Source:** "Opus 5.5 + Creatorize = MEGA Viral 3D Cartoon Animations! (Step-by-Step Guide)" by g russ ([youtu.be/z9XflLHoMdg](https://youtu.be/z9XflLHoMdg)). The owner supplied a 35:14 file at 1280×720, 29.97 fps.

**How it was studied (26 Oct 2026):**
- The whole narration was transcribed locally (a machine transcript).
- One frame every 10 s across the video.
- Every second of the 10-short showcase (28:12–32:36), cropped to the vertical video.
- Two full-frame-rate strips: a face swap and a shot change.
- Detected cuts. They are mostly slide changes; the shorts themselves rarely hard-cut.

The transcript, frame sheets and cut list are the creator's material, so they are not part of this package. This page is our own summary of what the study found, with credit to the creator.

**What the video is:** the creator studied 7 reference shorts from one channel (31–68 s each) at every frame (9,140 frames). They built the style into their own desktop app (Creatorize) with a team of Claude agents, made 10 shorts, and explained the rules with measured numbers. The numbers below are theirs, checked against the frames where possible.

**Rule for us:** copy the technique, never the content. Their characters, sets, signs, jokes and invented brands (SpeedLink 56K, BrikBox 8) are theirs. Everything we make must be our own.

## 1. What the style is

A fast vertical cartoon explainer, 9:16, about 50 s. A big-headed toon character lives the whole story, and something new happens every few words.
- One clause of narration is one shot, and the camera is always moving.
- It is told to **you**, in second person ("You're floating outside the space station when your left eye slams shut").
- It loops: the last line runs back into the first.

## 2. Look

- **Rendering:** soft toon shading with ink outlines, warm light, depth of field and glow.
- **Two looks:**
  - **Cinema** (used for all 10 shorts): soft rim light, strong depth of field, warm glow, film grain.
  - **Clean:** brighter and flatter, for explainers built on diagrams, maps and labels.
- **Lighting:** 10 light rigs, from warm interior through neon underwater to space.
  - Practical lights in frame (lamps, signs, screens) glow and bloom.
  - Spotlight cones and volumetric beams are common.
- **Face colour:**
  - **White faces** (the classic look): every head and hand is clean white. White gets its own lift, so it stays white under a lamp without blowing out, still takes the colour of neon or water, and its shadow side stays a readable cool grey.
  - **Skin tones:** every character has their own skin colour.
  - Pick one per channel and keep it.
- **Sets** are dense and lived-in, never an empty grid floor. Examples: a 90s bedroom with wood panelling, posters, a corkboard, a retro TV with a sticky note, a game console, an armchair, a shag carpet and a warm lamp. Others: a retro diner, mission control, the deep sea, a museum hall, a Boston street under an elevated railway, a desert camp, a space station.
- **Props** are made in code; they had 317, from arcade cabinets and consoles to submarines and rockets.
- **Effects:** about 30 kinds, including rain, fire, bubbles, lightning, X-ray scans, snow, steam and tear drops.
- **Invented brand names and signs** everywhere: "SPACE GOAT", "BLOW HARDER", "GLOWCO NIGHT SHIFT", "ASK WHY. THEN AGAIN.", "ROUND FILTERS ONLY", "ONLY WHAT'S ON BOARD".

## 3. Characters

- **Body:** a ball for a head, a bean for a body, thin black stick limbs, white mitten hands, round white feet.
- **Hair and hats:** hair is a cap-shaped shell. Hats and costumes carry the identity: pith helmets, army caps, a lab coat, a spacesuit with a bubble helmet, hi-vis vests, a sailor stripe.
- **Cast:** 20 original characters, 6 body types (kids to grandparents) and 12 outfits.
- **The narrator stand-in** is "you". The main character can be swapped after the build.
- **Objects come alive.** Lock pins, modems, an aeroplane, a CO₂ cloud and a filter all get the same painted faces and act.

## 4. Faces (the heart of the style)

- **Painted faces:** brows, eyes and mouth only, with no nose. They are painted onto the 3D head like a decal, with flat line art and white eyes with dark pupils.
- **Expressions:** 43, from neutral and smug to panic, dizzy and star-struck. There are 8 extras: sweat drops, tears, an anger vein and similar. All come from one master sheet, so they read as one family. (They drew theirs with Google Flow; ours must be our own.)
- **Eyes** know where their lid and pupil are, so they can blink and look at whatever the character touches.
- **No lip sync.** The face does the acting, not the mouth.
- **Face swaps happen through a blink**, checked frame by frame:
  1. one half-closed frame;
  2. one closed frame;
  3. the new face, about 2 frames before the stressed word.
- **Faces never morph** from one expression into another.
- **Pace:** the main character gets a new face about every 1.2 s.

## 5. Motion (measured; the hard part)

- **Holds are dead still.** When a character stops, the head moves less than 0.5 px a frame: no breathing, no swaying, no idle bounce. Life comes from the camera, the blinks, the faces and the props.
- **Gestures land before the word.** A shrug takes about 5 frames and finishes 3–5 frames before its word, so the pose is already there when the word is heard.
- **The body follows the hand.** The head keeps turning for 2–4 frames after the hand stops.
- **Walk:** a step every 5–6 frames, with a body bob of about 7% of the head.
- **Sit down:** dip over 3 frames, rise over 5, come down over 11, then bounce on contact.
- **Jolt:** the body shoots up almost half a head in 2 frames.
- **Contact:**
  - Feet stay planted while walking, sliding less than 0.5 mm a frame.
  - No hand passes through a head or a body; they tested 54 poses on 8 bodies.
- **Determinism:** every frame is a pure function of time.

## 6. Camera and transitions

- **The camera never stops.** It moves in about 90% of frames.
  - Between moves it creeps in at about 5% a second.
  - It speeds up into every transition and arrives in the next shot already moving.
  - There is never any handheld shake. Every move is smooth and starts on a word.
- **Almost no hard cuts.**
  - Shots join with a **6-frame dissolve (0.2 s)** that starts on the first word of the new sentence, while both shots keep moving.
  - 2 of the 7 references have no hard cut at all.
- **Special transitions:** flying through a door, zooming into an eye, diving into a console slot, a whip-pan blur.
- **Close-ups** may cut off the top of the head, but never the eyes.

## 7. Facts are objects (rule 6)

A spoken number is never a text overlay. It becomes a physical device in the world that lands on its exact frame. They catalogued 38 kinds in the references; the style has 28 kinds of in-world information:
- **LED or flip counters** roll up and land on the number: "INSERT #326", "19,978 GAL", "5,000 FT", "2,300,000 GAL", the year "1959".
- **Gauges:** the needle swings with a little overshoot and stops on the value. Examples: CO₂ mmHg, speed, depth.
- **Calendars and clocks:** a desk calendar page flips ("21 APRIL 1861", "1954", "JAN 15"); clock hands sweep forward; a pocket watch.
- **Newspapers and documents:** a newspaper spins in ("AERIA JET LOST AGAIN"); a magnifier slides to the exact line being read.
- **Panels and signs:** a button panel lights per number; a bar chart is made of stacked real objects; neon or LED signs carry key words ("TRY #2", "REAL FIX", "TALK WAIT").
- **The rule:** every spoken number gets a physical event on its exact frame.

## 8. Captions

- **Type:** white, bold, rounded sans, with a dark outline or shadow.
- **Words:** 1–3 at a time, in sync with the voice. Some are written as words ("sixty-one.", "seventy-eight,").
- **Position:** centred at about 70% of the height. Faces must stay out of the 66–76% band.

## 9. Pace

- A new picture about every **1.1 s**, roughly every **4 words**.
- The hook pays off in the first **2–3 s**.
- A 50 s short is about **25–30 shots**, one per clause.
- Most shorts loop.

## 10. Script formula

- **Length:** about **165 words for 50 s**, one idea per clause, since every clause is a shot.
- **Structure:**
  1. A hook aimed at "you" in the first sentence.
  2. The story told as your own experience.
  3. A turn: "But here's the weird part…"
  4. An everyday analogy built as a literal picture ("like wearing a water balloon for a contact lens"; "a literal square peg in a round hole").
  5. A last line that loops back to the first.
- **Facts:**
  - Put real numbers in and say them aloud, because each one becomes an object.
  - Source every claim. When sources disagree, hedge in plain words: sources said 15, 25 or 40 ft, so the script says "as tall as a house".
- **Topics they used:** retro tech, accidents, space, the deep sea, history, an expedition gone wrong.

## 11. Sound

- **Voice:** about 215 words a minute. The voice fills 93–98% of every short.
- **Pauses** are tightened to about 0.2 s after a sentence, never more than about 0.33 s. One short went from 60.8 s to 49 s with the same words.
- **Music:** a constant bed about 18 LU under the voice, with **no ducking**.
- **Sound effects:** placed on visible actions (a door, a landing, a counter that lands).
  - **Levels:** impacts about 10 LU under the voice, whooshes and pops about 15, small ticks quieter still.
  - **Count:** the references use 12–20 a minute, so keep only the most important hits. Their first build had 69 effects in 47 s and was cut to 19.
- **Master:** −14 LUFS. Keep separate voice, music and effects stems.
- **Their sources:** voice from ElevenLabs, music licensed from Epidemic Sound, effects from their own library.

## 12. How they produce it (their pipeline)

1. **Script:** Claude researches and writes it, with its sources.
2. **Voiceover:** recorded, then the pauses are tightened.
3. **Clean and time:** local transcription with word timing to about 20 ms.
4. **Direction:** 2–3 sentences, for example "White faces. Boston, January 1919: a calm lunchtime street under the elevated railway, then the tank bursts and a brown wave as tall as a house rolls through it. Every number lands as a real object on its word."
5. **Quality level:** Standard, More depth, Polished, Verified or Ultraedit.
6. **The crew:**
   - **Director:** writes the storyboard per clause. For each shot it sets the words, who does what on which word, the face, the camera move and the object for each number.
   - **Set designer:** builds every recurring place exactly once, from a dressed base place.
   - **2–6 scene builders:** work in parallel, one file each. They render frames 1/30 s apart at every gesture, sit and turn, to check their own motion.
   - **Publisher:** a pass over every part.
   - **Director again:** reviews a contact sheet of the whole short.
7. **Review and fix:** pause on the frames that matter, click what looks off, and say what to change.
8. **Sound mix and export:** 1080×1920, optionally 4K, with a captions file.

**Build times:** 33 minutes (Standard, 24 shots), about 90 minutes (Polished, 29 shots) and 81 minutes (Ultraedit, 28 shots).

## 13. Quality checks

**"Five things I watch for":**
1. Every shot shows what the words say, right when they're said.
2. The face of whoever the shot is about is readable, lit and clear of the captions.
3. Nothing floats, slides or passes through something else.
4. Every number lands as an object on its word.
5. The set feels lived in, with no empty corners.

**Layout check:**
- No face behind the captions.
- No subject off screen and no head cut off. A close-up may cut the top of the head, but never the eyes.
- No characters passing through each other or through props.
- No feet floating above the floor.
- No frame too dark or too empty.
- Rays from the camera to the face catch a face hidden behind furniture.

**Lessons from their builds,** each fixed in the style itself:
- Glow smeared broken prop surfaces into black squares, so surfaces are now repaired before rendering.
- Characters sat inside armchairs, so seat height is now measured from the seat edge.
- There were too many sound effects.
- Close-ups cut off the eyes.
- The set designer was a bottleneck, so the set designer and builders now start together.
- A depth counter showed the wrong number.
- A calendar showed the wrong day.

## 14. What this meant for us (before round 1)

Our tools and gaps for this style, as planned before the first recreation. How each gap was closed is in [engine-notes.md](engine-notes.md) and the skills.

**Can do now:**
- **3D in code:** three.js, rendered frame by frame in a headless browser.
- **Rendering:** toon materials, ink outlines, rim and practical lights, bloom, depth of field and grain.
- **Characters and faces:** ball, bean and stick characters, with faces drawn in code as decals and blink swaps.
- **Captions, camera moves and dissolves.**
- **Fact objects:** LED counters, gauges, calendars, clocks and newspapers.
- **Sound effects and a beat or bed** generated in code.
- **Mixing to −14 LUFS** with FFmpeg.

**Gaps:**
1. **Voiceover:** they used ElevenLabs. Options are the owner's own voice, a free local voice (Kokoro), or an ElevenLabs account.
2. **Word timing to about 20 ms:** a rough local transcript gives sentence-level times only. (Closed: ElevenLabs returns per-character times, so the voice comes with its own word timings.)
3. **The library:** they had 20 characters, 43 faces, 29 places and 317 props. We start from zero, so the first short is the heavy lift. Later shorts reuse what the first one builds.
4. **Music:** licensed (Epidemic Sound) in theirs. Ours is generated in code, or a track the owner holds the licence for.
5. **Face art:** theirs is AI-painted. Ours will be drawn in code to start; an image generator could be added later.
