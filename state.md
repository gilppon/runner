# Dimension Shift Runner — Progress State

## Current objective

Upgrade Dimension Shift Runner's complete art direction and in-game backgrounds into a cohesive, polished browser-game presentation. Keep the game compliant with current official Poki and CrazyGames requirements; implement and run locally, but do not submit or change portal accounts. See [ART_DIRECTION_PLAN.md](ART_DIRECTION_PLAN.md).

## Active art and background goal (2026-10-12)

- **Scope clarification:** the previous local audit closeout covered targeted UI and existing-system review; it did not mean the complete art or biome-background upgrade was finished. This new goal covers the art direction, title/gameplay backdrop, biome scenery, Hub/tower presentation, and supporting visual polish.
- **Baseline found:** five biome palettes currently share most of the same clouds, rounded hills, broccoli-shaped trees, toy-city buildings, and oversized multicolor warp rings. Bathroom Escape has a distinct prop set, but the other scenes mostly change color rather than silhouette and landmark identity. The title and Carrot Meadow use the same scene backdrop.
- **Design direction:** “Dimensional Pocket Worlds”—a cohesive, hand-crafted low-poly toy diorama with stronger material definition, layered atmospheric depth, recognizable per-biome landmarks, a cleaner horizon, and obstacle/player contrast kept above decorative scenery.
- **Implementation approach:** reuse procedural geometry and materials, add only a small number of bundled resources if they materially improve the result, and avoid remote art requests or large background images. No gameplay rules, economy, SDK event flow, or portal account settings are in scope.
- **Platform guardrails checked on 2026-10-12:** Poki requires a responsive full-canvas 16:9 experience and desktop/mobile/tablet support, bundles local assets instead of external requests, and recommends a small fast-loading build. CrazyGames documents ≤50 MB initial download (≤20 MB for mobile homepage eligibility), ≤250 MB total, relative bundle paths, and smooth operation on 4 GB Chromebook-class devices. These are technical limits, not a guarantee of portal acceptance.
- **Implemented:** added five lightweight inline SVG landscapes, connected them to the live biome backgrounds and 2D/3D view, reduced generic scenery, moved decorative props behind the runner, retuned title colors/actions, and refined the Hub tower blueprint. No external art requests or gameplay-rule changes were added in this art pass.
- **Visual verification:** inspected distinct artwork for all five biomes in the isolated local browser. Checked live-play contrast in Cotton Candy, Bathroom Escape, Sunny Park, and Moonlight Picnic; Moonlight was checked in both 2D and 3D. Carrot Meadow was checked in the default title and earlier 2D/3D baseline views. Checked title and Hub layouts at desktop 16:9, portrait, and compact mobile sizes; primary controls remained visible without horizontal overflow.
- **Code verification:** `npm run typecheck` and `git diff --check` pass. The local HMR game runs.
- **Build verification:** the standard `npm run build` encounters a Windows sandbox mismatch: Vite 7.3.2's `realpathSync.native` returns `EPERM` for `index.html`, while Node's non-native `realpathSync` succeeds. A one-off Vite build API call with `resolve.preserveSymlinks: true` completed without editing project config and generated the single-file `dist/index.html` (983,434 bytes; 267,144 bytes gzip). The built HTML has no external script or stylesheet links. That is comfortably under CrazyGames' documented 20 MB mobile / 50 MB initial and 250 MB total limits, while supporting Poki's fast-loading guidance. The standard-command environment limitation remains documented.
- **External verification remaining:** portal preview, real-device performance/feel, and approval require the user's own Poki/CrazyGames submission and target devices. This work did not access portal accounts or submit a build.

## Previous share refinement (completed; not the active scope)

- The staged viral-loop plan is in `VIRALITY_REFINEMENT_PLAN.md`; no multiplayer, new currency, external account, or portal leaderboard is in scope for the first iteration.
- Share URLs now carry the run mode, course seed, and record summary. Gate Trial invitations open in Gate Trial rather than silently falling back to a normal run.
- The same seed does not guarantee equal player conditions: current pet and upgrade bonuses remain active. The result now frames this as a same-course record challenge and discloses that the player's current perks and upgrades apply.
- The title and result screens distinguish today's fixed Gate Trial from an older shared course. The result reports whether the incoming score was beaten, tied, or remains ahead.
- Share feedback distinguishes a completed share/copy, a user-cancelled share, and a copy failure; cancellation never claims success and does not trigger a clipboard fallback.
- First implementation complete. Tested today's and yesterday's Gate Trial links, confirmed past-course labels, Gate Trial flow, and score comparison. A compact 390×520 and landscape 844×390 pass also found and fixed a clipped share button; all result buttons now fit in the five tested desktop, portrait, compact, landscape, and narrow-phone viewports. Do not touch the user's existing game tab or save data.
- A temporary isolated Chrome/Playwright run verified successful share, user cancellation, clipboard fallback, and clipboard failure with mocked APIs; no actual invitation or clipboard write occurred. The temporary scripts were removed.
- The share-refinement build at that point produced `dist/index.html` 963.48 kB (gzip 260.62 kB). A later audit rebuild attempt hit the recorded Windows resolver error; subsequent production builds passed and are recorded in the dated audit entries below.
- The prior portal release-preparation goal is paused; its outstanding listener, device, and hosted-build gates are not part of this new objective. No portal upload or account action has occurred.

## Current detailed design audit

- The local completion record and external release gates are recorded in `CURRENT_GAME_STATUS_AUDIT.md`.
- A deterministic world-generator replay covered 24 seeds × 2,500 m across all five scheduled themes; every route produced all nine hazard pattern types and no adjacent pattern types repeated. This is generation coverage, not a collision-avoidance or human-play simulation.
- The sampled screen journey now includes standard title, 320×568 gameplay HUD and Game Over, Hub, a same-day Gate Trial challenge, and a friend-record challenge. A fixed top challenge card used to cover the 2D/3D logo and duplicate the start action; it is now an inline summary, the main action names its route, and the same-day Trial button is not duplicated.
- A fresh-profile Hybrid Tower screenshot at 1280×720 confirmed its preview artwork sat below the initial viewport while the left panel was mostly empty. `md:items-start` now keeps the preview compact; isolated browser checks at 1280×720, 390×844, and 390×520 confirmed visible floor art, a scrollable floor list, and no document overflow.
- An isolated save confirmed Day 1 +30 claim protection and reload persistence; a 30-shard capacity purchase raised run HUD max energy from 100 to 114; a 40-shard shift-efficiency purchase showed its modifiers and also persisted after reload. The first 100 m milestone paid +25 once. Three normal runs paid +9, +9, and +7 shards; record, run count, and balances survived reload. A 55-shard first tower floor persisted and applied its +8% reward modifier in a later run. Two owned pets, Voxel Pup and Sprite Bat, can be switched in either direction and retain selection after reload; their 3D shift-cost and 2D energy-regeneration effects were observed.
- The game-over reward label `CARROT COINS` disagreed with the Hub's `Shards`, although both used the same `result.shards` / `save.shards` balance. The main payout and both regular-height and short-height double-reward actions now consistently say `SHARDS`; an isolated live result showed `+9 SHARDS` and `Watch Ad · Double Shards` together.
- In a local QA sequence starting at 552 shards, revive refunded the provisional +9, the continued 159 m run paid +20 once, double reward displayed +40 and removed its action, and the next +9 result remained +9 after `Skip (forfeit reward)`. Hub showed 601, consistent with no duplicate double payout. During the mock ad, replay and reward actions were disabled. This confirms local flows only, not live host callbacks.
- A separate fresh-profile check claimed Day 1 +30 once. The attendance code uses the local calendar day while Gate Trial seeds use UTC; help text now discloses both date semantics, and the Trial description discloses that current pets/upgrades still affect the run.
- Three independent fresh profiles reached 111–113 m without player input and unlocked the 100 m milestone. This is verified opening behavior in those samples; whether it serves as a welcome reward or should teach a control remains a design decision. Do not change difficulty without deciding that intent.
- Portal source and official-doc review found local SDK event order aligned with current guidance; fake-SDK traces covered startup/lifecycle order, and restored save state is reapplied to React. Real host initialization, ad callbacks, portal save restoration, and host-specific preview/configuration still require the official test environments; no portal account or upload was used.
- No P0 blocker was identified in the read-only review. No numerical quality score is claimed because there is no representative human-play evidence.
- Current verification: after the final Title/App UI edit, `rtk npm run typecheck` and `rtk git diff --check` passed; the current local preview hot-reloaded and both challenge modes were rechecked at 320×568. The latest recorded successful production build before that edit is 959.56 kB (259.83 kB gzip). The final UI edit was not production-built; an earlier Vite resolver EPERM was recorded, so the typecheck and rendered preview are the post-edit verification evidence.

## Portal runner benchmark (2026-10-12)

