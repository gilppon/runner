# Dimension Shift Runner — Progress State

## Current objective

Move the portfolio polish work from Ear Cleaning to Dimension Shift Runner. Improve onboarding, moment-to-moment play, and return motivation through small verified changes.

## Confirmed findings

- Project: `E:\solarena\달리기`; existing React + Three.js + Vite game with 2D/3D dimension switching, jump/slide, energy, carrots, gates, pets, upgrades, and portal hooks.
- Worktree was clean before this turn. Existing `node_modules` is present. No project-specific `AGENTS.md` or `state.md` existed at turn start.
- Baseline `npm run typecheck` passed.
- Isolated browser opened at `http://127.0.0.1:5189/` using Microsoft Edge. Ear Cleaning's 5173 browser/server was not touched.
- Baseline title screen showed `COMBO x22!` / `COMBO x23!` from menu attract-mode carrots. Source path: `updateMenu()` calls `collectOrbs(dt, true)`, but `collectOrbs` previously treated `true` as audio-only and still incremented run carrots, energy, combo, and popup feedback.
- Initial no-input runs ended around 109–115m; this does not measure intended difficulty because no valid control sequence was applied before collision.
- Baseline browser console reported the existing meta-CSP `frame-ancestors` warning, expected local mock SDK info, React DevTools info, and two AudioContext resume warnings. Keep these distinct from new regressions.
- Reference review: CrazyGames describes Super Smash Flash with solo/multiplayer modes, selectable characters and levels, and combat combos. It supports using variety and mastery loops as quality cues; its page did not provide evidence about the soundtrack.

## Completed change

- `src/game/engine.ts`: renamed the optional collection flag to `attractMode`; menu attract carrots are removed visually but skip run rewards, particles, combo state/popups, and collection sound.
- Isolated browser reload at port 5189 showed the title screen with no combo popup after waiting through the attract loop.
- Focused gameplay check showed live run at 108m with 10 carrots and `+100!` combo feedback; actual gameplay collection remains active.
- `src/game/audio.ts`: lobby track no longer creates an AudioContext on page load; the existing user-driven start/hub actions unlock it. The game track now plays a 64-step A/B phrase (~7.04 s at 110 ms per step) with a response melody and lighter hi-hats in the second phrase instead of replaying the same 32-step lead every ~3.52 s.
- `src/App.tsx`: sound toggle unlocks audio on user input, so first-time unmute can start playback.
- `index.html`: removed `frame-ancestors` from meta CSP because browsers ignore that directive in a meta element; all other listed CSP sources remain unchanged.
- Cold browser reload: 0 console errors / 0 warnings. Before the first gesture, lobby track is selected with no AudioContext. After clicking Hub, track remains `lobby` and AudioContext reports `running`.
- Human listening quality remains unverified. In-game `game` track is now captured during a controlled route below.
- Typecheck passed. Production build passed: `dist/index.html` 911.64 kB (gzip 247.50 kB). `git diff --check` passed.

## Verification

- Complete: typecheck, production build, focused browser check, and `git diff --check`.
- Playwright automation browser closed after the controlled pass; keep the isolated Vite preview on port 5189 available for user listening.

## Next

1. Let the user hear the in-game track in the runner preview; assess melody, mix balance, and repetition.
2. Test natural/random obstacle seeds and later patterns (slalom, rollers, low beams, multiple gates).
3. Evaluate first-run goal/retry motivation, touch controls, and portal integration.

## Controlled opening run and gate verification (2026-10-05)

- Browser-only deterministic input run forced `Math.random` to `0.9` to hold the first wall-gap side and pattern stable; no product code or saved randomness was changed.
- Pit at x=46: jumping at HUD distance 43 passed without losing a life. A prior exploratory jump at 38 lost a life; source physics and the repeated run indicate the takeoff cue should be later.
- Wall gap at x=82: entered 3D at distance 68, steered toward +Z with ArrowDown, and exited after x=85. All 3 lives remained.
- Three low blocks: jumps at 112, 122, and 132 cleared blocks around x=116, 126, and 136. All 3 lives remained through 145m.
- Secret vault: entered 3D at 150m and steered toward the hidden negative-Z lane. At HUD 189m the browser showed `ZONE 2`, `DIMENSION GATE!`, all 3 lives, full energy, `track: game`, and AudioContext `running`.
- In-game music scheduler progressed during the run: step 37 at 43m, 58 at 68m, 73 at 85m, 126 at 150m, and 152 at gate entry. This verifies the longer phrase executes and continues across dimension switching and the gate; no human listening judgment has been made.
- Browser console after the run: 0 errors / 0 warnings (only React DevTools and expected local mock SDK info).

## Remaining verification

- Human listening review for melody, tone balance, and long-session repetition.
- Test natural/random obstacle seeds and later patterns (slalom, rollers, low beams, multiple gates).
- Review touch/mobile controls and portal runtime behavior.
- Continue quality and defect audit; the overall objective remains active.

## Hazard timing cue pass (2026-10-05)

- `src/game/types.ts`: hint HUD data now supports an `urgent` state.
- `src/game/engine.ts`: pit, hurdle, spike, roller, and low-beam hints switch to a short action cue near the hazard (`JUMP NOW!` / `SLIDE NOW!`). Thresholds: pit 3.5m, hurdles 4.5m, spikes 4m, rollers 4.5m, low beams 5m before the hint's end marker. Wall/slalom cues remain unchanged until their safe trigger timing is measured.
- `src/components/Hud.tsx`: urgent cues use a pulsing rose banner; regular tips keep the amber style.
- Manual browser verification at isolated port 5190 with a browser-only fixed random value: pit tip was amber at 20m, became rose `JUMP NOW!` at 42m, and a jump passed at 47m with all 3 lives. No product RNG or saved randomness was changed.
- A later wall/hurdle automation attempt did not follow the known safe control route; it reached game over at 136m with 0 lives. Treat wall and hurdle route verification as incomplete; do not infer the hint caused or fixed that failure.
- `npm run typecheck`, `npm run build` (912.43 kB / gzip 247.73 kB), and `git diff --check` passed. Test-only 5190 preview/browser were stopped/closed. User listening preview remains at 5189; Ear Cleaning at 5173 was untouched.
- Next: correct/re-run the wall control sequence and verify hurdle and low-beam cues; then test random/later patterns and mobile presentation. Overall goal remains active.

