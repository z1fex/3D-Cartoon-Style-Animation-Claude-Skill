# Glitch catalogue

Every glitch found in round 1 (v1: 16 by the owner's request to "watch every bit"; v2: 6 more in the frame-by-frame review), its cause and the fix now in the engine or the rules. Check new films against this list (skill 13).

| # | What you see | Cause | Fix / rule |
|---|---|---|---|
| 1 | Mirrored numbers on a flipping calendar page | the page was double-sided with one texture | printed surfaces get a blank back face (`calendar` has `flipBack`) |
| 2 | A window flickering every frame | the glass and the frame in the same plane (z-fighting) | no two visible surfaces share a plane; offset by ≥ 5 mm |
| 3 | A blown-out white blob | a lit sign at full emissive, spread by bloom | signs at ≤ 0.5 emissive; bloom threshold 0.97 |
| 4 | A bright streak across the frame | a glowing string passing next to the lens | keep strings away from the camera; frame from the side |
| 5 | A pale halo over the apple | a thin pale leaf detached from the stem | the leaf is green and grows from the stem tip |
| 6 | White specks floating above the grass | flower balls hovering | removed; no unsupported particles |
| 7 | Glowing eye whites on planets | pure-white eyes under a hard sun with bloom | eye whites `#f1ece3`; softer space sun |
| 8 | The landed apple hidden in grass | tall grass at the landing spot | clear grass patches where action happens |
| 9 | A bowling ball floating in mid-air; the character facing away | the throw did not start in the hands; the character side-on | held props follow `handPos`; turn actors three-quarters to camera |
| 10 | A rolling apple leaving the frame | a spiral wider than the shot | size the action to the framing; the framing check catches it |
| 11 | An unreadable snip | tiny scissors behind a tiny model | gags read at phone size: close-up, big prop |
| 12 | Papers poking through a bending grid | the dent dipped through desk props | clear the action area; raise the grid on a frame |
| 13 | A label cut off | the counter sank into the crate | check every label's full extent |
| 14 | Subjects cut by the frame edge | framing checked on one still only | the automatic framing check on every frame, with each subject's radius |
| 15 | Empty black frames | no set dressing in space | always dress the set: horizon, stars, devices |
| 16 | Shoes reading as black holes | Anthracite shoes in shadow | Cognac-tinted shoes |
| 17 | A dark, murky hook shot | the camera looking up into the canopy | level the camera so the bright horizon is behind the subject; a hero key light |
| 18 | The CLOSED notice's text clipped | text wider than its canvas | auto-fit every label's text to its canvas |
| 19 | A grid's dent sinking through the desk | the sheet sat on the desk top | put deforming surfaces on an open frame above other surfaces |
| 20 | An apple passing into the bowling ball | the roll's end radius smaller than the two radii | end distance ≥ sum of radii plus a margin |
| 21 | A snipped string still glowing | `glowString.set()` switches the string back on | set visibility after `set()`; hide helpers in `reset` |
| 22 | Scissor handles over a face | the scissors lay along the string, in front of a character | blades cross the line being cut; keep handles clear of faces (move the character aside) |
| 23 | A space before "?" in the title | the highlight box's padding | put trailing punctuation inside the `*…*` |
| 24 | A number shown before it is spoken | a device's final value set before its own shot | each place's `reset(t)` sets time-correct values |
| 25 | A black frame | the camera inside a character's head | never put the camera inside a character |