- Compared the public Poki [Subway Surfers page](https://poki.com/en/g/subway-surfers) and its visible title/menu screen with the CrazyGames [Metro Runner page](https://www.crazygames.com/game/metro-runner-iuq). The CrazyGames game canvas stayed at “Loading... 40%” in the read-only browser visit, so its comparison uses only the portal's published metadata and feature list. Ratings use different portal methods and are not directly comparable.
- Poki lists Subway Surfers at 4.4 with over 21 million votes and an October 2026 update. Its page describes 9 main characters, 15 hoverboards, 4 power-ups, boosters, daily Word Hunt, missions, awards, and rotating themed worlds. The visible game title screen shows a fully modeled railway scene, character, branded world title, and strong shop/score navigation.
- CrazyGames lists Metro Runner as released in August 2026 and updated in October 2026, with a 9.0 rating over the last six months and desktop/mobile/tablet plus landscape/portrait support. Its published feature list includes randomized runs, character unlocks/upgrades, day/night changes, enemies, leaderboards, achievements, and daily rewards.
- Dimension Shift Runner's verified strengths are a distinct 2D↔3D shift loop, five visually differentiated biomes, nine procedural hazard patterns, stage missions, gates/energy, collectible pets, upgrades, milestones, daily rewards, and a shared daily gate trial. This is a solid casual-runner feature base and a more distinctive core mechanic than a standard lane runner.
- The measured gap is production polish and long-term collection breadth: the live scene uses simple low-poly shapes and has less environmental detail than Subway Surfers' railway presentation; the game does not currently present a large playable-character/board roster, seasonal worlds, enemy cast, or social leaderboard loop comparable to the benchmark pages. The new low-poly cover family narrows cover/game mismatch but does not make the live scene equivalent in detail. Keep the differentiation centered on dimension shifting and readable obstacle mastery; avoid claiming parity in asset scale or progression breadth.
- This is a directional comparison of public portal material, not a controlled playtest or objective quality score. Source-page facts were checked on 2026-10-12.

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

- Complete: typecheck, production build, focused browser checks at 1280×720, 390×844, 390×520, 844×390, and 320×568, plus `git diff --check`.
- Challenge results and the share action fit inside all five viewports after compacting the low-height layout. QA used isolated origins on the local Vite preview; the user's original game tab and save data were untouched.
- The production build is local only; no portal upload, account action, external leaderboard, multiplayer, or analytics integration occurred.

## Next (superseded by the 2026-10-12 local closeout)

The initial audit checklist below this point has been retired. Its locally accessible items are closed to the evidence limits recorded in [CURRENT_GAME_STATUS_AUDIT.md](CURRENT_GAME_STATUS_AUDIT.md); the remaining physical-device, human-listening, and live-portal checks are external release gates and outside the active objective. See “Local design pass closeout” at the end of this file for the current completion boundary.

## Controlled opening run and gate verification (2026-10-05)

- Browser-only deterministic input run forced `Math.random` to `0.9` to hold the first wall-gap side and pattern stable; no product code or saved randomness was changed.
- Pit at x=46: jumping at HUD distance 43 passed without losing a life. A prior exploratory jump at 38 lost a life; source physics and the repeated run indicate the takeoff cue should be later.
- Wall gap at x=82: entered 3D at distance 68, steered toward +Z with ArrowDown, and exited after x=85. All 3 lives remained.
- Three low blocks: jumps at 112, 122, and 132 cleared blocks around x=116, 126, and 136. All 3 lives remained through 145m.
- Secret vault: entered 3D at 150m and steered toward the hidden negative-Z lane. At HUD 189m the browser showed `ZONE 2`, `DIMENSION GATE!`, all 3 lives, full energy, `track: game`, and AudioContext `running`.
- In-game music scheduler progressed during the run: step 37 at 43m, 58 at 68m, 73 at 85m, 126 at 150m, and 152 at gate entry. This verifies the longer phrase executes and continues across dimension switching and the gate; no human listening judgment has been made.
- Browser console after the run: 0 errors / 0 warnings (only React DevTools and expected local mock SDK info).

## Remaining verification

- GameOver hierarchy and layout: local screenshots at desktop (1280×720), portrait (390×844), compact height (390×520), and landscape (844×390) confirm Play Again is above the optional rewards, with no page overflow. At 844×390, action bounds are x=432–819 and y=122–267; the full document remains 844×390. An earlier 390×520 capture showed “Watch Ad · Double Coins”; source now uses “Watch Ad · Double Shards” in both height modes, and the regular-height result was rechecked live. The compact screenshot has not been repeated after the copy edit. Physical-device behavior remains open.
- Human listening review: play `artwork/review-audio/lobby-bgm-listen.mp3`, `artwork/review-audio/gameplay-bgm-listen.mp3` for effects masking, and `artwork/review-audio/gameplay-bgm-long-listen.mp3` for repeated-phrase fatigue; judge melody and lobby-to-game balance across the set.
- Physical-device review: on a real touchscreen, test title/start layout and `▲ / ▼ / SHIFT`, 2D jump/slide, 3D steering, pause/resume, and background/foreground recovery; repeat a sustained run on a lower-end device and note audio/performance issues.
- CrazyGames hosted review: confirm initialization, first gameplay start, focus loss/regain with no duplicate lifecycle events, manual pause → ad request → resume, rewarded-ad grant/cancel outcomes, save persistence after reload, and all cover/video crop and game-art match.
- Poki hosted review: confirm startup, gameplay start/stop around focus loss/regain, commercial/reward callbacks and cancel outcomes, save persistence after reload, and text-free thumbnail/video crop and game-art match.
- Record device/browser or portal build, observed event/result, and pass/fail for each item. These need a human listener, physical hardware, and portal-host access; uploading or changing portal accounts is outside this task.
- Keep the release-preparation goal active while those hardware, human-listening, and hosted-build checks remain open.

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

## Visual and content direction plan — 2026-10-11

- User requested a 2026-10 market-informed plan for graphics and gameplay additions, and asked whether image generation is available.
- Workspace already had this cumulative `state.md`; preserve prior verified entries and append new planning status here rather than replacing the file.
- Current product facts reviewed: one endless runner loop with 2D side-scroll / 3D top-down dimension switching; 5 visual themes, stage missions, 8 collectible pets, 3 upgrade tracks, a 9-floor hybrid tower, daily rewards, and score challenges. Touch controls exist in the HUD. The game already has multiple retention/progression systems, so avoid adding more currencies or login rewards before improving first-session play.
- Assessment: dimension switching is the main differentiator. Existing cover art has much richer detail than the observed in-game environment; align the playable world, cover, and thumbnail around the same bunny + toy-like dimensional world art direction.
- 2026-10 evidence: Poki's developer engagement guidance prioritizes the first session, quick repeatable play (around 3 minutes), continuous action, gradual difficulty, and a modest total content scope. Poki's requirements call for desktop/mobile/tablet support, adaptive visual instructions, responsive UI, and static plus animated thumbnails. Sources: https://developers.poki.com/guide/engagement and https://developers.poki.com/guide/requirements-quality
- Broad-market context (not runner-specific): Newzoo's 2026 market overview emphasizes player-base expansion and sustaining durable hits. Treat this as a strategic context, not proof of a particular runner subgenre trend. Source: https://newzoo.com/articles/executive-summary-ggmr-2026-free-edition
- Proposed order: (1) unify character/world/obstacle visual quality and make 2D-vs-3D readability immediate; (2) demonstrate jump, shift, and a dimension-required gate in the opening seconds with device-appropriate controls; (3) give existing themes mechanically distinct obstacle patterns; (4) add one short fixed-layout gate-trial mode; (5) validate device support and portal submission requirements, including the externally referenced CrazyGames SDK script in `index.html` against Poki's no-external-requests rule.
- Suggested internal targets (not industry benchmarks): goal understood within 5 seconds, first dimension shift within 20 seconds, tutorial completion above 80%, and a typical run around 2-4 minutes. Validate with browser playtests across desktop and mobile.
- Image generation capability confirmed: the integrated image-generation tool can create original static cover art, game icons, character concepts, and biome/background art. It does not itself produce an animated thumbnail; that would require a separate video/motion workflow whose availability must be checked if requested.
- Generated a 16:9 key-art concept using the existing Poki icon as a character reference. The 1672x941 PNG shows the bunny and portal between a 2D meadow and 3D toy-block city, with no embedded logo or text. Saved at `artwork/concepts/dimension-shift-runner-keyart-2026-10.png`; SHA-256 matched the generated original after copying into the workspace.
- Visual review: at full size, the hero silhouette, portal, and left/right world split are the dominant focal points. Exact 1280x720 cover export and thumbnail-size legibility are not yet checked. The render is more polished and detailed than the current in-game scenery, so it remains a concept reference and does not replace the existing cover or ship with the game yet.
- Status: concept stage. No game source code or production artwork has been replaced. Next: use the generated piece as an art-direction reference while improving the in-game world and first-run dimension-shift presentation; then reassess whether the cover/gameplay visual gap has narrowed.

## Implementation status checkpoint — 2026-10-11

- The step-by-step plan has not been implemented. Completed work is limited to the key-art concept and recording the plan; gameplay, graphics code, new modes, and portal compatibility remain unchanged.
- Existing Vite preview on port 5189 was unavailable, so a local dev server was started and returned HTTP 200. It was stopped after the visual capture attempt.
- Browser screenshot capture was blocked: three Playwright wrapper invocations failed across Windows/WSL path mapping and CRLF shell-script parsing. Per the circuit breaker, do not keep retrying the same automated capture path in this turn.
- No current-build screenshot was captured and no source code was changed. Next best option: use the existing saved gameplay screenshots and targeted source review, or capture the live preview through a manually opened browser before changing 3D scene rendering.

## First in-game readability pass — 2026-10-11

- Resumed from the earlier checkpoint using the in-app browser UI; the failed Playwright wrapper path was not retried. Started the Vite dev server on port 5189 and reviewed the title, live 2D run, and 3D shift view.
- Live gameplay showed the white dimension-energy label and SPACE shift-cost prompt blending into the bright sky/buildings. Increased their mobile/desktop type sizes and added compact dark translucent backing, border, and shadow. Raised the desktop control legend's contrast and weight as well.
- Verified the updated 2D HUD in the live browser at 608×608: energy value, shift prompt, and control legend are visibly clearer without covering the runner lane. Earlier 3D capture was baseline only; this exact UI change has not yet been rechecked in 3D mode.
- Validation: `npm run build` passed (TypeScript check and Vite build, 938.21 kB / 254.36 kB gzip); `git diff --check` passed. No tests were added or run.
- Scope boundary: this is a readability subtask within plan step 1, not completion of the planned art-direction/gameplay work. No 3D scenery, character, or obstacle assets changed; no tutorial flow, biome mechanics, gate-trial mode, mobile-device pass, or portal compatibility review was implemented.
- Next: compare the actual 2D/3D scenes against the generated key-art reference, then make a focused in-world art/readability improvement before moving to first-session onboarding and the remaining planned additions.

## First-session, biome, and portal pass — 2026-10-11

- Added a short dimension-shift primer at run start, active through the first 32m and capped at three exposures using the existing saved hint-count system. It tells players how to enter 3D, steer, and return to 2D. The actual 1m gameplay screen showed the message without covering the runner lane; the HUD's contrast improvements remained visible.
- Added initial biome-specific multipliers for existing obstacle patterns: Cotton Candy favors hops/spikes, Bathroom Escape favors rollers/low beams, Sunny Park favors slalom/hurdles, and Moonlight Picnic favors low beams/rollers/spikes. The first four scripted patterns and global unlock distances remain unchanged. These are design starting values; comparative frequency and difficulty still need playtesting.
- Fixed portal SDK selection: removed the unconditional CrazyGames SDK script from `index.html`, made known portal hostnames take precedence in `detectPortal()`, and use the local ad mock on localhost/127.0.0.1. The existing loader now selects Poki on Poki hosts and CrazyGames on CrazyGames hosts. Real portal-host SDK behavior has not been exercised in this local environment.
- Validation after all current source changes: `npm run build` passed (TypeScript check and Vite build, 938.81 kB / 254.60 kB gzip); `git diff --check` passed. Browser reload and title-to-gameplay navigation worked; the opening primer and contrast changes were visibly present at 608×608. A 3D shift changed the mode/readout, but a same-build 3D screenshot and themed-weight balance pass remain pending.
- Plan status: first-run onboarding is implemented; biome differentiation is implemented as initial weighting and awaits balance review; step 1's in-world art/character quality alignment remains unfinished; the fixed-layout gate-trial mode, mobile-device review, and real Poki/CrazyGames portal validation remain outstanding.

## Daily Gate Trial mode — 2026-10-11

- Added a title-screen `TODAY'S GATE TRIAL` option backed by a deterministic UTC-day seed. Every player receives the same generated route for that day; replay from the result screen keeps the same seed.
- Trial objective: enter at least one Dimension Gate and reach 250m. The run ends at the target, the result card distinguishes cleared from incomplete attempts, and a completed trial cannot be revived. It reuses the existing runner, progression, score, and reward systems; no online leaderboard or separate reward currency was added.
- Validation: TypeScript/Vite build passed (940.88 kB / 255.17 kB gzip), `git diff --check` passed, and the live browser showed the title option plus the in-run objective toast at 1m. The 250m completion/result branches and real daily-seed comparison between separate sessions have not been playtested.
- Remaining from the broader plan: in-world art/character alignment, balance review of biome weights, mobile viewport review, full 250m trial playtest, and SDK verification on actual Poki/CrazyGames hosts.

## Cross-portal visual design pass (2026-10-11)

- User clarified that the project targets CrazyGames as well as Poki; the priority is overall design quality. Both SDK paths remain in `portalAd.ts`. No portal SDK change was made in this pass.
- Fresh 608x608 live gameplay review showed title text blending into scenery, an oversized flat soil face, and noisy rainbow building stacks. The 3D camera shift needed a clearer visual cue.
- Added a dark translucent title hero panel and a backed record strip so the name, description, and actions remain legible over moving scenery.
- Added thin clay bands to the pooled track geometry without extra draw calls. Fixed theme recoloring to read from immutable vertex-role data; previously recoloring read already-tinted colors as role IDs and could erase decorative colors after a palette update.
- Gave each toy building a consistent muted body color, a single darker accent story, and a shorter 3–6 story silhouette. Shared building materials avoid per-story material allocation.
- Added a single-draw-call 3D floor grid that fades with the dimension blend. Grid segments are rebuilt from visible floor tiles so actual pits remain open.
- Added dark outlines to gift-wall and toy-block hazards to separate their silhouettes from the pastel scenery.
- Shortened the HUD dimension labels to `2D SIDE` and `3D DEPTH` so they fit narrow screens and describe the actual angled 3D camera; updated the page description to match.
- Visual verification in the live 608x608 browser: title and record strip legible; 2D soil layers and calmer skyline visible; 3D grid appears after SPACE and stops at a pit. The observed run was brief and did not establish full-route balance.
- A 390x844 viewport revealed title overlap with a two-row reward bar. A mobile-only top offset fixed it; the title, actions, control chips, and records were all visible after the change. The shorter `2D SIDE` / `3D DEPTH` HUD labels fit on one line in the same viewport. A viewport-only check still used desktop pointer behavior, so touch input was not verified. The portrait gameplay camera keeps a wide hazard view and renders the runner quite small; camera/readability tuning remains open.
- Final production TypeScript/Vite build passed: `dist/index.html` 943.28 kB (gzip 255.93 kB); `git diff --check` passed. The ordinary sandbox build failed because Node's async `realpath(index.html)` returned EPERM; the same build passed with workspace sandbox escalation. No tests were added.
- Still pending: physical-device touch check, fuller obstacle silhouette pass, portrait camera/readability review, 250m trial completion playtest, and actual SDK behavior on CrazyGames/Poki hosts.

## Active goal — whole-game design quality (2026-10-11)

- Goal: finish a coherent, readable design pass for both Poki and CrazyGames, covering the title, 2D/3D gameplay, HUD, obstacles, five biomes, and portrait layout. Keep this goal active until the remaining visual acceptance checks below are done.
- Acceptance checks: title and live HUD fit at 608×608 and 390×844; the runner and upcoming hazards are legible in both modes; the 3D grid does not bridge pits; theme colors recolor terrain and scenery consistently; production TypeScript/Vite build and `git diff --check` pass. Physical touch and live portal SDK checks are separate launch checks and must not be claimed from a viewport simulation.
- This pass reduced the portrait camera's minimum visible width from 27 to 23 world units at the narrowest aspect ratio while retaining roughly the previous forward warning distance. It also shortened the narrow HUD's zone label to `ZONE n`, prevented mode labels from wrapping, and snapped the start camera to 2D so its view agrees with the HUD immediately.
- Added theme-specific road and soil colors. Hills, trees, clouds, toy buildings, and roofs now follow the active palette; Moonlight hides the sun and makes the existing stars brighter. A trial moon decoration overlapped the life HUD, so it was removed after visual inspection. Temporary Moonlight preview overrides were restored to the default Carrot Meadow theme.
- Live browser observations: 608×608 title and new-run 2D view remained legible; a completed 3D shift at 33 m showed the depth grid and an open pit. At 390×844, the title, actions, records, zone/mode HUD, runner, and road were visible without overlap. These observations used a viewport override with desktop pointer behavior, not a physical touch device. A brief 3D run does not establish full-route balance.
- Remaining design work: inspect more obstacle types and later biome transitions in real play, confirm their silhouettes remain readable in 2D and 3D, and check the generated cover against the actual in-game art at thumbnail size. Portal-host SDK behavior, physical-device input, and the 250 m trial ending remain separate unverified launch checks.
- Verification after these edits: `rtk npm run build` passed (TypeScript and Vite; `dist/index.html` 944.80 kB, gzip 256.35 kB), and `rtk git diff --check` passed. No tests were added or run.
- Obstacle follow-up: gift walls, hidden panels, and studded blocks now use the world palette's shared hazard materials instead of allocating fixed-color materials per obstacle; stud geometry is shared as well. The red block silhouette was visible ahead at 94 m in the live default-biome run. That run ended at 109 m, so a gift-wall encounter and later-theme obstacle appearance have not been visually confirmed yet. The subsequent TypeScript/Vite build passed (`dist/index.html` 944.79 kB, gzip 256.33 kB), and `git diff --check` passed.
- Temporary Moonlight preview at 608×608 showed a coherent dark sky, purple soil/road, dark trees, and readable HUD with the oversized moon decoration removed. The preview did not reach a themed obstacle. The temporary overrides were removed; source inspection confirmed that constructor, menu, and run start all use `THEMES[0]` again, and the live title reloaded in the default theme. `git diff --check` remained clean. The overall design goal remains active because later-biome obstacle readability and cover-to-game consistency have not yet been checked.
- Compared the existing 1672×941 key-art concept with live gameplay. The bunny/plunger and toy-world motif correspond, but the illustration has much richer portal effects and scenery than the current renderer. It remains a concept and is not wired into the title or portal exports; a final marketing cover needs a separate fidelity decision.
- Restyled Game Over to use the title's dark navy, cyan, and magenta palette. The score/stat hierarchy and replay button now match the title; carrot rewards and ad actions keep amber so their meaning is distinct. A natural 111 m result at 608×608 and a separate 115 m result from a fresh 390×844 load both displayed the complete card and all actions. Resizing an already-open result in the browser produced a clipped screenshot, while DOM measurements showed the root, canvas, and overlay at the new width and a fresh narrow load rendered correctly; this was not treated as a confirmed application layout defect.
- Verification after the result style edit: `rtk npm run build` passed (TypeScript and Vite; `dist/index.html` 945.67 kB, gzip 256.49 kB), and `rtk git diff --check` passed. No automated tests were added or run.
- The Dimension Hub's Upgrades and Pets tabs were inspected live at 608×608. Both already use the same dark panels, cyan/3D accent chips, and amber purchase actions; no hub style edit was needed. The hub was closed and the title restored afterward.
- Previewed Cotton Candy, Bathroom Escape, and Sunny Park by temporarily loading each theme at run start, then restored the default. Cotton Candy exposed a hard-coded cyan 2D sky center that broke the pink palette. Both 2D and 3D radial gradient centers now derive from the active CSS theme colors; the updated Cotton Candy screenshot showed an all-pink sky, and Sunny Park kept its blue/yellow balance.
- Bathroom Escape previously displayed the same trees and toy houses as the outdoor biomes. It now hides those props and uses repeating toy bathroom walls, mirrors, sinks, faucets, and soap bubbles behind the track. The first preview made the pale sinks disappear against the hills; darker tile walls and shared outlines improved their visible structure on the next 608×608 live capture. This is a theme-specific scenery pass, not a new obstacle type or gameplay rule.
- After removing every temporary theme override, source inspection showed the constructor, menu, and run start on `THEMES[0]`; the title reloaded in Carrot Meadow. Final TypeScript/Vite build passed (`dist/index.html` 948.44 kB, gzip 257.10 kB) and `rtk git diff --check` passed. Actual gate-triggered theme transitions and 3D themed obstacles remain unverified.
- The updated Moonlight sky was visually inspected in 2D and 3D at 608×608: it no longer has a fixed cyan hotspot, while the HUD, 3D grid, and pit edge remain visible. At 390×844, a fresh default-theme run reached a stable 3D camera view at 27 m; the runner, energy/mode HUD, grid, and approaching pit were visible without overlap. This was still a desktop-pointer viewport simulation, not touch-input validation. The Moonlight preview override was then removed, and the default title was restored.

## Gate visual transition and hint layout follow-up (2026-10-11)

- A controlled local preview temporarily started the runner near the first hidden gate in 3D at the gate's depth. At 168 m the 3D gift wall and gate beam were visible; after the gate, the HUD showed `ZONE 2` and the Cotton Candy palette recolored the 3D floor, scenery, and sky by 218 m. This verifies the gate-triggered visual transition in the running app, not normal player route success or overall balance. The temporary start position, invulnerability, and 3D start mode were removed; source inspection again showed the ordinary 0 m/2D start.
- That controlled preview reached Game Over before it could be reloaded and increased the local browser save from 41 to 42 runs and from 411 to 437 shards; it may also have affected cumulative pickups, gate count, and saved hint exposures. No save snapshot existed, so these local preview increments were not guessed away. Later scene observations were stopped by reload before Game Over to avoid further result increments.
- The gate preview showed the separate hint banner covering part of the upcoming wall. Contextual hints now occupy the energy HUD's instruction row while active, replacing the ordinary shift-cost sentence; the extra absolute banner was removed. The code change keeps the permanent bottom control legend and touch controls. The current browser save has exhausted several hint-exposure caps, so a live screenshot with the new hint text was not obtained. The regular energy prompt rendered after the edit.
- Verification: TypeScript/Vite production build passed (`dist/index.html` 948.42 kB, gzip 257.06 kB), `rtk git diff --check` passed, and a source check confirmed the 0 m/2D start was restored. The hint-in-row layout still needs a fresh-profile visual check, especially at 390×844.
- Fresh-origin follow-up: opened the same local server through `localhost` in a temporary browser tab, separate from the existing `127.0.0.1` save. The first-session dimension primer rendered inside the energy HUD at 1280×720 and 390×844; the narrow version wrapped to two lines while keeping the runner lane and upcoming scenery visible. Reloaded before Game Over, reset the viewport, and closed the temporary tab. The original save remained at 42 runs / 437 shards during this follow-up. This verifies the hint layout in a fresh local profile, not physical touch input.
- Added a thin back-face silhouette shell to the bunny's torso, head, and ears, with shared material and original animation hierarchy. At 608×608 and 390×844 in 2D the white bunny remained identifiable against pale hills; a later 3D camera capture also showed the contour without an oversized dark halo. Collision and animation parameters were unchanged. The final TypeScript/Vite build passed (`dist/index.html` 948.66 kB, gzip 257.14 kB) and `git diff --check` passed.
- A second original-origin visual run unexpectedly reached Game Over between the 3D capture and reload, changing that local save from 42 runs / 437 shards to 43 runs / 442 shards. The inspection is valid visual evidence, but this save is now clearly mixed with agent preview runs. Further gameplay captures should use an isolated disposable origin and should not treat this save as real player progression.
- Replaced the emoji-only favicon with `public/icon.svg`, a small editable bunny/plunger mark framed by cyan and magenta dimension arcs. The SVG was inspected in the local browser at large size and at a small icon-sized viewport; the bunny face, ears, and dimension colors remained identifiable. `index.html` now references it. Production TypeScript/Vite build passed (`dist/index.html` 948.54 kB, gzip 257.04 kB), `dist/icon.svg` was present, and `rtk git diff --check` passed. This is an in-browser brand mark, not a final Poki/CrazyGames cover export.
- Improved the full-width spike trap after a live 2D preview showed only tiny red plunger tips against the ground. A shared palette-tinted warning plate with four high-contrast stripes now marks the full hazard footprint; the 2D preview made the boundary visible before the trap. Temporary preview pattern/distance overrides were restored to the normal `nextX = 46` and first-pattern `pit` behavior. The spikes are a 2D-only pattern, so this specific trap was not represented as a 3D obstacle.
- Final verification after restoring the preview overrides: TypeScript and Vite production build passed (`dist/index.html` 948.87 kB, gzip 257.10 kB), and `rtk git diff --check` passed. A disposable `localhost` preview was closed; the user's existing `127.0.0.1` tab remains at the title screen. The previously documented local save remains mixed with preview runs (43 runs / 442 shards); it was not reset or guessed back.
- Design-goal acceptance review: recorded live captures cover the title/HUD at 608×608 and 390×844, runner readability, a 2D full-width spike marker, 3D gift-wall/gate visibility, the depth grid stopping at pits, and theme changes across the gate plus 2D/3D Moonlight. The final TypeScript/Vite build and whitespace check pass. Physical-device touch input and hosted Poki/CrazyGames SDK behavior remain launch checks; the generated key art remains a concept and no portal cover export was produced. This closes the scoped in-game design pass, with those separate items explicitly unclaimed.

## Cross-portal release integration and artwork (2026-10-11)

- Corrected portal selection so arbitrary non-portal hosts do not load a CrazyGames SDK. SDK initialization timeouts now fail closed instead of being marked live; the CrazyGames loading event begins before SDK initialization and is stopped on initialization failure.
- Removed the production path that granted rewarded currency when no ad SDK existed. Rewarded actions now require a successful SDK completion callback; ad reward buttons are hidden when the active build has no real portal SDK. The local simulated ad remains development-only and labels itself as a simulation.
- Corrected the Poki rewardedBreak(onStart) callback signature. Commercial breaks now fire only when leaving the pause menu into gameplay, matching the strict Poki requirement; normal restart no longer inserts an ad.
- Added CrazyGames muteAudio settings support with platform mute precedence, and routed progress through the CrazyGames Data module after SDK init. Existing local progress is copied once only when the module has no save. Poki and local preview continue to use the current local save path.
- CrazyGames-hosted sessions now start the first run after SDK/data initialization to meet direct-to-gameplay entry. A short connecting screen prevents progress actions before the platform save is ready.
- Added viewport-fit=cover, retained page zoom accessibility, exposed touch controls on any coarse pointer, padded them for device safe areas, and added accessible labels to gameplay controls.
- Generated and packaged square Poki artwork plus CrazyGames landscape, portrait, and square covers in artwork/exports/. Their exact output dimensions are recorded in that folder's README. These are campaign illustrations, not gameplay screenshots.
- The production TypeScript/Vite build passed after the portal and touch changes (dist/index.html 951.35 kB, gzip 257.90 kB). The first sandboxed Vite invocation was blocked by Windows realpath EPERM; the build passed with the approved workspace escalation. git diff --check passed before the final connecting-screen markup and artwork documentation were added; rerun it with the next build.
- Earlier, an isolated Vite attempt on port 5191 was unreachable from both CUA and shell loopback and was stopped. A later CUA session reached `localhost:5189` in a separate origin for local title/gameplay inspection; the original `127.0.0.1:5189` tab was read-only and left untouched.
- Still required: validate the CrazyGames connecting/loading path and real portal SDK/ad callbacks in hosted builds, test touch on a physical device, and complete Poki's silent 1080-square 4-6 second 50-fps MP4 thumbnail. The available video-generation route may consume account credits, so no video was generated without that authorization. Portal uploads and hosted review also remain outside this workspace.
- Goal status: active. Local release preparation is not complete until the reachable-browser checks and remaining reviewable assets are finished; real device/portal/account-dependent checks will be clearly identified rather than claimed.
- Latest verification update: production build passed after the connecting-screen markup (dist/index.html 953.91 kB, gzip 258.22 kB); git diff --check passed. Export pixel dimensions were read back and confirmed at 1080x1080, 1920x1080, 800x1200, and 800x800.

## Portal SDK and thumbnail fidelity follow-up (2026-10-11)

- Compared the CrazyGames HTML5 v3 ad integration with its current documentation. `requestAd()` reports completion through `adFinished`/`adError` callbacks; the game had treated its return value as a Promise and could unmute/restart before the ad completed. Added callback-settled ad waits, a 90-second fail-open timeout, mute-on-`adStarted`, and only grant rewarded outcomes after `adFinished`.
- The official Poki event overview recommends `gameplayStop()` -> `commercialBreak()` -> `gameplayStart()` on death/restart. The Game Over replay now requests a commercial break on live portal builds before starting again. The local mock does not add this extra simulated break.
- The current official Poki static-thumbnail guide calls for a full-bleed square of at least 628 px and close visual alignment with the real game. Corrected the earlier assumption that the existing square art had a uniformly mint background: it already splits meadow and dark indigo. The more significant mismatch was its furry campaign-render rabbit versus the live low-poly runner.
- Generated a separate, non-destructive Poki candidate at `artwork/exports/poki-thumbnail-gameplay-matched-1080.png`, matching the in-game rabbit, red rubber cup/tan handle plunger, carrot meadow, obstacle city, and indigo contrast. It is 1080x1080 (2,446,472 bytes); the original static image remains untouched. The README distinguishes the two.
- Read-only inspection of the original `127.0.0.1:5189` tab left its title screen and save untouched. A temporary `localhost:5189` tab showed actual 2D gameplay and a Game Over at 115 m / score 415; its separate local preview profile started with 3 runs / 26 shards and received one preview-run result. That tab was closed without resetting the profile.
- Verification after the source changes: `rtk npm run build` passed (`dist/index.html` 953.95 kB, gzip 258.31 kB). The candidate was read back at 1080x1080 and visually checked at 144x144; the rabbit, plunger, gate, and carrots remain identifiable at tile size. A final `git diff --check` is recorded below after the documentation update.
- Remaining launch work: Poki's silent animated thumbnail, cover/game fidelity review in the hosted builds, actual CrazyGames/Poki SDK and ad testing, physical-device touch validation, and full normal-play review of later-stage hazard readability. No portal upload or account setting was changed. Goal remains active.
- A local 1280x720 check triggered the 2D-to-3D control: the HUD switched to 3D, energy moved from 60 to 47, and the return-to-2D hint appeared at 5-6 m. This screenshot is during the transition blend, not a settled later-stage scene. The temporary tab was closed before another run result.
- Final follow-up verification: the new candidate reads at 144x144, its export dimensions are 1080x1080, temporary preview images were removed, and `rtk git diff --check` passed after all workspace edits. The source build remains green at 953.95 kB (258.31 kB gzip). Goal remains active.


## Gate-trial and title-copy QA follow-up (2026-10-11)

- Completed today's fixed Gate Trial in an isolated localhost preview by following its on-screen cues: 250m, one gate entered, score 1,500, 34 carrots, and a clear result. The result screen showed the target distance and gate count.
- Two earlier preview attempts ended at 111m with zero gates while the game continued running between manual browser observations; those were not treated as controlled playtests. The successful cue-driven run exercised the 2D pit jump, 3D lane steering, hidden-lane approach, gate entry, return-to-2D, and the 250m finish.
- The localhost QA save began at 6 runs and ended at 9 runs, with 250m / 1,500 as its new best. It is a mixed preview profile; the existing 127.0.0.1 user tab was not interacted with.
- Corrected the title description: Space changes dimensions; steering around walls happens with up/down in 3D. The updated copy appeared in the title screen at 1280x720 and reads accurately with the existing control legend.
- Verification after this source change: TypeScript and Vite production build passed (dist/index.html 953.94 kB, gzip 258.31 kB). Gate Trial clear state and result layout were verified in the live browser.
- Remaining external/device checks are unchanged: physical touchscreen input, live Poki/CrazyGames SDK and ad callbacks, hosted cover review, and a gameplay-faithful silent animated Poki thumbnail. No portal upload or account setting was changed; goal remains active.

## Mobile viewport and animated-thumbnail QA (2026-10-11)

- Checked the title and gameplay HUD at 390×844; the content fit without visible clipping. The source exposes touch controls for `any-pointer: coarse`. A synthetic coordinate click in the in-app preview did not verify a dimension switch, and the preview's media-query state did not reliably emulate physical touch; actual touchscreen input remains unverified.
- Rechecked Poki's current animated-thumbnail requirements: square 1080×1080 or larger, 50fps or higher, 4–6 seconds, muted MP4, maximum 100MB, focused on real gameplay. Source: https://developers.poki.com/guide/your-game-page
- Rejected the first canvas capture: it measured 1080×1080, H.264 MP4, 4.19s, nominal 60fps but average about 42fps; visual frames had a black sky and no visible runner. It does not meet the quality or frame-rate gate.
- A foreground capture harness successfully recorded new 1080-square MP4 blobs and showed 4.2s capture status. This in-app browser could not persist the blob through its download path; a temporary loopback-only receiver also got no browser request. The receiver was stopped and all harness/frame files were removed. No animated thumbnail candidate was exported.
- The localhost QA profile contains additional preview/capture runs and is mixed. The existing 127.0.0.1 tab was not interacted with. Goal remains active; physical touch, live portal SDK/ad behavior, hosted covers, and a compliant animated thumbnail still need completion or external access.

## Rewarded-ad preview copy QA (2026-10-11)

- Replaced local rewarded-ad copy that promised bonus carrots with neutral wording, since the same simulated slot handles revive and doubled coin rewards. The skip label now matches the generic reward.
- In the isolated localhost preview, opened the Watch Ad - Double Carrot Coins flow and confirmed the overlay showed Rewarded Ad and Finish to claim your in-game reward. After the 2.5-second simulated completion, Game Over displayed +124 CARROT COINS (2X).
- Production TypeScript/Vite build passed after this edit: dist/index.html 953.92 kB, gzip 258.30 kB. Initial sandboxed Vite access failed with Windows realpath EPERM; the same workspace build then passed with approved escalation.
- This confirms localhost mock-ad behavior only; live Poki/CrazyGames ad completion remains unverified in portal-hosted builds.

## Current portal-requirements source audit (2026-10-11)

- Checked current official Poki requirements and quality guidance: https://developers.poki.com/guide/requirements-quality and https://developers.poki.com/guide/your-game-page
- Source inspection found a full-viewport responsive canvas, page-scroll containment, bundled local fonts, localStorage guarded by try/catch, and Escape/P pause-resume support. Repository URL search found only the CrazyGames and Poki SDK script endpoints; there are no remote font or gameplay-asset requests. This is a source-level check, not a Poki Inspector or hosted-origin run.
- Checked CrazyGames HTML5 SDK v3 documentation: https://docs.crazygames.com/sdk/game/, https://docs.crazygames.com/sdk/video-ads/, and https://docs.crazygames.com/sdk/data/
- Its Data module has synchronous localStorage-compatible getItem/setItem methods after init; the implementation initializes before connecting the storage adapter, migrates an existing local save once, then uses that adapter. The current callback ad and gameplay/loading event paths match the documented API by source inspection.
- The current production output contains four files totaling 978,327 bytes (`dist/index.html` 954,288 bytes), below CrazyGames' 50 MB initial-download ceiling. This is local output size only; hosted loading measurement and portal submissions remain unverified. The latest source build also includes the CrazyGames first-input audio-unlock fix and the local commercial-break copy correction.
- Still open: physical-device touch, portal-hosted SDK/ad callbacks and integration reports, full normal-run hazard review, hosted cover review, and a Poki animated thumbnail meeting current 1080-square / 50fps / 4-6 second / muted MP4 requirements. No portal account or upload action was taken.

## Low-poly portal cover refinement (2026-10-11)

- Revisited the existing Poki comparison candidate after checking it against the live game. Although its rabbit and plunger colors were recognizable, the furry character and cinematic lighting were a poor match for the playable low-poly runner.
- Created a non-destructive square alternative with the built-in image-generation tool. It uses smooth flat-shaded geometry, a white running rabbit with the red-cup/tan-handle plunger, a bright meadow, and an indigo dimension world with a cyan-magenta gate.
- Saved the 1254 x 1254 PNG at artwork/exports/poki-thumbnail-low-poly-1254.png (1,590,399 bytes). Full-size and 144 x 144 reviews confirm the rabbit, plunger, gate, and carrots remain readable.
- Rewrote artwork/exports/README.md to label all portal covers as campaign illustrations, preserve the earlier Poki option for comparison, and avoid calling an illustration a gameplay capture. The new candidate is closer in geometry and palette but still needs final comparison with a hosted build before submission.
- This edit only adds artwork and documentation; the last production build remains valid for source changes and passed at 953.92 kB (gzip 258.30 kB). No portal submission or account change was performed.

## CrazyGames first-input audio unlock follow-up (2026-10-11)

- Source review found CrazyGames starts the first run after SDK readiness. That calls audio.unlock outside a user gesture, while gameplay keyboard/touch handlers previously did not retry it; browsers can therefore keep the Web Audio context suspended after auto-start.
- Added one-time capture listeners for pointerdown and keydown. The first actual user input unlocks the context before game handlers run, then removes both listeners. Existing title-button unlock calls remain in place.
- Production TypeScript/Vite build passed after this change: dist/index.html 954.30 kB, gzip 258.35 kB. git diff --check passed.
- This closes the source path for audio activation; actual CrazyGames hosted playback and mute-setting behavior still require portal-hosted validation.

## CrazyGames smooth-model cover alternatives (2026-10-11)

- Compared the new generated art against `src/game/player.ts`: the game uses smooth sphere/capsule meshes for its white rabbit, pink ears, dark eyes, face, brown harness, cyan badge, and red-cup/tan-handle plunger. The new cover direction tracks those recognizable elements better than the older furry illustration and faceted alternative.
- Exported a consistent three-format CrazyGames candidate set at 1920 x 1080, 800 x 1200, and 800 x 800 under `artwork/exports/`. Full-size review and a reduced-size contact sheet show the rabbit, plunger, gate, and two worlds remain recognizable in all aspect ratios.
- These are campaign illustrations with more elaborate lighting and scenery than a gameplay frame. They remain candidates until compared with the current hosted build; no portal upload or account action was taken. The artwork README now labels every portal asset as unapproved illustration/candidate and lists the outstanding release checks.
- This was an artwork/documentation-only update. The last TypeScript/Vite production build remains valid at 954.30 kB (gzip 258.35 kB); a fresh source build was not needed. Whitespace validation is recorded after the final documentation cleanup.

## Regular-run final-flow spot check (2026-10-11)

- Started a regular run in the isolated `localhost:5189` QA profile from its recorded 18 runs / 311 shards. With no controls entered, the runner collided and the run ended at 109 m with score 359, 11 carrots, 0 gates, and 9 shards; Game Over displayed the result and returning through the hub restored the title screen. The profile now shows 19 runs / 320 shards and remains mixed QA data. This is a hands-off UI/result-flow check, not a valid balance or survival assessment.
- A capture around 94 m showed the crash toast while the runner was difficult to see. Source inspection confirms the player deliberately blinks during the 1.6-second invulnerability window, so that single frame may have caught the hidden half of the blink. It does not establish a persistent visibility bug; visibility throughout recovery remains a targeted follow-up if another controlled capture can be made.
- Tried a separate fresh-origin run on port 5190. The Vite server started, but the in-app browser timed out connecting through its isolated browser network. The temporary server was stopped; the original `127.0.0.1:5189` user tab and save were not touched.
- The current theme list contains Carrot Meadow, Cotton Candy, Bathroom Escape, Sunny Park, and Moonlight Picnic; the procedural pattern list includes pits, wall gaps, hurdles, spikes, slalom walls, moving rollers, broken bridges, vault gates, and low beams. Existing visual notes cover every theme's scenery/palette and several obstacle classes, but do not claim a live visual pass for every pattern-theme combination.

## Pause-resume ad preview wording and QA follow-up (2026-10-11)

- Confirmed the existing `resume` path requests a commercial break before gameplay resumes. This matches the current Poki HTML5 SDK guidance and quality requirement; CrazyGames likewise recommends midgame ads at natural pauses/transitions and applies its own pacing: https://developers.poki.com/guide/sdk-html5, https://developers.poki.com/guide/requirements-quality, https://docs.crazygames.com/resources/midgame-ads-pacing/
- Corrected the local simulated-ad overlay title from `Stage Intermission Break` to `Commercial Break`, since the preview is also used when resuming a pause menu. No portal ad timing code changed.
- The updated localhost overlay was visually confirmed during a paused run: it showed `LOCAL PREVIEW · SIMULATED AD`, `Commercial Break`, and `The run will resume automatically shortly.` The live player was also visible and recognizable at 2 m in a separate 2D screenshot.
- Production TypeScript/Vite build passed after the wording edit: `dist/index.html` 954.29 kB, gzip 258.35 kB. The in-app QA profile now shows 22 runs / 347 shards (mixed agent preview activity); the last short copy-check run progressed and paid 9 shards before reload. Its per-run result was not captured. The user's original `127.0.0.1:5189` tab/save remained untouched.

## Full hazard silhouette QA and readability update (2026-10-11)

- Visually reviewed all nine procedural hazard patterns in the isolated `localhost:5189` preview: pits, wall gaps, low hurdles, full-width spikes, slalom walls, moving rollers, broken bridges, vault walls/gates, and low beams. Captured in 1280 x 720 gameplay across Carrot Meadow, Cotton Candy, Bathroom Escape, Sunny Park, and Moonlight Picnic. The preview used forced pattern/theme/start values and was restored before release build.
- Confirmed a semantic mismatch in the roller renderer: its player-facing instruction called for moving spike balls while the model was a toilet-paper roll. Replaced that model with a palette-colored spiked sphere using shared geometry; movement and spin remain driven by the existing obstacle motion.
- The Bathroom Escape spike-strip capture showed a low red strip with very small plunger-shaped teeth. Replaced the teeth with taller low-poly cones that contrast with the danger base; the updated triangles read clearly above the track in the 1280 x 720 preview.
- Checked the 3D wall/vault prompts and lane view. The warning to steer UP appears before the wall and the hidden-lane gate beam is visible. This pass did not establish a complete secret-gate traversal under normal progression.
- Removed all local QA overrides for pattern selection, biome, starting distance, speed, and energy. Confirmed the normal first pattern is back to `pit`, regular runs start at 0 m with default energy, and the code search finds no `temporary local visual QA` markers. The `localhost:5189` profile ended at 34 runs / 479 shards and contains mixed QA activity; the user's original `127.0.0.1:5189` tab/save was not interacted with.
- `git diff --check` passed. TypeScript and Vite production build passed with 48 modules transformed: `dist/index.html` 953,013 bytes (953.01 kB; gzip 257.96 kB), four files totaling 977,052 bytes. The first sandboxed Vite attempt failed to resolve workspace `index.html` with Windows `EPERM`; after verifying the build output path, the same build passed with workspace access.
- Captured a local 5-second 2D Carrot Meadow run from the 1920×1080 game canvas. The chosen source averaged 46.8 fps; the exported muted H.264 MP4 is 1080×1080, constant 50 fps, 4.96 seconds, and 1,090,766 bytes. The CFR conversion repeats occasional source frames to meet the file-rate profile; motion interpolation was tested and abandoned because it was far too slow. The MP4 was visually reviewed as a five-frame contact sheet, with no HUD or black transition wedges in the selected pass. See `artwork/exports/dimension-shift-runner-gameplay.mp4` and the Poki [thumbnail guide](https://developers.poki.com/guide/game-thumbnail).
- Cross-checked the portal adapter against Poki's [HTML5 SDK event guide](https://developers.poki.com/guide/sdk-html5) and CrazyGames' [game event](https://docs.crazygames.com/sdk/game/) and [video ad](https://docs.crazygames.com/sdk/video-ads/) docs. Focus/visibility loss used to emit the same pause event as a player pause; it now pauses the local run with a `focus` reason and suppresses stop/ad/start calls on focus return. Manual pause and graphics-context recovery retain their separate event paths. Local browser QA confirmed focus return resumes without the mock ad, while a deliberate pause still follows the simulated ad path. Production build passed after the sandboxed attempt hit Windows EPERM: 48 modules transformed, `dist/index.html` 953.20 kB (gzip 258.05 kB); both production files total 955,018 bytes, below CrazyGames' 20 MB mobile homepage initial-download limit ([technical requirements](https://docs.crazygames.com/requirements/technical/)).
- Mobile viewport QA used a 390×843 CSS viewport (583×1264 canvas at this browser's 1.5 device scale). The title, in-run HUD, touch-control layout, and Game Over card fit the narrow screen. A separate installed-Chrome context emulated a 390×844 touch device (`any-pointer: coarse`, `maxTouchPoints: 1`); real `touchscreen.tap` events started the run, activated JUMP, switched 2D→3D, and activated DOWN. This validates browser touch emulation, not physical touchscreen input.
- The Poki video file-profile candidate is now local; final portal approval is unverified. Still outside local verification: physical touchscreen input, portal-hosted Poki/CrazyGames SDK and ad callbacks, and hosted cover/gameplay fidelity. No portal upload, account change, or video-credit action was made. Goal remains active.

## CrazyGames localhost SDK preview verification (2026-10-11)

- Added a development-only `?portalPreview=crazy` route to exercise the real CrazyGames SDK from localhost. The production build contains no `portalPreview` string, confirming the preview switch was removed from the production output.
- Local Chrome loaded CrazyGames HTML SDK v3.8.0 and reported environment `local`. The SDK now initializes before `game.loadingStart()`, then reports loading stop and gameplay start; a complete run reached Game Over. Browser JavaScript errors: 0.
- The SDK local data module accepted the game save key through get/set and persisted the completed run in the isolated browser profile.
- A rewarded request reached the documented local placeholder (`A rewarded ad would appear here`). Since localhost ads are unavailable, the real `adFinished`/`adError` reward path cannot be certified here; the request remained pending and did not grant a reward. Hosted CrazyGames preview is still required to validate ad callbacks.
- Poki's current HTML5 guide directs SDK integration verification through Poki Inspector. This remains pending because no portal upload/account action was authorized.
- Production verification passed: TypeScript plus Vite build, 48 modules, `dist/index.html` 953.20 kB (gzip 258.05 kB). `git diff --check` passed.

## Poki localhost SDK preview verification (2026-10-11)

- Loaded the official Poki HTML5 SDK from an isolated localhost Chrome profile using the development-only `?portalPreview=poki` route. The SDK initialized; the console recorded `gameLoadingFinished`, a user-triggered `gameplayStart`, and `gameplayStop` when pausing.
- Resuming requested `PokiSDK.commercialBreak()` as intended, but the local SDK did not resolve its ad Promise within an 8-second observation window, so return-to-game could not be confirmed. No application JavaScript errors occurred; Chrome logged only its expected insecure-origin COOP warning for HTTP localhost.
- Poki's official guide names Poki Inspector as its test environment. Portal-side commercial/rewarded ad completion and the complete resume cycle remain unverified without an Inspector upload.

## CrazyGames platform-mute UI verification (2026-10-11)

- Used the official local setting `?muteAudio=true`; the CrazyGames SDK reported `settings.muteAudio: true`. Before the fix, the in-run HUD showed `🔊` and `Mute (M)` despite that platform setting.
- The HUD and title screen now display `🔇` with an accessible platform-muted label and a disabled sound toggle while platform mute is active. With the default setting (`muteAudio: false`), the HUD shows the normal `🔊` / `Mute (M)` enabled control.
- Verified the title control after a complete auto-started CrazyGames preview run and return through the village menu. Both forced and default settings rendered without application JavaScript errors.
- Follow-up TypeScript and production build passed: 48 modules, `dist/index.html` 953.86 kB (gzip 258.18 kB). This is a local SDK-setting/UI check; physical audio and hosted platform settings remain outside this browser verification.

## Production-bundle browser preview (2026-10-11)

- Served the built `dist` output with Vite preview at `127.0.0.1:5191` and opened it in an isolated Chrome profile. Even with `?portalPreview=crazy`, neither portal SDK loaded and the game waited for the normal title-screen Play action, confirming the development selector is absent from runtime behavior.
- Started a run, paused, and resumed through the production bundle. HTTP status was 200 and browser JavaScript errors were 0. The temporary preview server was stopped after the check.

## Production render-throughput baseline (2026-10-11)

- Counted `requestAnimationFrame` callbacks while the production game ran in 2D and 3D. On isolated headless Chrome with an Intel Arc 140T renderer: 1280 x 800 / DPR 1 measured 129 callbacks/s in 2D and 80 in 3D; 390 x 844 / DPR 1.5 touch emulation (585 x 1266 canvas) measured 109 and 94 callbacks/s.
- These are browser callback-throughput observations, not display-presented FPS and not a physical-phone benchmark. No render optimization was justified by this one high-end desktop-GPU sample; low-end/physical device performance remains unverified.

## Poki external-resource and package review (2026-10-11)

- Scanned `index.html`, `src`, and `public` for remote URLs and CSS imports. The only runtime remote scripts are the two portal SDK endpoints selected by portal host; display fonts are self-hosted under `public/fonts` and included in production output.
- The current `dist` contains `index.html` (953,858 bytes), `icon.svg` (1,823), and the two bundled WOFF2 fonts (6,528 and 15,688 bytes), totaling 977,897 bytes. No other external image/font URLs were found.
- Poki's published requirements call out external-resource and mobile support checks; local review cannot substitute for the Poki Inspector's hosted/device QA.

## CrazyGames rewarded-ad frequency and adblock verification (2026-10-11)

- Added a CrazyGames-only five-minute rewarded-offer cooldown. It starts after a rewarded-ad attempt settles, persists for the browser tab session, and hides both revive and double-coin offers during the cooldown. Poki remains governed by Poki's SDK; no local frequency timer is applied there.
- Connected CrazyGames SDK `hasAdblock()` detection. While blocked, rewarded buttons are absent, a short availability notice is shown, and normal replay remains available. Unknown or failed detection also keeps rewarded buttons unavailable rather than presenting unusable controls.
- Isolated local Chrome with a fake CrazyGames SDK: the blocked case reached Game Over with zero ad requests, the adblock notice, replay available, and zero JavaScript errors. The clear case showed two offers; completing the fake double-coin ad applied the reward, wrote the five-minute session deadline, hid both offers, showed the cooldown notice, and retained replay. One SDK ad request; zero JavaScript errors.
- Isolated local Chrome with a fake Poki SDK: after starting from the Poki title screen and completing the double-coin reward, the revive offer remained available, no CrazyGames cooldown key was written, and there were zero JavaScript errors. This confirms the cooldown is platform-scoped in the local adapter flow; it does not verify live Poki ad policy or callbacks.
- Production TypeScript/Vite build passed after the change: 48 modules, `dist/index.html` 956.25 kB (gzip 258.90 kB). The first sandbox attempt failed on Windows `realpath` with `EPERM`; the same workspace build passed with reviewed access. The final `git diff --check` passed after recording these results.
- Still pending outside local verification: real CrazyGames hosted ad callbacks and adblock behavior, Poki Inspector ad completion/resume, physical touchscreen/audio behavior, and final portal-hosted artwork/gameplay review. No upload or account change was performed; the release-preparation goal remains active.

## Mobile landscape touch and portal-flow recheck (2026-10-12)

- Ran a fresh isolated Chrome touch emulation at 844×390 CSS pixels / DPR 1. The touch controls were active, the jump/slide/shift buttons stayed within the viewport, page overflow was false in both dimensions, and there were no JavaScript errors. Visual review of the temporary capture found no clipped control; the capture was removed after review. This remains emulation, not physical-device approval.
- Confirmed the current implementation already includes `viewport-fit=cover` and `.touch-controls` padding based on all four `safe-area-inset-*` values. A desktop browser reports zero physical safe-area inset, so notched-device spacing still needs real-device confirmation.
- Rechecked previous portal audit findings against current source: the mock rewarded flow is registered only in development and the production fallback returns false; ad buttons are gated by a live portal SDK in production. Manual pause resume waits for `commercialBreak()` before resuming and firing `gameplayStart()`. CrazyGames `muteAudio` settings are bound to the HUD/audio state, and SDK initialization occurs before its SDK game events. These earlier static-review findings are resolved in the current source; portal-host behavior remains unverified.
- CrazyGames' current full-launch requirements allow at most one click when immediate gameplay is infeasible; the current title screen offers a one-click Play Run entry. Poki's documented pause/unpause sequence (`gameplayStop()` → `commercialBreak()` → `gameplayStart()`) matches the manual pause path in the current app. Focus-loss handling intentionally remains separate and needs portal-host event-log confirmation.
- Official references: [Poki SDK events and order](https://developers.poki.com/guide/sdk-overview), [Poki HTML5 SDK guide](https://developers.poki.com/guide/sdk-html5), [CrazyGames gameplay requirements](https://docs.crazygames.com/requirements/gameplay/), [CrazyGames game SDK events](https://docs.crazygames.com/sdk/game/).
- Production bundle recheck: 956,250 bytes; it contains the blocked-ad and cooldown UI strings and no development-only `portalPreview` selector. `git diff --check` passed after both state entries were recorded. Goal remains active for the remaining trial/theme gameplay review and external hosted/device checks.

## SDK loading interval and event-order correction (2026-10-12)

- Deferred `GameEngine` construction until after portal SDK initialization. CrazyGames now calls `loadingStart()` before engine construction; the app sends `loadingStop()` after the engine exists and before the automatic first `gameplayStart()`. Poki receives `gameLoadingFinished()` after engine construction and before the title's first-input `gameplayStart()`.
- Isolated Chrome with fake SDKs recorded CrazyGames `init:start → init:done → loadingStart → loadingStop → gameplayStart` and Poki `init → gameLoadingFinished → gameplayStart`. Both flows had zero JavaScript errors.
- A separate fake-Poki pause/resume run recorded `gameplayStart → gameplayStop → commercialBreak → gameplayStart`, with zero JavaScript errors. This confirms local event order; portal-host behavior is still pending.
- Added an engine-ready launch gate: the connecting overlay remains until engine setup completes, premature Enter input cannot start an empty run, and CrazyGames auto-start waits for both SDK and engine readiness.
- Latest TypeScript/Vite production build passed: 48 modules, `dist/index.html` 956.30 kB (gzip 258.95 kB). `git diff --check` passed after the change.

## Local release-evidence reconciliation (2026-10-12)

- Reconciled the stale opening `Next` list and the previous checkpoint against the existing recorded evidence. The fixed 250m Gate Trial was already completed (one gate, 250m, 1,500 score, 34 carrots), and earlier live runs recorded a gate crossing followed by Zone 2 plus theme transitions. Those local game-flow checks are not outstanding work.
- Fresh isolated Chrome rerun followed the visible HUD cues through the current fixed route: Gate Trial cleared at 250m with one gate, 1,730 score, and 35 carrots; the post-gate screenshot at 194m showed `ZONE 2 · COTTON CANDY` and its pink track/background. Browser JavaScript errors: 0. The two temporary screenshots were removed after review. This is a desktop Chromium run of today's fixed route, not physical-device or broad-seed coverage.
- The isolated 844×390 touch-emulation pass and all nine hazard silhouettes across the five available themes are already recorded. Emulation and forced visual captures do not count as physical-device or exhaustive route-coverage approval.
- Local release preparation remains active. The remaining release gate depends on a physical touch/audio device and access to hosted CrazyGames/Poki SDK/ad flows and hosted builds; no portal upload or account change has been performed.

## Adaptive mobile quality response and production validation (2026-10-12)

- `src/game/engine.ts`: adaptive quality cooldown now uses elapsed seconds instead of animation-frame counts. Under heavy slowdown, the prior frame-count cooldown could take longer to advance on devices that were already rendering slowly.
- `src/game/world.ts`: reused tile tint colors, avoided rewriting unchanged floor slots, skipped hidden sun updates, and updated only the active scenery group to reduce repeated work and allocations.
- `rtk npm run build` passed: 48 modules transformed; `dist/index.html` 956.76 kB (259.16 kB gzip). `rtk git diff --check` passed after the source edits.
- Isolated headless Chrome production check at 390×844 CSS pixels, DPR 1.5, and 4× CPU throttling measured 18.1 animation-frame callbacks/sec, median interval 55.4 ms, p95 97.2 ms, and 136 of 154 intervals above 33.3 ms. The renderer ratio stepped from 1.5 to 1.25 by 0.29 s and to 1.0 by 1.75 s. These are browser animation callbacks under synthetic throttling, not displayed FPS or a physical-device result.
- At the same emulated viewport, all five visible control buttons stayed inside the screen bounds and the run produced zero JavaScript exceptions. Screenshot review confirmed the live game/HUD and obstacle cue rendered; temporary screenshots were removed after review.
- Local result: adaptive downscaling reacts promptly in this synthetic check. Actual low-end device smoothness, touch feel, audio, and hosted portal behavior still require the previously listed external evidence; no portal upload or account change was performed.

## Current portal SDK documentation cross-check (2026-10-12)

- Compared the adapter against [CrazyGames SDK v3 introduction](https://docs.crazygames.com/sdk/intro/), [CrazyGames game module](https://docs.crazygames.com/sdk/html5-v2/game/), [CrazyGames video ads](https://docs.crazygames.com/sdk/video-ads/), and [Poki SDK overview](https://developers.poki.com/guide/sdk-overview) plus [Poki HTML5 guide](https://developers.poki.com/guide/sdk-html5).
- The CrazyGames loading-method name initially looked inconsistent because the game-module page still documents the v2 names. The official migration section states v3 changed `sdkGameLoadingStart/Stop()` to `loadingStart/Stop()`; `src/game/portalAd.ts` loads v3 and uses the correct v3 names, so no code change was needed.
- Lifecycle mapping agrees with current guidance: start when play begins/resumes, stop on pause/game-over/menu; CrazyGames ad callbacks mute audio and recover on finish/error; Poki's death/restart, pause/resume, and rewarded-break sequences are routed through the adapter. This is a source-level match, not proof of portal-hosted callbacks.
- Remaining release evidence is unchanged: portal preview/SDK behavior still requires authorized hosted builds, and physical-device plus human audio review remain open. No upload or account change was performed.

## Final responsive HUD and portal-preview assets (2026-10-12)

- `src/components/Hud.tsx`: moved the energy gauge below the stage/mission summary at medium widths while retaining its previous desktop position. Isolated production-browser checks found no overlap at 390 x 844, 720 x 1080, 844 x 390, or 1920 x 1080; mobile touch controls stayed inside the viewport. At 720 x 1080, the stage/mission wrapper ends at y=155 and the energy gauge begins at y=168.
- `src/game/engine.ts`: corrected the dimension-primer hint for active 3D mode. It now explains that arrow/W/S controls steer and SPACE returns to 2D instead of telling players to enter 3D while they are already in it. The isolated production capture showed the updated hint at 720 x 1080 and 1920 x 1080.
- Refreshed both CrazyGames preview candidates from the latest production build. The isolated desktop session reached 181 m in Zone 2 with one gate; the portrait touch-emulation session reached 184 m in Zone 2 with one gate. Both produced zero browser JavaScript exceptions. These browser sessions are not portal-host SDK sessions or physical-device tests.
- `artwork/exports/crazygames-preview-landscape-1920x1080.mp4`: video-only H.264, 1920 x 1080, 30 fps, 15.40 seconds, 13,819,119 bytes. `artwork/exports/crazygames-preview-portrait-720x1080.mp4`: video-only H.264, 720 x 1080, 30 fps, 15.40 seconds, 5,636,482 bytes. Both start on their matching static cover and crossfade into current gameplay; no audio stream is present. Extracted opening and gameplay frames were visually reviewed. They fit CrazyGames' [cover and preview media requirements](https://docs.crazygames.com/requirements/game-covers/) by aspect ratio, duration, and size, but remain local candidates pending host review.
- Checked the existing square Poki animated thumbnail mid-clip: it is a 1080 x 1080 gameplay capture with no HUD, so the responsive HUD change does not affect it. Its recorded H.264/50 fps/4.96 second profile remains within [Poki's thumbnail guidance](https://developers.poki.com/guide/game-thumbnail).
- Latest production build after the hint correction passed: 48 modules; `dist/index.html` 956.94 kB (259.23 kB gzip). The default sandbox attempt hit the known Windows `realpath` EPERM; the same build passed with reviewed workspace access. No portal upload or account change was performed.
- Still required before the end-to-end release goal can be marked complete: human audio review, physical touchscreen/audio and low-end-device review, hosted Poki/CrazyGames SDK and ad callback checks, and host preview approval of the game/media match. No portal accounts or uploads have been touched.

## Local audio-listening handoff (2026-10-12)

- Captured 15.48-second stereo samples from the actual Web Audio output of isolated local production sessions: [lobby music](artwork/review-audio/lobby-bgm-listen.mp3) and [gameplay mix](artwork/review-audio/gameplay-bgm-listen.mp3). The gameplay clip includes naturally occurring sound effects. Both captures completed with zero browser JavaScript exceptions; the gameplay run reached 174 m.
- Converted the captured browser stream to 44.1 kHz MP3 for direct listening. FFmpeg signal inspection found no clipping in either sample (lobby peak −5.7 dB; gameplay peak −3.0 dB). This does not assess musical quality, perceived balance, fatigue, or whether the loop feels repetitive; human listening remains open.
- The samples and [README](artwork/review-audio/README.md) are review artifacts only, not portal media. No product audio code was changed during capture. The human-listening gate remains active until the samples are heard and assessed.

## Normal-speed and throttled production CPU profile (2026-10-12)

- Profiled the current production build in isolated Chrome at 390 x 844 CSS pixels / DPR 1.5 during a live run, with sound muted and zero JavaScript exceptions.
- At normal CPU speed, 974 animation-frame callbacks arrived over 9.00 seconds: 108.2 callbacks/s, median interval 7.0 ms, p95 14.2 ms, and 7 of 973 intervals above 33.3 ms. This is a headless-browser callback measurement, not displayed FPS.
- At 4 x CPU throttle, 173 callbacks arrived over 9.05 seconds: 19.1 callbacks/s, median interval 48.6 ms, p95 97.5 ms, and 141 of 172 intervals above 33.3 ms. The 345-sample JavaScript profile did not isolate one game function as a clear dominant hotspot; the largest named entry was Three.js `updateMatrixWorld` at 12.5 ms of sampled self-time over the profile. No code change was justified by this profile alone.
- The normal-speed result shows headroom on this workstation. The throttled run is synthetic, and neither result proves lower-end physical-device performance; physical touch/audio and device frame pacing remain open.

## Current production resource and portal-size audit (2026-10-12)

- Rechecked the current `dist` output: four local files totaling 980,979 bytes (0.936 MiB): the single-file app (956,940 bytes), two bundled WOFF2 fonts, and `icon.svg`.
- Source URL/request search found exactly two remote runtime URL constants in `src/game/portalAd.ts`: the CrazyGames v3 SDK and the Poki HTML5 SDK. Host detection selects at most the matching platform SDK; no remote fonts, analytics, images, audio, or third-party library URLs were found.
- Observed the current production flow in isolated Chrome on `127.0.0.1:5195` from title through 53 m gameplay and a 2D/3D switch. Browser requests were only the local app, the two local fonts, and `icon.svg`; external requests: 0; failed requests: 0; JavaScript errors: 0. This confirms the local build does not fetch third-party assets; it does not exercise either hosted SDK origin.
- Re-served the same production bundle under isolated `www.poki.com` and `www.crazygames.com` test origins while intercepting every request. Each origin requested only its matching platform SDK URL plus local app/font/icon files; unexpected URLs: 0; request failures: 0; JavaScript errors: 0. Fake Poki SDK events were `init → gameLoadingFinished → gameplayStart → gameplayStop → commercialBreak → gameplayStart`. Fake CrazyGames v3 events were `init → loadingStart → loadingStop → gameplayStart → gameplayStop → midgame adStarted/adFinished → gameplayStart`; data storage was also read. This confirms production host detection and local adapter ordering with simulated SDKs, not real portal callbacks.
- Current official sources: [Poki HTML5 SDK](https://developers.poki.com/guide/sdk-html5) documents the exact Poki SDK URL present in source. Poki's [external-resource policy](https://developers.poki.com/guide/external-resources-policy) blocks third-party URLs by default and requires assets/libraries to be bundled. CrazyGames' [technical requirements](https://docs.crazygames.com/requirements/technical/) currently specify 250 MB total/1,500-file maxima, a 50 MB initial-download ceiling, and a 20 MB ceiling for mobile-homepage eligibility.
- The present local total is far below both CrazyGames initial-size ceilings and has four files. Actual initial-download timing through the first hosted `Gameplay start` event and the Poki Inspector resource report remain unverified because the game has not been uploaded or run on either host. No portal account action occurred.

## Narrow mobile hazard readability matrix (2026-10-12)

- Replayed the existing production bundle in an isolated headless Chrome session at 390 x 844 CSS pixels with touch emulation and DPR 1.5. The test forced hazard patterns and cycled themes in memory; no game source or user browser state was changed.
- Captured all nine hazard patterns in 2D across all five themes (45 frames), plus wall gap, slalom, rollers, and vault in 3D across all five themes (20 frames). The scene render and HUD were visually reviewed using contact sheets and representative full captures.
- Pits, walls, hurdles, spikes, slalom barriers, rollers, hop blocks, vault structures, and low beams remained visually distinguishable against each theme palette at the narrow viewport. The 3D captures showed the correct depth-mode cue and mobile steering controls. JavaScript exceptions during the 65 captures: 0.
- This is forced-scene visual review in desktop Chromium, not a natural-seed coverage estimate or physical-phone/touchability approval. Physical hardware, low-end device performance, human audio review, and real hosted portal SDK/ad behavior remain open. No upload or portal account action occurred.

## Additional local Poki thumbnail comparison candidate (2026-10-12)

- Created `artwork/exports/poki-thumbnail-gameplay-2d3d-v2.mp4` from the existing square art plus a real isolated Chrome session of the current production build. It shows 3D running, the return to 2D, and a 2D pit/jump section. The 394-frame source capture lasted 5.15 seconds; the run ended at 61.327 m in 2D with 3 lives, Zone 0, and 0 JavaScript exceptions.
- Verified the encoded file by probing and fully decoding it: H.264, video-only, 1080 × 1080, limited-range yuv420p, constant 50 fps, 216 frames, 4.32 seconds, 1,401,305 bytes. No browser HUD panels or audio are included; short reward feedback rendered inside the game canvas remains visible.
- The first 0.75 seconds use the smooth-model art, which is substantially more saturated and polished than the captured live scene. This is a local comparison candidate, not a selected portal asset; the older gameplay-only Poki clip remains available. No source gameplay code changed, and no portal upload or account action occurred.
- Remaining release gates are unchanged: physical-device touch/audio and lower-end performance, human listening review, live Poki/CrazyGames SDK and ad callback checks, and portal preview approval of cover/gameplay fidelity. These host/device gates cannot be proven by local captures.

## Gameplay-faithful Poki thumbnail alternate (2026-10-12)

- Captured a real 2D gameplay frame from the current production build in an isolated Chrome session and made a tighter square crop so the rabbit, plunger, tree, and ground read at thumbnail size. Saved the 1080 × 1080 still at `artwork/exports/poki-thumbnail-gameplay-faithful-1080.png`.
- Created `artwork/exports/poki-thumbnail-gameplay-faithful-v3.mp4`: the real 2D frame holds, then fades into the existing local 3D/2D/pit-jump capture. Verified full decode and profile: video-only H.264, 1080 × 1080, limited-range yuv420p, constant 50 fps, 216 frames, 4.32 seconds, 913,770 bytes.
- The captured still is genuine game art and matches the live pastel palette better than the smooth-model illustration, though the gameplay model and scenery remain visibly simple and the still is a crop from 1080-pixel capture. Keep it as an unselected comparison option alongside v2; compare both at reduced thumbnail scale and against hosted gameplay before choosing. No gameplay source code or portal configuration changed, and nothing was uploaded.

## Shared gameplay-aligned cover art v1 (2026-10-12)

- Used the built-in image generator with the real 2D game capture as the world/palette reference and an existing mascot cover as the character reference. It produced a square source (`artwork/exports/shared-cover-gameplay-aligned-square-v1.png`) plus separately composed 16:9 landscape and 2:3 portrait masters (`artwork/exports/shared-cover-gameplay-aligned-*-master-v1.png`).
- Exported the shared art direction at Poki 1080 × 1080 and CrazyGames 1920 × 1080, 800 × 1200, and 800 × 800. The small-size comparison is [cover-candidates-2026-10-12-v2.png](artwork/review/cover-candidates-2026-10-12-v2.png), and [shared-cover-aspect-ratios-v1.png](artwork/review/shared-cover-aspect-ratios-v1.png) confirms the rabbit and plunger remain visible in the landscape, portrait, and square compositions. The new art gives the rabbit a much clearer silhouette than the raw gameplay crop; its sky, trees, towers, and ground follow the live game's palette and shapes more closely than the neon campaign art.
- The generated mascot remains an illustration: its expression, badge, proportions, and soft lighting are not pixel/mesh-identical to the in-game model. Keep this set as a cross-portal visual-direction candidate pending review against hosted gameplay; it is not selected, approved, or uploaded.
- Created Poki video alternative `artwork/exports/poki-thumbnail-gameplay-aligned-v4.mp4`, opening on the new square art and fading into the same real 3D/2D/pit-jump footage used by v2. Full decode passed. Profile: video-only H.264, 1080 × 1080, limited-range yuv420p, constant 50 fps, 216 frames, 4.32 seconds, 969,128 bytes.
- Created matching CrazyGames preview alternatives: `artwork/exports/crazygames-preview-gameplay-aligned-landscape-1920x1080-v1.mp4` (1920 × 1080, 30 fps, 15.033 seconds, 10,976,641 bytes) and `artwork/exports/crazygames-preview-gameplay-aligned-portrait-720x1080-v1.mp4` (720 × 1080, 30 fps, 15.033 seconds, 4,266,452 bytes). Both are video-only H.264/yuv420p and fully decoded. Each replaces the prior cover/opening transition with the matching new cover and retains the remaining existing local gameplay capture.
- No gameplay source, portal configuration, or account was changed. Human-audio, physical-device, live portal callback, and hosted-artwork review gates remain open.

## Audio review handoff (2026-10-12)

- Reconfirmed both prepared samples: `artwork/review-audio/lobby-bgm-listen.mp3` and `artwork/review-audio/gameplay-bgm-listen.mp3`; each is 15.48 seconds, stereo MP3 at 44.1 kHz, and both fully decoded without errors.
- This validates file playback only. Melody, mix balance, repetition, and whether gameplay effects mask the music still need a human listening judgment.

## Portal focus lifecycle audit (2026-10-12)

- Compared the integration with Poki's official [HTML5 SDK lifecycle guide](https://developers.poki.com/guide/sdk-html5) and CrazyGames' official [Game SDK lifecycle guide](https://docs.crazygames.com/sdk/game/). Poki expects `gameplayStop()` on pause and `gameplayStart()` on resume. CrazyGames asks games not to emit those events on focus changes because the portal tracks focus itself.
- Updated `src/App.tsx` so focus pauses send the lifecycle pair only to Poki; ordinary user pauses still send them to both supported portals. This preserves CrazyGames' existing manual pause → midgame break → gameplay start flow.
- Verified the production bundle in an isolated headless Edge session with in-memory SDK mocks on a temporary localhost port. Poki focus sequence: `gameplayStart → gameplayStop → gameplayStart`, with no commercial break on regain. CrazyGames focus loss/regain emitted no lifecycle calls; a manual pause/resume then emitted `gameplayStop → midgame ad request → gameplayStart`. JavaScript errors: 0.
- Production build passed after the change: TypeScript passed and Vite transformed 48 modules; `dist/index.html` is 956.99 kB (259.25 kB gzip). This mock verifies app event routing, not live portal SDK/ad delivery; no portal account or hosted build was used.

## Fresh production build and natural five-biome route (2026-10-12)

- Rebuilt the current source with `npm run build`: TypeScript passed and Vite transformed 48 modules; `dist/index.html` is 956.94 kB (259.23 kB gzip). The four output files total 980,979 bytes (0.936 MiB). The default sandbox attempt hit Windows `realpath` EPERM; the same normal build passed from the reviewed workspace. `dist` was verified to resolve inside the project before its configured clean step ran.
- Served that production output in a fresh isolated Chrome profile and started a normal run from the game's Play button. A pattern-aware keyboard controller used ordinary key events against the live generated route without forcing patterns or themes; source code and the user's browser/save were untouched. Route seed `3762472996` reached 1,200.42 m, entered 4 gates, visited all five biome themes, and ended with 2 of 3 lives at 15.12 m/s. Browser JavaScript errors: 0; failed requests: 0.
- Naturally generated patterns were observed by theme: Carrot Meadow (pit, wall, hurdles, vault, spikes, beams); Cotton Candy (pit, wall, hurdles, vault, spikes, beams, hop, slalom); Bathroom Escape (pit, vault, spikes, beams, rollers, slalom); Sunny Park (pit, wall, vault, spikes, beams, rollers); Moonlight Picnic (hurdles, beams, rollers, slalom). The union covers all nine procedural pattern types. Individual seeds do not guarantee every type in every biome; the separate forced 65-frame matrix covers the cross-theme visual combinations.
- One controller collision occurred at 941.22 m on a moving roller; its jump input began only about 1.7 m before the obstacle at 15.12 m/s, so this is not a no-hit route or evidence of a product defect. The production hint calls for an earlier speed-scaled response. We do not count it as a confirmed readability failure.
- Reviewed actual gameplay captures from all five biomes and saved the comparison sheet at [natural-run-five-biomes-2026-10-12.png](artwork/review/natural-run-five-biomes-2026-10-12.png). The renders show distinct meadow, pink candy, bathroom tile, sunny olive, and moonlit-purple palettes with the generated hazard silhouettes visible. These are desktop Chrome captures, not physical-device or hosted-portal approval.

## Cross-device start-screen controls (2026-10-12)

- Updated `src/components/Title.tsx` so the first-run instructions explain both keyboard input (`▲ / ▼` and `SPACE`) and touch input (the on-screen `▲ / ▼ / SHIFT` controls). The touch controls already existed in the live HUD; the title screen had not told mobile players how to use them.
- `npm run typecheck`, `git diff --check`, and `npm run build` passed; production `dist/index.html` is 957.32 kB (259.32 kB gzip). The existing preview at `127.0.0.1:5189` hot-reloaded and its accessibility tree showed the complete updated instruction. This confirms the rendered title text on the open desktop preview, not physical touchscreen behavior or narrow-screen layout.
- A new isolated Playwright browser could not be started in this environment: the bundled Chromium executable is absent and three Edge launch attempts exited before creating a page. Further launch retries were stopped; physical device and mobile viewport validation remain open.

## Mascot-faithful portal-cover candidates (2026-10-12)

- Rechecked the existing cover contact sheet against an actual 2.2-second frame extracted from `artwork/exports/dimension-shift-runner-gameplay.mp4`. The earlier illustrated rabbit held a plunger that the in-game mascot does not hold, and its face/equipment diverged from the rendered side-profile rabbit.
- Generated separate square, 16:9 landscape, and 2:3 portrait masters under `artwork/concepts/`. Reference inputs were the extracted live gameplay frame and the five-biome gameplay sheet; the art direction preserves a single white rabbit, slim pink-lined upright ear, red back pack, orange harness, actual carrot-meadow platform materials, gold pickups, and a cyan-violet 2D/3D gate. The paws are empty.
- Exported candidates for Poki at 1080 × 1080 and CrazyGames at 800 × 800, 1920 × 1080, and 800 × 1200 under `artwork/exports/`. All four exported PNGs passed exact-resolution inspection and full decode. The final landscape and portrait exports were visually reviewed; the square source was also reviewed at full size.
- Improved mascot/equipment/world consistency over the earlier campaign art, but the generated finish remains more luminous and detailed than live gameplay. These are local alternatives only; no portal upload or selection was made. The review and limitations are recorded in `artwork/exports/README.md`.

## Portal-specific cover typography (2026-10-12)

- Rechecked the official [CrazyGames cover guide](https://docs.crazygames.com/requirements/game-covers/) and [Poki thumbnail guide](https://developers.poki.com/guide/game-thumbnail). CrazyGames requires a square, landscape, and portrait cover and recommends placing the game title on the cover; Poki recommends text-free full-bleed square thumbnails.
- Kept Poki's 1080 × 1080 mascot-faithful candidate text-free. Created a separate CrazyGames family with only the exact title `DIMENSION SHIFT RUNNER`: 800 × 800, 1920 × 1080, and 800 × 1200 exports. The three title variants were visually reviewed for spelling and small-format legibility; exact dimensions and full PNG decoding passed.
- The typography is a platform-specific cover adaptation only; the shared in-game design remains unchanged. Covers are still unselected and unuploaded pending hosted-build preview and final fidelity review.

## Matched cover and preview video candidates (2026-10-12)

- Created CrazyGames landscape and portrait preview videos that begin on the matching title-bearing covers and crossfade into previously captured local gameplay. Outputs: `crazygames-preview-mascot-faithful-title-landscape-1920x1080-v2.mp4` (1920 × 1080, H.264/yuv420p TV range, 30 fps, 15.033 s, 12,337,414 bytes) and `crazygames-preview-mascot-faithful-title-portrait-720x1080-v2.mp4` (720 × 1080, 30 fps, 15.033 s, 4,872,957 bytes). Both are silent, below the official 50 MB limit, and passed full decode. At 0.1 s, the opening matches the static cover; at 1.2 s, gameplay is visible. Portrait preserves the mobile HUD/touch-control shot.
- Created `poki-thumbnail-mascot-faithful-v5-limited-v2.mp4`: video-only H.264/yuv420p TV range, 1080 × 1080, 50 fps, 4.08 s, 1,077,066 bytes. It starts on the text-free square Poki cover and fades into real 3D gameplay. Cover and gameplay frames were visually reviewed; full decode passed. This falls within Poki's current 4–6 second, 50 fps-or-higher, muted MP4 requirements.
- Re-encoded all three to limited-range `yuv420p` for a consistent web playback profile. Reviewed official [CrazyGames cover/preview guidance](https://docs.crazygames.com/requirements/game-covers/) and Poki's [thumbnail](https://developers.poki.com/guide/game-thumbnail) and [animated-thumbnail](https://developers.poki.com/guide/your-game-page) requirements. These are local candidates only; no portal upload, account action, hosted callback, or artwork approval occurred.

## Reduced-size cover readability review (2026-10-12)

- Reduced the text-free Poki square candidate to 256 × 256 and displayed it against a sampled mint playground background. Reduced the title-bearing CrazyGames covers to square 256 × 256, landscape 320 × 180, and portrait 160 × 240. The generated review samples are in `artwork/review/` and are linked from `artwork/exports/README.md`.
- At these tested sizes, the Poki image reads as full-bleed while the rabbit and gate remain distinguishable. CrazyGames' title, rabbit, and gate remain identifiable in each of the three formats. This confirms the local static reductions only; it does not verify portal-specific cropping, compression, placement, or hosted-game fidelity.
- Remaining gates still require human listening review, a physical mobile/lower-end device, and hosted portal SDK/ad/resume/reward and cover-preview checks. No portal upload or account action has occurred.

## Gameplay-faithful low-poly cover family (2026-10-12)

- Created a second cover direction from the actual five-biome gameplay capture to bring the generated art closer to the live game's broad low-poly forms and palette. Separate masters preserve square, 16:9 landscape, and 2:3 portrait compositions. CrazyGames covers carry only the exact title `DIMENSION SHIFT RUNNER`; Poki remains text-free.
- Exported Poki 1080 × 1080 and CrazyGames 800 × 800, 1920 × 1080, and 800 × 1200 PNG candidates. `ffprobe` confirmed each exact profile; FFmpeg fully decoded all four files without errors.
- Reviewed reduced samples at 256 × 256 (Poki and CrazyGames square), 320 × 180 (CrazyGames landscape), and 160 × 240 (CrazyGames portrait). Rabbit and gate stay identifiable; the CrazyGames title remains readable. This covers local static downscales only; hosted portal crop, compression, and placement remain unverified.
- The new family better matches live geometry but the generated rabbit rendering and lighting still differ from gameplay. Keep it unselected and unuploaded until a hosted preview can be compared.

## Matched gameplay-faithful preview videos (2026-10-12)

- Rebuilt local preview candidates so the opening art matches the new low-poly cover family, then transitions into captured gameplay. CrazyGames landscape: `crazygames-preview-gameplay-faithful-low-poly-title-landscape-1920x1080-v1.mp4` (1920 × 1080, H.264/yuv420p TV range, 30 fps, 15.033 s, 10,373,143 bytes); portrait: `crazygames-preview-gameplay-faithful-low-poly-title-portrait-720x1080-v1.mp4` (720 × 1080, 30 fps, 15.033 s, 3,977,385 bytes); Poki: `poki-thumbnail-gameplay-faithful-low-poly-v1.mp4` (1080 × 1080, 50 fps, 4.08 s, 1,222,691 bytes). All are silent and below the respective documented size limits.
- `ffprobe` confirmed video-only H.264 profiles, exact frame sizes/rates, TV-range `yuv420p`, and durations. FFmpeg decoded each complete file without errors. Cover and gameplay frames at 0.1 and 1.2 seconds were visually reviewed; the portrait shot retains the mobile HUD and touch controls.
- These previews improve local art/game matching but still use recorded gameplay and generated cover art. Portal playback/cropping, hosted-game fidelity, final selection, and approval remain open; nothing was uploaded.

## Portal adapter type-safety review (2026-10-12)

- `src/game/portalAd.ts`: removed the `any` lint suppression, typed CrazyGames ad errors as `unknown` and narrowed their optional `code`, and used the declared `Window` SDK types instead of `any` casts during portal detection. SDK event and ad behavior is unchanged.
- Source review also confirmed the existing local-to-CrazyGames save migration/fallback and reward application only after a successful rewarded result. These checks do not establish persistence or ad callbacks on either hosted portal.
- After the adapter edit, re-observed the existing `http://127.0.0.1:5189/` preview: the title UI, keyboard/touch instructions, run and hub/trial controls, and reward/status chips rendered normally. This is a localhost mock-mode screen check, not portal SDK initialization or ad evidence.
- `rtk npm run typecheck` passed. The default sandbox build hit Windows `realpath` EPERM on `index.html`; the existing production build then passed with reviewed workspace access: 48 modules, `dist/index.html` 957.37 kB (259.34 kB gzip). `rtk git diff --check` passed.
- `package.json` has `dev`, `preview`, `build`, and `typecheck` scripts, but no separate lint or test script. No portal uploads or account changes occurred; hosted SDK, ad, reward/cancel, and save-reload flows remain open.

## Poki reward-choice hierarchy review (2026-10-12)

- Compared `src/components/Overlays.tsx` against Poki's current [game requirements](https://developers.poki.com/guide/requirements-quality). The prior stack placed two rewarded offers before its standard `Play Again!` action. It now puts the wider, taller standard action first; optional rewards retain the `🎬` icon, amber styling, and smaller treatment.
- `rtk npm run typecheck`, the production build (48 modules; `dist/index.html` 957.37 kB, 259.33 kB gzip), and `rtk git diff --check` passed after the change.
- Verified both custom fonts exist in `public/fonts` and are loaded from local paths. The targeted app-source URL scan found no third-party font request; the only runtime external script URLs are the official CrazyGames and Poki SDKs.
- Earlier isolated-preview attempts on ports 5190–5192 failed or found an occupied port; this was later superseded by a dev-only `?uiPreview=gameover` route on the existing local preview. The synthetic screen was checked without changing save data, and its temporary hook was removed after verification. A follow-up found existing progress on `localhost:5189`, so that origin was closed without interaction; a 5194 Vite attempt did not expose a listener and was stopped.

## GameOver reward stack and compact-height review (2026-10-12)

- On the existing localhost preview, captured the GameOver screen at 1280×720, 390×844, and 390×520. The standard `Play Again!` action appears above both optional rewarded ads and remains the larger primary control.
- At 390×844, the full reward labels remain visible: `Watch Ad · Revive with 1 Life` and `Watch Ad · Double Carrot Coins`. At 390×520, the compact-only labels shorten to `Watch Ad · +1 Life` and `Watch Ad · Double Coins`; both fit on one line. DOM measurements showed all four actions inside the viewport and document dimensions remained exactly 390×520, without page overflow.
- Captured the complete 844×390 landscape GameOver page with `fullPage` in a second temporary localhost tab. All actions fit inside the card and viewport, with no overflow; the original user tab remained on its title screen. The preview used only a temporary in-memory screen state, did not invoke save/reward handlers, and was removed immediately after capture. The viewport was reset and the temporary tab closed.
- After removing the temporary landscape-only hook, `rtk npm run typecheck`, production build (48 modules; `dist/index.html` 957.84 kB, 259.38 kB gzip), `rtk git diff --check`, and a source search for the preview hook all passed. `package.json` defines `dev`, `preview`, `build`, and `typecheck`, but no separate lint or test script.

## Poki keyboard behavior and portal SDK lifecycle audit (2026-10-12)

- Compared the current implementation with the official [Poki HTML5 SDK guide](https://developers.poki.com/guide/sdk-html5), [CrazyGames v3 Game SDK](https://docs.crazygames.com/sdk/game/), [CrazyGames v3 introduction](https://docs.crazygames.com/sdk/intro/), [CrazyGames data module](https://docs.crazygames.com/sdk/data/), and [CrazyGames video ads](https://docs.crazygames.com/sdk/video-ads/). The current CrazyGames v3 `loadingStart/loadingStop`, `gameplayStart/gameplayStop`, ad callback, and synchronous localStorage-style data APIs match the app's adapter.
- Confirmed the app awaits `portalAd.init()` before `portalReady`, and the engine is only created after `portalReady`; CrazyGames `loadingStart()` therefore precedes the one-shot `gameLoadingFinished()`/`loadingStop()`. Poki `gameLoadingFinished()` likewise follows SDK initialization and engine setup. This source-order check does not replace live hosted callback evidence.
- Fixed Poki page-scroll/input behavior: `src/game/engine.ts` now prevents Space/ArrowUp/ArrowDown browser defaults when focus is outside interactive controls, and does not register gameplay controls outside the playing state. `src/App.tsx` now ignores global game shortcuts while an ad/start/resume action is busy, preventing the mute shortcut from firing during an ad. Focused HTML buttons retain native Space activation.
- Browser check at the title screen: ArrowDown and Space did not start a run or change screen; pressing Space on the focused Carrot Village button opened the hub. The original tab stayed on its title screen, the temporary QA tab was closed, and console errors/warnings were empty after HMR.
- After the code change, `rtk npm run typecheck`, production build (48 modules; `dist/index.html` 958.01 kB, 259.48 kB gzip), and `rtk git diff --check` passed. Live Poki/CrazyGames SDK callbacks, ad pause/resume, rewarded outcomes, and remote persistence remain hosted-only verification gates.

## Fresh-profile mobile title audit (2026-10-12)

- Opened the current local app at `http://qa.localhost:5189/`, a separate origin with a fresh save (`0` runs, `0` best score, `0` shards). The existing `127.0.0.1:5189` player profile was not used or changed.
- At a 390×844 CSS viewport, the first-run title, daily status, sound button, `PLAY RUN!`, Carrot Village, and Daily Gate Trial remained in bounds. The document measured exactly 390×844; the three main action bounds were x=55..335/y=378..438, x=37..354/y=450..519, and x=72..319/y=532..565. No overlap or horizontal/vertical page overflow was observed.
- Browser console errors/warnings: 0. This is a fresh-origin desktop-browser viewport check, not physical touchscreen or hardware-performance evidence. The temporary tab was closed and the viewport reset.

## Local release recheck (2026-10-12)

- Reopened the current title screen and visually compared the gameplay-faithful low-poly square cover with the live gameplay art reference. The palette and terrain language align; the illustrated rabbit still has smoother lighting and more polished shading than the in-game model. Keep the family as a provisional local candidate until the real hosted cover-to-game transition can be reviewed.
- `rtk npm run typecheck` passed and `rtk git diff --check` passed. The default sandbox build hit the known Windows `realpath` EPERM on `index.html`; rerunning the same project build from reviewed workspace access passed: Vite transformed 48 modules and produced `dist/index.html` at 958.01 kB (259.48 kB gzip).
- Additional objective audio profile check (`ffprobe`, FFmpeg `loudnorm`/true-peak): both review MP3s are 15.48 s, stereo, 44.1 kHz. Lobby sample measured −28.06 LUFS integrated, 1.10 LU LRA, and −5.64 dBTP; gameplay sample including naturally captured SFX measured −22.17 LUFS, 6.30 LU LRA, and −2.67 dBTP. Neither sample reaches 0 dBTP. The gameplay mix is about 5.9 LU louder in this short capture; this is a listening cue, not proof of a mix defect, and does not judge melody, masking, or long-session repetition.
- Source scheduler check: the 32-step lobby pattern at 104 BPM repeats about every 4.62 s; the 128-step game phrase at 136 BPM repeats every 14.12 s. The 15.48 s game sample therefore contains only about 1.10 phrase cycles, which is insufficient for a long-session fatigue judgment. The audio README now carries these cycle estimates and the listening prompts.
- Created a 62.52 s music-only gameplay listening sample from the actual `AudioManager` scheduler in an isolated QA origin. The capture changed 2D/3D timbre at 16 s intervals, did not load the game save or portal SDK, and produced no browser console errors/warnings. The MP3 is stereo 44.1 kHz / 128 kb/s, fully decoded, −25.93 LUFS integrated / −5.91 dBTP, with 0.5 s of trailing silence; it spans about 4.43 complete game phrases. The browser-recorded WebM reported a final Opus packet warning during conversion, so only the verified complete MP3 is kept as the review artifact. This improves the repetition sample but does not replace human listening or a sustained game session with effects.
- Follow-up local release audit: the open app still identifies as `2D/3D Dimension Shift Runner`, its favicon link resolves in the document to `/icon.svg`, and the latest `dist` contains `index.html`, `icon.svg`, and both local WOFF2 fonts. Targeted scans found no `TODO`/`FIXME`/`HACK`/`XXX`, `uiPreview`, or temporary capture/debug markers in `src/` or `index.html`; the QA capture page was removed after the MP3 was verified.
- No source changes were made during this recheck, and the existing player's saved progress was not interacted with. Remaining release evidence is still human listening, physical touchscreen/lower-end-device behavior, and live CrazyGames/Poki SDK, ad/reward/save, and hosted artwork-preview behavior. No portal upload or account change was made.

## Narrow and short mobile title layout (2026-10-12)

- Fresh-origin browser measurements exposed title-screen clipping: at 320×568, the status header ended at y=123 while the hero began at y=104; Play fit, but Village and Gate Trial extended below the viewport. At 360×640 the wrapped header clipped/overlapped the hero, and at 390×520 Gate Trial began at y=532, below the viewport.
- `src/index.css` now uses the compact title treatment at widths ≤380 px at any height and at widths ≤430 px when height ≤650 px. It reduces status-chip padding/type, logo/title scale, and vertical spacing while preserving the primary-action order and 44 px minimum button heights.
- Isolated first-run origin after the CSS change: at 320×568 the header ended at y=77 and hero began at y=88; Play, Village, and Gate Trial bounds were y=269–313, 321–366, and 374–418. At 360×640 all three ended by y=418 with no header overlap or horizontal overflow. At 390×520 the actions ended at y=298, 351, and 403; all were visible. At 390×844 the compact rule did not apply, the existing layout remained intact, and all actions were visible.
- Browser console errors/warnings: 0. The QA origin had 0 runs/score/shards; its temporary tab was closed and the viewport reset. The original `127.0.0.1:5189` player profile was not interacted with.
- `rtk npm run typecheck`, `rtk git diff --check`, and production build passed. Vite transformed 48 modules; `dist/index.html` is 959.18 kB (259.73 kB gzip). Physical touchscreen and device-level behavior still require hardware validation.

## Compact mobile GameOver controls (2026-10-12)

- At an isolated `qa.localhost:5189` origin, the 320×568 GameOver capture showed the `Challenge a friend` and `Return to Carrot Village` buttons at about 33 px and 37 px high. `src/components/Overlays.tsx` now centers both controls and gives each a 44 px minimum height; the larger `Play Again!` action remains first and visually dominant.
- The 521–600 px viewport-height rule in `src/index.css` reduces only the GameOver card's padding and the stats/action top gaps. At 320×568, the final screenshot showed all result text and all three actions in view with no vertical scrollbar. Accessibility snapshot retained the three named buttons.
- A source audit of the touch HUD found 96×96 px jump, 96×64 px slide, and 112×112 px dimension-switch buttons. Hold controls capture the pointer and release on pointer-up, pointer-cancel, or lost capture; the buttons prevent default touch behavior and expose accessible labels. CSS reveals these controls for coarse pointers only.
- The browser viewport check ran with a fine pointer, so it does not verify physical touch delivery, orientation changes, or device performance. The temporary QA tab was closed; the user's `127.0.0.1:5189` tab remained open and was not interacted with.
- `rtk npm run typecheck`, `rtk git diff --check`, and the production build passed. Vite transformed 48 modules; `dist/index.html` is 959.56 kB (259.83 kB gzip). Human listening, real touchscreen/device checks, and hosted CrazyGames/Poki SDK, ad, save, and art-preview evidence remain open.

## Isolated pause and resume recheck (2026-10-12)

- Opened `http://qa2.localhost:5189/`, a separate local-storage origin. The title showed 0 runs and 0 best score. Starting a run displayed Stage 1 and the in-game HUD; clicking Pause showed the `PAUSED` overlay with Resume and Abandon actions. Restarting and pressing `P` in one action also returned directly to the paused state.
- Clicking Resume showed `LOCAL PREVIEW · SIMULATED AD` with a countdown. After the wait, the same isolated run reached Game Over at 111 m and showed a new best score of 411. This observed sequence covers the local simulated break and return to gameplay/result; it does not prove either portal's real ad callbacks or physical input behavior.
- Closed the temporary QA tab. The browser inventory returned to the user's original `http://127.0.0.1:5189/` tab only; that page and its save were not interacted with.
- The current production performance profile remains the 2026-10-12 measurement above: 108.2 animation-frame callbacks/s at normal CPU speed and 19.1 callbacks/s under synthetic 4× CPU throttle at 390×844 / DPR 1.5. It found no single dominant function, so this pass made no speculative performance edits. These are headless-browser callback measurements, not physical-device frame pacing.

## Live 3D transition visual recheck (2026-10-12)

- Opened a separate `qa3.localhost:5189` profile, started a run, and switched to 3D at 2 m. The 1280×720 screenshot showed the rabbit model on the track, `3D DEPTH ACTIVE` guidance, dimension-energy bar, score/stage HUD, and biome scenery together. No obvious character/HUD occlusion or missing player render appeared in this early gameplay frame.
- This is a single desktop-browser visual check, not exhaustive route coverage, touch-device evidence, or a comparative art-quality score. The temporary tab was closed; only the original `127.0.0.1:5189` tab remained open. No source edit was indicated by this capture.

## Current release-prep external gate audit (2026-10-12)

- Local checks reviewed in this pass found no new reproducible defect in the pause/resume path or the early 3D rendering composition. The local code, mock-SDK flows, production bundle, art candidates, and five-biome hazard readability evidence are recorded above.
- Completion remains unproven for subjective music quality (requires a human listener), actual touch delivery/audio/performance on phones (requires physical hardware), and real Poki/CrazyGames ad/save callbacks and hosted cover-to-game fidelity (requires a hosted build). Local mocks and desktop touch emulation are not substitutes for those results.
- No local screen, command, or source inspection can produce that missing human, device, or hosted-build evidence. Preserve the user's no-upload/no-account-change boundary and keep the full release goal unresolved until those external results are supplied or the objective is explicitly changed.

## Local design pass closeout (2026-10-12)

- **Scope update from the user:** finish the remaining work that can be verified locally; exclude physical-device checks and the live Poki/CrazyGames submission environments. This closeout supersedes the broader release-prep objective above; it does not claim portal or device certification.
- A deterministic source-backed generator replay sampled 24 seeds to 2,500 m with all five biome themes scheduled. Every route produced all nine hazard pattern types, with no adjacent identical pattern types. It does not simulate player input or prove that every combination is avoidable.
- `src/components/Title.tsx` now explains that check-in is available once per local calendar day, and that today's Trial route is shared in UTC while current pet/upgrade perks still apply. `src/App.tsx` places shared-route details in normal title flow and makes the main button name the route; same-day Gate Trial links no longer show a duplicate Trial start action.
- Browser QA on isolated local profiles verified the 320×568 title, active HUD, result card, today's Gate Trial challenge, and friend-score challenge. The former challenge card obscured the 2D/3D logo; after the change the logo and main action are visible and the title actions remain in the viewport. Day 1 +30 was claimable once and then changed to `Day 1 claimed`.
- Local mock-ad QA verified a +9 result, revive refund and final +20 payout, +40 displayed after doubling a +20 result, disabled actions while the mock ad was active, and early `Skip (forfeit reward)`: the canceled result stayed +9, reward actions returned, and the Hub balance was 601. Contract-inclusive double payout is source-reviewed; that specific 500 m interaction was not driven in-browser.
- Post-edit verification passed: `rtk npm run typecheck`, `rtk git diff --check`, and live HMR rendering for today's Trial and friend-score challenge at 320×568. The latest successful production build recorded before this UI edit is 959.56 kB (259.83 kB gzip); no production build is claimed for the final edit.
- Remaining external release gates: real phone touch/audio/performance, subjective long-session listening, live portal SDK/ad/save behavior, and hosted preview/artwork approval. No portal upload or account change occurred; the user's original `127.0.0.1:5189` player profile was not interacted with.