## Mode-aware hazard cues and repeatable route (2026-10-05)

- `src/game/engine.ts`: moved urgent thresholds to a module constant so `updateHints()` does not allocate lookup objects each frame. Urgent advice now matches the active dimension: pits/spikes tell 3D players to shift to 2D and jump; hurdles/rollers give a 3D dodge cue; low beams tell 3D players to shift first and then slide.
- A fresh browser origin verified tutorial behavior with an isolated `Math.random = () => 0.9` override (browser only). At 68m, shifted to 3D and steered around the wall through 85m. Returned to 2D, jumped the three hurdles at 112/122/132m, and entered the hidden gate by 190m; all three lives remained.
- After the gate, the low-beam hint first appeared in 3D at 209m as `Shift to 2D, then press DOWN to slide under.` At 217m, after switching to 2D, it changed to the rose urgent `SLIDE NOW!`. Holding DOWN cleared the test low-beam cluster through 241m with all three lives intact.
- This successful repeat supersedes the inconclusive route attempt: it records live mode and energy and confirms the wall/hurdle/gate sequence. The earlier failed attempt remains in history as a failed test path, not a confirmed product defect.
- Typecheck and production build passed after the mode-aware update; build output was 912.66 kB (gzip 247.83 kB). `git diff --check` passed. Temporary test ports 5190/5191 and browser sessions were stopped; user listening preview 5189 remains.
- Next: continue later-pattern, mobile/narrow viewport, portal/save lifecycle and retention checks. Music's human listening review remains open; no completion claim for the overall quality goal.

## Broken-bridge jumps and narrow touch pass (2026-10-05)

- `src/game/world.ts`: split the broken-bridge hint into two actionable cues: jump to the first raised pillar, then jump again from pillar one to pillar two.
- `src/game/engine.ts`: added dimension-aware urgent text for both bridge jumps. The first cue triggers 2.8m before the gap because the pillars are raised 1.5m; the second triggers 2.5m before the end of the first pillar.
- Fresh-origin deterministic browser route verified the first pillar cue at 271m and the second at 279m; jumps at 271m and 281m cleared the bridge through 291m with all 3 lives.
- Touch simulation at 390×844 enabled the actual coarse-pointer HUD. No horizontal overflow. Tap jump cleared the pit at 47m; tap SHIFT entered 3D by 69m; held DOWN cleared the wall through 85m; tap SHIFT returned to 2D; three touch jumps at 112/122/132m left all 3 lives at 133m. This verifies touch handlers in browser emulation; physical-device testing remains outstanding.
- Latest typecheck and production build passed (912.91 kB / gzip 247.93 kB); `git diff --check` passed. Test browser/port 5192 stopped; listening preview 5189 remains.
- Next: verify remaining random patterns (spikes, rollers, slalom), small-height mobile layouts, then Poki lifecycle/save, retention, and human BGM review.

## Directional slalom cues (2026-10-05)

- `src/game/world.ts`: replaced the single generic slalom tip with a direction-specific hint for each alternating gap; the generated route indicates DOWN/UP/DOWN or the reverse based on its actual gap layout.
- `src/game/engine.ts`: each slalom hint becomes urgent 8m before its wall. In 2D it says to shift to 3D and move in the indicated direction; in 3D it says to move through the gap.
- Browser-side direct `World.pSlalom(500)` generation with fixed random 0.9 produced walls at 500/513/526m and hints `slalomDown1`, `slalomUp2`, `slalomDown3` at 470–500, 483–513, and 496–526m. This confirms generated direction order and cue windows, not collision survival.
- A full forced-pattern browser route ended at 423m before the slalom cue sequence was captured; actual in-run slalom cue/clearance remains unverified. Do not count slalom playability as complete.
- Typecheck, production build (913.21 kB / gzip 248.10 kB), and diff check passed. Test browser/port 5193 stopped; user listening preview 5189 remains.
- Next: isolate an actual slalom in-run pass, then verify spikes and moving rollers. Follow with mobile height, Poki/save lifecycle, retention, and listening review.

## Slalom steering and HUD refresh correction (2026-10-05)

- `src/game/engine.ts`: increased all alternating slalom urgent windows from 8m to 10m. The first tested turn at 8m left too little depth-steering distance for reversing from the prior gap.
- `pushHud()` now recalculates the active contextual hint before publishing HUD data whenever a run is active. This prevents the previous direction cue from lingering after position or dimension changes such as crash recovery.
- Fresh-origin browser run forced a slalom pattern only after 300m and used a temporary collision shield for the approach obstacles; the slalom itself used normal collision handling and player input. At 414m, DOWN carried through wall 424 to 427m; at 427m, UP carried through wall 437 to 440m; at 440m, DOWN carried through wall 450 to 453m. All 3 lives remained, with no collision events around the three slalom walls.
- This verifies one injected three-wall slalom segment, not a fully unassisted random run or the crash-recovery refresh branch.
- Typecheck, production build (913.28 kB / gzip 248.12 kB), and `git diff --check` passed. Temporary port 5196/browser stopped; user preview 5189 remains.
- Next: spikes and moving rollers in actual gameplay, then whole-run randomized coverage, short-height/touch device, Poki/save lifecycle, retention and human music review.


## Per-obstacle spike and roller cues (2026-10-05)

- `src/game/world.ts`: assigned separate hint keys and lead-in ranges to both full-width spike strips (`spike1/2`) and all three moving rollers (`roller1/2/3`). Every obstacle now gets its own repeatable cue.
- `src/game/engine.ts`: added urgent windows for each key. In 3D, ordinary spike guidance says to shift to 2D; urgent spike and roller guidance says `SHIFT 2D + JUMP!`.
- Browser runtime check imported the actual World and GameEngine modules, generated both patterns, and called the hint update at each of the five hazard windows. All five returned their own key, urgent=true, and the 3D shift-and-jump cue. This checked cue selection, not collision clearance or a natural random run.
- Browser console: 0 errors and 0 warnings. Typecheck and production build passed; build output 913.54 kB (gzip 248.22 kB). `git diff --check` passed.
- Next: verify obstacle clearance for spikes and rollers in controlled live gameplay, then continue remaining random patterns, mobile height, Poki/save lifecycle, retention, and human music review. User preview port 5189 remains in use.


## Live spike/roller clearance and low-height HUD (2026-10-05)

- Controlled real-browser segment used the game's actual `GameEngine` movement, jump, and collision code. Test-only setup placed two spike strips at 320/330m and moving rollers at 360/370/380m; the player pressed W when each shipped urgent cue became active. At checkpoints 324/334/362/372/383m, lives stayed at 3 and collision count stayed at 0 for every obstacle.
- This proves a controlled injected segment with intended cue-timed input; it does not prove a full unassisted random run. After the target segment, the ordinary generated route later produced collisions outside the tested hazard region.
- At 844x390, the live HUD had no page overflow (document remained 844x390). The dimension bar fit at x237..563, y20..50; energy gauge fit at x162..682, y102..168. Fine-pointer browser emulation only; coarse-pointer landscape and a physical phone remain unverified.
- Next: review portal/ad/save lifecycle behavior and test persistence; then continue full-run random coverage, retention, and human music review.


## Milestone progress correctness (2026-10-05)

- `src/components/Title.tsx`: fixed next-milestone display to read only the matching stat (lifetime orbs, gates, or best distance). The prior helper took the maximum of all three and could falsely show unrelated progress as completion.
- Fresh browser reloads with seeded local saves verified all three branches: orb target displayed 8/300 despite 1,500m and 40 gates; gate target displayed 3/10 despite 1,500m and 1,200 orbs; distance target displayed 12/500 despite 1,200 orbs and 40 gates. These values were read from the title after reload.
- Browser console errors/warnings: 0. Typecheck and production build passed (913.57 kB / gzip 248.23 kB); `git diff --check` passed.
- Next: verify ordinary save persistence and pause/revive/ad transitions through the mock SDK; then continue unassisted random-run coverage, the retry objective, and human music review.


## Save, pause, and mock-ad lifecycle (2026-10-05)

- Browser reload preserved seeded save values on the title: best score 321, farthest 765m, 4 runs, and 99 shards.
- A clean run exposed a keyboard pause defect: the visible pause button worked, but the P shortcut did not reach a paused screen. Moved P/Escape pause-resume handling to the App-level screen-aware shortcut and removed the duplicate engine shortcut branch.
- Post-fix browser check: P opened PAUSED at 1m; distance stayed 1m for 400ms; Escape resumed and distance advanced to 3m. The Pause button also stopped distance at 1m for 500ms and Resume advanced it to 6m.
- Mock rewarded-ad check on the isolated local build: a +9 coin reward doubled to +18 with the 2X label; the follow-up revive ad returned to active gameplay. No live portal SDK or inventory was available, so this does not verify real Poki/CrazyGames ad callbacks.
- Typecheck, production build (913.56 kB / gzip 248.22 kB), and `git diff --check` passed. Browser console: 0 errors, 0 warnings.
- Next: verify a natural random run and mobile coarse-pointer landscape, then do a first-minute retention pass, live-portal SDK review, and human music listening review.


## First-run distance target and short-screen result recovery (2026-10-05)

- Added a 100m distance milestone worth 25 shards before the existing orb/gate goals. The title now names the upcoming target and shows metric-specific progress; claimable rewards include the milestone label.
- Game-over summary now shows either next-goal progress or a reached-goal message directing the player to claim in the lobby.
- Browser with a fresh local save displayed NEXT 100 m reached - 0/100; a seeded best distance of 100m displayed 100 m reached - CLAIM +25. Controlled game-over states displayed 60/100 below target and the claim-ready message when 100m was already in the save.
- Fixed low-height game-over accessibility: at 844x390 the panel scroll area was 614px high; scrolling brought the Return to Carrot Village button from y=536..574 to y=312..350, and clicking it returned to the hub.
- This verifies goal presentation and overlay reachability, not a natural first-run completion rate or player-retention lift. Browser console: 0 errors, 0 warnings. Typecheck, production build (914.52 kB / gzip 248.49 kB), and git diff --check passed.
- Next: observe a natural first run to the 100m target and game-over flow, then continue random-route coverage, coarse-pointer landscape, live portal SDK verification, and human music review.

## Wall direction cue and collision verification (2026-10-05)

- Switched focus from Ear Cleaning to Dimension Shift Runner, following the project roadmap order.
- `src/game/world.ts`: each generated wall now receives `wallUp` or `wallDown` based on the actual open side. The early hint names the direction.
- `src/game/engine.ts`: added a 10m urgent window; 2D tells the player to shift and steer, while 3D tells the player to move through the named gap.
- An isolated Playwright browser exercised both orientations against the actual `World` and `GameEngine`: UP/DOWN hint matched the generated gap, open-side `findHit()` returned no obstacle, and center returned `wall`.
- A separate natural-RNG browser run reached 113m and showed the 100m reached/claim message, then ended at 113m. It did not isolate or prove wall clearance. Console errors/warnings: 0.
- Typecheck, production build (914.89 kB / gzip 248.59 kB), and `git diff --check` passed.
- Next: unassisted random-route review across later patterns, then touch landscape, portal lifecycle, retention measurement, and human BGM listening. Ear Cleaning work is paused at the user's request.

## Web Audio beat scheduling resilience (2026-10-05)

- Replaced per-beat `setInterval` note onset with a 25ms look-ahead scheduler keyed to `AudioContext.currentTime` (104 BPM lobby / 136 BPM run, sixteenth-note steps, 120ms scheduling horizon).
- If the main thread stalls by more than half a step, stale notes are skipped and the musical step advances instead of firing an overdue backlog together. Oscillators/noise use the scheduled audio time.
- Isolated live-browser run reported `track=game`, `AudioContext=running`; after 550ms it was at step 6 / 0.57s, after a deliberate 700ms main-thread block at step 13 / 1.29s, and after recovery at step 15 / 1.48s. No console errors/warnings. This is scheduler-state evidence, not a human listening assessment.
- Typecheck, production build (915.52 kB / gzip 248.81 kB), and `git diff --check` passed.
- Human review of tone, mix, and perceived musicality remains open. Continue natural route coverage, then portal/device checks and user listening review.

## Natural-route audit and per-hurdle directional cues (2026-10-05)

- An unassisted default-RNG run reached 109m. Actual urgent cues appeared at 42.5m (pit), 68.1m (wall), and 105.6m (hurdle); collisions followed at 51.5m (void after no pit input), 77.8m (wall with no shift/steer), and 109.8m (block with no jump). These are expected no-input failures; the cue timing matched the tested obstacle sequence.
- A separate natural-RNG run used only ordinary keyboard input and reached 300.2m with 1 life remaining. Instrumentation recorded two controller collisions (3D block at 134m and panel at 177.9m); because the automated policy did not properly steer around 3D blocks or sustain the vault route, this run is not evidence of product defects or a clean route.
- The run exposed a real guidance gap: `pHurdles` built three blocks but emitted one hint ending at block one. Blocks two and three had no per-obstacle urgent cue; the generic 3D cue also omitted the open-side direction.
- Fixed `pHurdles` to emit a distinct direction-aware hint for each block (`hurdleUp/Down1-3`). Urgent 2D cue says `JUMP NOW!`; urgent 3D cue names the exact direction to sidestep.
- Live engine checks covered both alternating pattern orientations (all six keys/texts). A focused actual movement/collision run injected blocks at 100/110/120m, followed the urgent W cues, and passed 126.5m with 3 lives and 0 collisions. This was a controlled pattern segment, not a full natural-route clearance.
- Typecheck, production build (915.73 kB / gzip 248.86 kB), and `git diff --check` passed. Browser console errors/warnings: 0.
- Next: improve the natural-route controller to steer around 3D blocks and stay in the vault lane, then continue touch/portal, retention, and human listening review.

## Vault lane guidance and gate traversal (2026-10-05)

- The vault's former hint ended at x0+2 while its panel/cap continued through x0+15.2; the hidden gate sat at z=-3.05, requiring a pre-wall UP steer in 3D. The old text did not name that direction or remind players through the panel.
- Replaced it with a pre-wall `vault` cue and an in-panel `vaultGate` cue. Urgent 2D copy requests SHIFT 3D + UP; 3D copy requests moving UP before the wall and staying in 3D toward the gate.
- Actual GameEngine pattern injection at x=100, player start x=88: SPACE + W followed the cues, crossed the panel, and entered the gate at x=119.7. Lives remained 3, collisions 0, and gate count reached 1. Observed cues at x=88, 101.3, and 103.7m. Controlled focused segment; not a full natural-run pass.
- Browser console errors/warnings: 0. Typecheck, production build (916.25 kB / gzip 249.05 kB), and `git diff --check` passed.
- Next: natural-run coverage with 3D block steering and vault timing, then touch/portal checks and human BGM review.
## 3D hurdle audit and natural-route controller limit (2026-10-05)

- Rechecked an actual randomized run through 400.1m: it reached gate 1, but had one collision at a 3D hurdle and one at a raised platform. Inspection showed the automation chose inputs from stale mode state (SPACE switched to 3D, then W was incorrectly reused as a jump) and began responding to a distant slalom cue too early. This invalidates that run as a gameplay verdict; do not count these as confirmed game defects or a clean route.
- Isolated the hurdle pattern in the real browser/World/GameEngine at 100/110/120m, followed each generated UP/DOWN cue with real keyboard movement in 3D, and passed through 126.4m with 3 lives and no collisions. All three directional urgent cues appeared. Console errors/warnings: 0.
- Controlled-segment result confirms the newly added per-hurdle guidance works for this orientation; it does not prove a full random route or human success rate.
- No gameplay source changed during this audit. Prior typecheck/build (916.25 kB / gzip 249.05 kB) remains the latest source verification; this turn's documentation changes are checked with git diff --check.
- Next: correct the QA controller to re-read mode after dimension switches and answer 3D slalom cues only when imminent, then rerun the later patterns. Keep Ear Cleaning paused. Physical-device, live portal, natural completion/retention and human BGM listening remain open.

## Low-beam warning and hold cue repair (2026-10-05)

- Natural RNG controller audit reached 960.8m and entered 3 gates. Its three remaining crashes were at two slalom turns and a low beam; this metadata-assisted controller run is not proof of human route success or a clean run. The slalom failures remain for focused review.
- Confirmed the low-beam warning was scheduled through `beamStart + 4m` while the urgent window was 5m, so `SLIDE NOW!` appeared 1m after entering the beam. Only the first beam in a group had a hint.
- Changed low-beam generation to give each of up to three beams an approach cue ending at the beam start, plus a hold cue through the beam's trailing edge. Context text now tells players when to enter 2D and when to keep holding DOWN.
- Focused live GameEngine test passed 3 injected beams at ~11.6m/s (player distance 260–326m), at 280m, 294.45m, and 308.9m. Urgent prompts began 4.92–4.98m before each beam; hold cues stayed active through each beam; lives stayed at 3 with zero collisions through 326m. The earlier 17m/s label was incorrect. Browser console errors/warnings: 0.
- Typecheck, production build (916.66 kB / gzip 249.20 kB), and `git diff --check` passed.
- Next: isolate remaining slalom turns with a controller that stays in 3D for the full connected wall group; then continue natural-route, touch, portal, retention, and human music checks. Ear Cleaning remains paused.

## Focused 3D slalom validation (2026-10-05)

- Injected the actual `World.pSlalom` pattern into the real GameEngine at 450/463/476m. The player ran from 412m to 486m, so speed was ~12.1–12.4m/s, not max speed. Followed only the currently displayed direction cue: switch to 3D at its urgent cue, then steer W/S through each opening and remain in 3D through the sequence.
- Both alternating layouts passed: DOWN→UP→DOWN and UP→DOWN→UP. Each run reached 486m with 3 lives, 0 collisions, and about 65.97 energy remaining; cues changed at each wall and the mode returned to 2D after the group. Browser console errors/warnings: 0.
- This controlled test indicates the slalom is clearable in both orientations at the tested 12.1–12.4m/s speed. It does not prove full natural-route success or retention. The previous metadata-assisted random run remains inconclusive because its controller dropped out of 3D mid-sequence.
- No gameplay source changed in this focused review. Next: update the route controller to keep dimension state across connected wall cues and continue randomized, mobile, portal, and human audio review.


## Speed-scaled spike cue window (2026-10-05)

- A live natural-route trace at about 11.7m/s showed the 4m urgent cue could still prompt too early: the second spike hit while the player was descending, just below the collision height threshold. The earlier browser tab had cached the pre-fix module; reloading showed the new source clearly.
- Updated `src/game/engine.ts` so spike urgent cues use `min(existing urgent window, speed × 0.28 seconds)`. This keeps roughly the same reaction time at low and high speeds while retaining the existing 4m maximum.
- Actual-source isolated GameEngine runs following only active urgent cues passed consecutive spike strips at 314/324m and 1,710/1,720m. At ~11.8m/s both cues began about 3.2m before each strip; at 17m/s the first began 3.78m before entry and the second arrived midair, where the 0.22s jump buffer queued the next jump. Both runs ended with 3 lives and no hit trace.
- Typecheck, production build (916.74 kB / gzip 249.23 kB), and `git diff --check` passed. Browser log has informational startup/mock-ad messages and no errors or warnings.
- Next: resume natural-route pattern coverage with the updated source. Full route/human/device/portal/music quality checks remain open; Ear Cleaning remains paused.

## Route audit with repeatable QA cues and max-speed hazards (2026-10-05)

- Discarded the earlier 700m automated run: its controller held W during a 2D vault approach, creating unintended jumps. A later run that followed only ordinary active prompts reached 859m but lost all lives after repeated hint keys stopped appearing at their configured three-view limit. That result measures a hint-dependent controller, not an unassisted player or a confirmed gameplay defect. Captured hits were void falls at 604.5m and 782.8m, then a 2D roller at 859.3m; the last roller is expected to be jumpable in 2D.
- Corrected the controller to release W in 2D while waiting for a 3D cue. In an isolated QA run only, the harness reset hint counters so repeated prompts remained visible; it followed live GameEngine cues through seeded procedural generation to 1,200m at 15.12m/s, with 4 gates, all 3 lives, and zero collision callbacks. Patterns included pits, wall gaps, hurdles, vaults, hops, rollers, low beams, and spikes. This is not a normal-save retention or unscripted human test.
- At actual top speed (17m/s from 1,690m), focused real-engine patterns passed using keyboard input from active cues: DOWN→UP→DOWN slalom walls (1,710/1,723/1,736m), 3 hurdles (1,710/1,721.4/1,732.8m), and 3 low beams (first at 1,710m). Each finished with 3 lives and no collision trace; slalom ended with 66.7 energy.
- No product source changed in this audit. Earlier isolated 17m/s consecutive spikes also passed with 3 lives after the 0.22s jump buffer and speed-scaled urgent cue fix.
- Browser console errors/warnings: 0. Next: inspect stage-2+ natural route patterns and the repeated-hint experience; then resume touch, portal, music listening, presentation, and release audits. Ear Cleaning remains paused.

## Familiar hazard hint fallback (2026-10-05)

- Found `hintCounts` persisted for the life of the save and `updateHints` hid a repeated key completely after its third display. Returning players could lose even the immediate action cue.
- Changed familiar-hint filtering in `src/game/engine.ts`: familiar 2D hazards stay quiet until their urgent window, then show the action prompt. Walls, slaloms, vault cues, and all hazards while in 3D keep their early warning because they require dimension changes or directional setup.
- Browser-executed source method checks: a 2D pit/spike at `seen=3` stayed quiet at 20m remaining and showed `JUMP NOW!` within the urgent window; wall/vault/slalom remained visible early; 3D spike/beam retained early setup guidance; first-time pit cue unchanged. Displaying a familiar cue increments its saved count to 4.
- Typecheck passed. Production build passed (916.84 kB / gzip 249.27 kB). Browser console errors/warnings: 0. `git diff --check` passed.
- Next: verify repeated-hint behavior through a full save/reload run, then continue stage-2+, touch, live portal, music listening, presentation, and release audits. Ear Cleaning remains paused.

## Familiar hint save/reload verification (2026-10-05)

- Isolated browser App save was seeded with `pit:3`, then a normal UI run started. When the familiar pit cue appeared, the App's `hintShown` handler raised the count to 4; a full page reload retained `pit:4`.
- The prior live `updateHints` checks verified that familiar 2D pit/spike guidance stays hidden before urgency and returns as `JUMP NOW!`; early wall/vault/slalom setup and 3D hazard cues remain visible. The first-time pit cue remained unchanged.
- The no-input UI run later ended at 117m after additional hazards. This verifies save integration and cue lifecycle, not a clean full run.
- Typecheck, production build (916.84 kB / gzip 249.27 kB), `git diff --check`, and browser console (0 errors/warnings) passed. Next: stage-2+ route coverage; then device, portal, music, and release audits.

## Stage boundary continuity (2026-10-05)

- Replayed the actual `GameEngine.updatePlaying` around 499.9m and 999.9m with low energy and disabled only procedural spawning. Stage 2 began at 501.09m: one Stage 1 clear event, HUD zone 2, `COTTON CANDY`, energy restored to 100, and 2.32s invulnerability after six 16ms updates. Stage 3 began at 1,001.28m: one Stage 2 clear event, HUD zone 3, `BATHROOM ESCAPE`, energy restored to 100, same invulnerability.
- No duplicate stage event or run interruption observed. Controlled boundary injection; does not verify visual/audio quality or natural completion at those boundaries.
- No source changed. Browser console errors/warnings: 0; `git diff --check` passed. Next: natural stage-2+ route and visual/audio transition review, then device, live portal, human music, and release checks.

## Gate/stage zone monotonicity repair (2026-10-05)

- Found real progression bug: `enterGate` increments `run.zone`, while `advanceStage` assigned distance stage directly. Two gates before 500m could move HUD/theme from Zone 3 back to Zone 2.
- Changed stage advancement to `Math.max(run.zone, stageNum)`, preserving gate-earned progress. Stage toast now says whether it opened a new zone or the current gate-earned zone continues.
- Current-source browser checks: no-gate stage 1 advanced to Zone 2/COTTON CANDY; two-gate stage 1 remained Zone 3/BATHROOM ESCAPE; stage 2 from zone index 1 advanced to Zone 3. Each restored energy to 100 and granted 2.32s invulnerability after six 16ms updates. Toast text matched each case.
- Actual isolated App run reached 515m after two gates: HUD stayed Zone 3/BATHROOM ESCAPE, lives 3, energy 100; stage 1 callback ran once at 500.05m, zone 2→2, energy 99.9→100; stage fanfare called once, AudioContext stayed running on game track.
- Typecheck and production build passed (916.93 kB / gzip 249.30 kB). Browser console errors/warnings: 0; `git diff --check` passed. No tests added. Next: late-stage natural route/visual review, touch/device, live portal, human BGM, presentation, release.

## Stage progress HUD and accurate gate summary (2026-10-05)

- Added distance-derived stage number, progress fraction, and meters remaining to `HudState` in `src/game/types.ts` and `src/game/engine.ts`. Stages use the same 500m boundaries as `advanceStage`.
- Added a compact accessible progress bar beneath the score/distance row in `src/components/Hud.tsx`. It identifies the current stage and meters until the next clear.
- Fixed `src/components/Overlays.tsx`: the game-over third stat was labeled `STAGE` while showing `result.gates + 1`; it now accurately reports the number of gates as `GATES`.
- Verification: `npm run typecheck`, `npm run build` (919.89 kB / gzip 249.86 kB), `git diff --check`, and local preview HTTP 200 passed. Playwright on the running preview showed `STAGE 1 · 394m TO CLEAR` at 106m, then `STAGE 1 · 475m TO CLEAR` at 25m. Game-over UI displayed `GATES 0`. At 390×844, HUD elements remained present and console errors/warnings were 0. The game later ended naturally around 110m; the mobile check did not verify physical-device behavior.
- Next: replace repeated audit-only turns with one user-visible game depth improvement: design a short, repeatable stage objective/reward loop using current carrots, gates, and shards; verify it through the running game. Then finish real device, live Poki portal, and human BGM reviews. Ear Cleaning stays paused.

## Rotating stage contracts and shard rewards (2026-10-05)

- Rechecked the CrazyGames reference: its page highlights solo/online/group modes, selectable characters and levels, training/events, and combat combos. For this runner, the aligned loop uses its existing movement dimensions, carrots, hidden gates, and clean execution rather than introducing unrelated fighting mechanics. Source: https://www.crazygames.com/kr/game/super-smash-flash
- Initial tuning used 12 carrots (+20 shards) for Stage 1. A later live route showed it became ready before 100m; current target/reward is 36 carrots/+25 shards. Stage 2 finds a hidden gate (+30), Stage 3 clears 500m without a hit (+45). Later cycles scale carrot target/reward. Existing shard multiplier applies; counters reset at the exact 500m boundary.
- HUD now shows the current contract, progress, READY/FAILED state, and reward. Game Over itemizes stage-contract shards; existing save flow credits the combined shard payout. Missed contracts pay 0.
- Found and fixed a mobile HUD overlap introduced by the added contract card: at 390×844, the stage card had collided with the energy gauge. Moved the narrow-screen energy and hazard hint rows down; a fresh screenshot shows distinct rows and readable controls.
- Verification: typecheck/build passed (923.57 kB / gzip 250.80 kB), `git diff --check`, preview HTTP 200, and Playwright console 0 errors/warnings. Live browser showed `CARROT HAUL 0/12`, stage progress, energy, and a pit cue at 24m in 390×844. Current-source engine instrumentation reported stage HUD active/ready/failed states; Stage 1 carrot completion banked 20, Stage 2 gate completion 30, Stage 3 clean completion 45, hit stage 3/missed objectives 0. A 500m Stage 1 engine payout with 12 carrots was 38 total shards (18 base + 20 contract). This is controlled engine verification; no natural 500m human run or actual phone test has been completed.
- Next: refine the generated game track's arrangement and long-loop variation, then validate playback in the browser. Human listening, actual phone, live Poki portal, overall visual polish and release audits remain open.

## Four-phrase game music arrangement (2026-10-05)

- `src/game/audio.ts`: extended the game BGM loop from 64 to 128 scheduler steps (about 14.1s at 136 BPM). Added a third reprise and fourth resolving phrase so the lead does not repeat after ~7s.
- Softened the square/saw-heavy lead into a triangle melody with lower sine harmonics; reduced chord-stab levels while retaining the beat, bass groove, and 2D/3D filter change.
- Typecheck and production build passed (923.90 kB / gzip 250.90 kB); diff-check passed. In the actual browser, AudioContext was `running`, game track stayed selected, and the scheduler advanced beyond step 128 into its second loop. Console errors/warnings: 0.
- This verifies scheduling and playback state only. The assistant has not judged human perception of melody, mix balance, or long-session fatigue; retain user listening as a required quality gate.
- Next: verify contract loop through full App stage transition/credit where practical; ask for direct listening feedback only after leaving the preview ready. Then real-device touch, live Poki lifecycle and ad behavior, visual/audio audit, and release verification. Goal remains active.

## Full App contract payout integration (2026-10-05)

- Used an isolated Playwright origin with a real mounted App and its actual `GameEngine`, React event callback, Game Over overlay, and localStorage save. Test-only engine state injection placed the player at 499.9m with 12 stage carrots, then ran the real `updatePlaying` across 500m. The actual stage-clear path banked 20 contract shards and moved HUD stage to 2 before the next segment.
- Triggered the engine's normal game-over event after the boundary. The App showed `+38 CARROT COINS` and `STAGE CONTRACTS +20 INCLUDED`; isolated save advanced to bestDist 500, runs 2, totalOrbs 24, and shards 47. The preceding run had contributed 9 shards, so this run's 38 were credited once. This supersedes the earlier engine-only payout check as App/save integration evidence.
- This was controlled boundary injection through the real mounted App, not a natural 500m player route. Console errors/warnings: 0. Preview server remains available at http://127.0.0.1:5189/.
- Goal remains active: natural stage route and human BGM judgment, actual mobile device, live Poki portal, broader visual quality and release checks remain unverified.

## Procedural Stage 1 route and contract retuning (2026-10-05)

- Ran the actual App on an unmodified random procedural route. A browser controller interpreted live HUD cues and dispatched keyboard events. It reached 505m with 3 lives, 0 hits, 123 carrots, 1 hidden gate, 100 energy, and 25 contract shards banked. The HUD showed the 36-carrot contract active at 100m with 14, and ready by 200m with 44.
- Earlier route data exposed 12 carrots as too easy: the first tune was ready before 100m. Raised Stage 1 to 36 carrots and reward from 20 to 25. Current-source checks: 33/36 at 200m stays active; 43/36 at 250m is ready; cycle Stage 4 scales to 42/30. Live App displayed `0/36 · +25 SHARDS` at 26m.
- After controller input stopped at 505m, gameplay continued without input and ended at 627m. Game Over showed `+131 CARROT COINS` with `STAGE CONTRACTS +25 INCLUDED`. Isolated App localStorage holds 288 shards, 4 runs, best distance 666, and 293 lifetime carrots; these are profile totals including prior runs, not this run's delta.
- Typecheck/build passed (924.09 kB / gzip 250.91 kB), diff-check, preview HTTP 200, and browser console 0 errors/warnings. This was automated cue following, not human play. Stage 2 gate mission, human BGM, phone, and live portal remain open.

## Procedural Stage 2 gate contract and payout (2026-10-05)

- Fresh isolated browser profile; normal world randomness remained enabled. A browser controller followed live hazard prompts with keyboard events. At 880m, the actual HUD showed Stage 2 `HIDDEN GATE · READY`, +30 shards, 3 gates, and all 3 lives.
- Crossed the 1,000m boundary through the real engine/App path. HUD advanced to Stage 3 and displayed `HIDDEN GATE COMPLETE · +30 SHARDS BANKED`; the two crossed stage transitions ran once each, restored energy, and triggered two clear fanfare callbacks.
- Controller stopped issuing actions at 1,015m with 3 lives. Unassisted play continued to 1,419m and ended after two further hits. Stage 3 `NO-HIT SPRINT` correctly changed to FAILED. Game Over showed `+272 CARROT COINS` and `STAGE CONTRACTS +55 INCLUDED` (Stage 1 +25 and Stage 2 +30).
- Isolated localStorage confirmed `shards:272`, `bestDist:1419`, `totalOrbs:250`, `totalGates:3`, and `runs:1`. This profile began with zero runs and zero best distance. Console had 0 errors / 0 warnings; only expected React DevTools and local mock Ads SDK info.
- This verifies one cue-driven automated natural route, not human play; the post-1,015m segment was deliberately unassisted. Typecheck/build were verified for the same source revision in the previous checkpoint (924.09 kB / gzip 250.91 kB); no source code changed in this step.
- Next: run a fresh cue-driven route through Stage 3 to test whether the 500m no-hit contract can be achieved. Physical-device touch, live Poki, human BGM listening, and presentation/release review remain open.

## Stage 3 no-hit route, roller cue fix, and full contract payout (2026-10-05)

- First fresh random route reached Stage 3 but hit roller3 at 1,407.21m. Collision telemetry showed 2D mode, player y=1.19, rising at vy=8.79, speed=15.5m/s. Roller obstacle top is y=1.3; the 4.5m urgent cue was too late to gain safe height at this speed. This invalidated my earlier spoken claim that Stage 3 had 0 collisions; the stage contract was not completed in that run, and Game Over correctly showed only the prior +55 contract shards.
- Updated `src/game/engine.ts` roller urgent window to `min(7m, speed × 0.42s)`, aligning the cue with the necessary jump rise time while limiting its maximum lead. Existing player code did not change.
- Typecheck and production build passed; build output 924.15 kB / gzip 250.93 kB. In a fresh isolated browser profile with normal procedural randomness, the controller followed actual HUD cues to 1,515m with 3 lives, 6 gates, and no collisions. Engine trace showed stage transitions at ~500/1,000/1,500m; stage fanfare fired 3 times. Stage 3 no-hit contract completed at its boundary.
- Continued without controller input from 1,515m to Game Over at 1,861m. UI showed `+396 CARROT COINS` and `STAGE CONTRACTS +100 INCLUDED` (Stage 1 +25, Stage 2 +30, Stage 3 +45). Isolated save confirmed `shards:396`, `bestDist:1861`, `totalOrbs:305`, `totalGates:6`, and `runs:1`. Console 0 errors / 0 warnings; preview HTTP 200; diff-check passed.
- Verification was automated cue-following on one unmodified random seed, not human play or broad seed coverage. Earlier inaccurate Stage 3 statement was explicitly corrected before continuing.
- Next: physical-device touch/input, live Poki SDK/lifecycle, human BGM review, presentation, and release checks. Full-quality objective remains active.

## Mobile title-screen layout refinement (2026-10-05)

- Inspected the actual title screen at desktop and narrow sizes. At 390×844, the page was 878px tall and the bottom record row was partly below the first view. The top reward and milestone pills wrapped into two tight rows but did not geometrically overlap; earlier wording that they overlapped was inaccurate.
- Reduced only mobile spacing in `src/components/Title.tsx`; shared font/color tokens and `sm` desktop spacing remain unchanged.
- Rechecked browser rendering at 390×844: record row y=802.8–818.8, page scroll height 844, no horizontal overflow. At 1280×720, title/action/record elements stayed in bounds; page scroll height 720 and no horizontal overflow. Browser console errors: 0.
- Typecheck passed. Production build passed at 924.38 kB / gzip 250.97 kB. The 5189 preview remains HTTP 200; screenshot automation session closed after review.
- Next: inspect the in-run HUD visually at mobile dimensions, then continue real-device touch, Poki host lifecycle, human BGM review, visual quality, and release checks. The full music-and-quality objective remains active.

## Short-height Game Over layout (2026-10-05)

- Captured actual Game Over at 844×390. The original single-column card was 590px tall inside a 390px viewport; the action buttons extended below the visible screen.
- Restructured `src/components/Overlays.tsx`: when height is at most 520px, summary/reward details use the left column and all actions use the right column; normal-height portrait stays single-column. Did not alter shared colors, fonts, or project configuration.
- Rechecked browser rendering at 844×390: card y=54–336, overlay scroll height equals viewport (390), action buttons y=119–271. At 640×360, card y=39–321, all buttons end by y=256, and no scrolling is needed. At 390×844, card y=131–713 and buttons remain visible. Clicked Play Again at 640×360 and verified it started a new run.
- Browser console errors/warnings: 0/0. Typecheck passed; production build passed at 927.20 kB / gzip 251.36 kB; diff check passed. Preview `http://127.0.0.1:5189/` remains live.
- Next: broad mobile touch/device review, Poki-host lifecycle, real BGM listening, and full presentation/release checks. The overall goal is active and not yet verified complete.

## Mobile in-run HUD spacing and touch affordances (2026-10-05)

- Pixel 10 mobile emulation at 412×915 exposed a vertical collision: the Stage 1 reward label sat under the Dimension Energy heading. Moved the mobile energy gauge down from 8.2rem to 9.6rem and its hint banner from 12.6rem to 14.8rem; desktop `sm` offsets remain unchanged.
- Replayed the live app on a coarse-pointer mobile browser. Stage card and energy gauge now have visible separation; touch Jump, Slide, and Shift controls render in the expected bottom corners. The run started and displayed live HUD state. This is browser device emulation, not a physical phone or Poki-host check.
- Browser console: 0 errors / 0 warnings; informational local mock Ads SDK notice is expected. `npm run typecheck`, `npm run build` (927.20 kB / gzip 251.36 kB), and `git diff --check` passed.
- Next: verify touch interaction on a physical device if available, then live Poki lifecycle, human BGM listening, and broader visual/release review. Overall goal remains active and incomplete.

## Carrot-chain score reward (2026-10-05)

- Consecutive carrot pickups within 1.4 seconds now award real score. Chain x2 adds +10 bonus, scaling to +40 at the x5 cap; the popup shows the exact chain and bonus. A crash resets the active chain, while earned score remains banked.
- Fixed the old `+100!` popup that suggested a reward without actually changing score.
- A fresh unassisted procedural browser run collected 11 carrots and showed 363 points at 113m. Distance + base carrot score accounts for 223; the remaining 140 came from chain bonuses. This verifies one natural seed only, not broad balance or human play.
- Browser console errors/warnings: 0/0 (local mock Ads SDK notice and React DevTools hint were informational). Typecheck, production build (927.30 kB / gzip 251.40 kB), diff check, and preview HTTP 200 passed.
- Next: continue with a second player-facing depth feature, then broaden natural-route and human-play checks. Physical device, Poki-host behavior, and human BGM listening remain unverified. Overall goal is active and incomplete.

## Near-miss skill bonus (2026-10-05)

- Passing a deadly obstacle cleanly within 0.65m now adds +50 score and displays `NEAR MISS · +50`. The collision check runs first; clearances under 0.08m and invulnerability are excluded. Each obstacle is evaluated once per run. Score-only reward; no collision rules or shard economy changed.
- Controlled geometry through the live App engine placed the player 0.22m from a passed obstacle: score rose exactly 50, the popup rendered, and evaluating the same obstacle again did not reward twice. Tight-clearance and invulnerability guard checks both rejected rewards.
- One unassisted random run reached Game Over at 113m without a near-miss popup. Therefore the mechanic's natural trigger frequency and perceived balance remain unverified; this was controlled engine injection, not a human playthrough.
- `npm run typecheck`, production build (927.95 kB / gzip 251.67 kB), `git diff --check`, browser console (0 errors / warnings), and preview HTTP 200 passed. The local mock Ads SDK notice and React DevTools hint were informational.
- An earlier unassisted run ended at 113m without naturally triggering the reward; frequency still needed a route with deliberate hazard responses.
- Follow-up cue-guided route used the game's actual generated hazards and live hints, reached 515m with all 3 lives and no collision events, crossed the Stage 1 boundary, and paused in Stage 2. The live App awarded two natural near-misses at 343.56m and 353.51m (+100 combined). This is automated hint-following, not human play; broad seeds and perceived balance remain unverified.
- Two more fresh random routes using the same live-hint controller each reached 515m with 3 lives and no collision events. Run 2 awarded three near-misses at 325.20m, 335.12m, and 345.14m (+150); Run 3 awarded two at 371.84m and 382.07m (+100). Across three different routes, Stage 1 cleared 3/3 and near-miss fired 7 times total. This shows the bonus can occur across seeds; it does not establish human-perceived balance or broad seed reliability.
- Browser console errors/warnings: 0/0 (React DevTools and local mock Ads SDK messages were informational); preview HTTP 200 and `git diff --check` passed. Typecheck/build were already verified for this source revision before the route.
- Next: add one direct player-facing depth improvement, then check it in human play. Continue physical-device, live Poki, BGM listening, and presentation checks. Overall goal remains active and incomplete.

## Shareable score challenge (2026-10-06)

- Game Over now shares score, distance, carrots, and gates in a `runner_challenge` URL; title screen displays the received target and offers `Race this score`.
- The route remains randomly generated, so the invite is a score target rather than a same-seed replay.
- Production build and `git diff --check` passed (931.59 kB / gzip 252.66 kB). Isolated browser opened `score=12500&distance=930&carrots=18&gates=2` and rendered matching challenge stats.
- Actual Game Over result share payload/device sharing and physical touch remain unverified.


## Reproducible friend challenge — 2026-10-06

- Added `routeSeed` to run config/results and challenge URLs. World procedural randomness now comes from a seedable generator during a run; ordinary runs choose a seed, and seeded invitation runs reuse the sender's seed.
- Older links lacking a seed still open and disclose that only the score target is shared. Browser verification: seeded challenge rendered, “Race this score” opened Stage 1 gameplay (27 m observed), with 0 console errors/warnings after a fresh reload; legacy challenge displayed its compatibility note.
- Production TypeScript/Vite build passed (932.24 kB / gzip 252.89 kB), `git diff --check` passed with line-ending notices only. One recursion error found by the first browser load was corrected before final verification.
- Still pending: pixel/layout comparison of the same seed across separate clean contexts and live Poki SDK link behavior.


## Poki rewarded-action label — 2026-10-06

- Replaced television icons with the 🎬 marker on revive and double-coin rewarded actions. Build passed (932.24 kB / gzip 252.89 kB), `git diff --check` passed.
