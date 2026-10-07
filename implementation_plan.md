# Dimension Shift Runner — Improvement Plan

## Goal

Make the first minute readable, rewarding, and replayable while preserving the existing 2D/3D dimension-shift identity and keeping portal, save, and build constraints intact.

## Work sequence

1. **[x] Separate menu attract mode from run state** — prevent title-screen decoration from granting score, energy, or combo feedback. Verified in a real browser.
2. **[x] Audio startup and phrase variety** — create the audio context only after a user gesture, remove the unsupported CSP meta directive, and give the game BGM an A/B answer phrase. Browser startup and context-running state verified; human listening review remains open.
3. **[in progress] Playability pass** — hazard cues/clearance have been checked across controlled segments. Cue-driven procedural runs cleared Stage 1, Stage 2, and Stage 3 contracts in one 1,500m route with 3 lives and no hits after speed-scaling the roller cue. Stage 1's carrot contract is tuned to 36 carrots / 25 shards. Broad seed coverage, human play, physical-device, and touch-device checks remain.
4. **[in progress] Retention pass** - added a named 100m / 25-shard first target with lobby claim state and game-over progress. Controlled browser presentation checks pass; natural first-run success and retention impact remain unmeasured.
5. **[in progress] Presentation pass** — mobile title-screen records now fit at 390×844; short-height Game Over fits at 844×390 and 640×360; mobile in-run HUD no longer overlaps the stage reward card and shows touch controls in Pixel 10 emulation. Physical-device review and human audio listening remain.
6. **[in progress] Release pass** - typecheck, production build, diff check, save reload, pause/resume, and local mock-ad flows verified. Live portal SDK callbacks and real inventory still need portal-host testing.

## Current checkpoint (2026-10-05)

- Stage 1, Stage 2, and Stage 3 contracts passed on the actual App with normal procedural randomness. A cue-driven route crossed 1,500m with 3 lives and 0 collisions; Game Over showed +396 shards with +100 contract shards included, and isolated save persisted 396 shards, 1,861m best distance, 305 carrots, and 6 gates.
- One earlier automated route collided with a moving roller at 1,299m while the player was only 1.19m high. The fixed 4.5m urgent window arrived too late at that speed. Roller urgent cues now scale to 0.42 seconds of travel, capped at 7m. Typecheck/build and a repeat natural route passed after this change.
- This was browser automation following live cues, not human play. Next: device/touch verification, live Poki lifecycle, human BGM review, broader presentation, and release checks.

### Carrot-chain score reward (2026-10-05)
- Consecutive carrot pickups within 1.4 seconds now award real score: chain x2 adds +10, scaling to +40 at the x5 cap. The popup states the exact bonus; a crash resets the active chain while preserving points already earned.
- This resolves the old misleading `+100!` popup, which did not change score.
- A fresh unassisted procedural browser run collected 11 carrots and showed 363 points at 113m. Distance + base carrot score accounts for 223; the remaining 140 was chain bonus. Console had 0 errors / 0 warnings; only normal React DevTools and local mock Ads SDK info appeared.
- Typecheck, production build (927.30 kB / gzip 251.40 kB), and `git diff --check` passed. Live Poki, human play, and broader route coverage remain open.

### Near-miss skill bonus (2026-10-05)
- Cleanly passing a deadly obstacle within 0.65m now adds +50 score and a `NEAR MISS · +50` popup. Existing collision checks run first; tight clearances and invulnerability are excluded; each obstacle pays once per run.
- Verified in the live App engine with controlled geometry: 0.22m clearance raised score by exactly 50, rendered the popup, and a second evaluation did not pay again. Tight-clearance and invulnerability guard cases both rejected the reward.
- An unassisted 113m run did not naturally trigger a near-miss popup, so natural route balance still needs human play. No browser errors/warnings; typecheck/build/diff check passed. Live portal and real-device checks remain open.
- Follow-up cue-guided run on a fresh procedural route reached 515m with 3 lives and no collisions. The live App awarded two natural near-misses at 343.56m and 353.51m (+100 total); it crossed the Stage 1 boundary and ended paused in Stage 2. This is automated hint-following, not human play. Browser errors/warnings remained 0/0.
- Two additional fresh procedural routes also reached 515m with 3 lives and no collision events. They produced 3 near-misses (+150) at 325.20/335.12/345.14m and 2 near-misses (+100) at 371.84/382.07m. Across 3 routes, all cleared Stage 1 with 3 lives and produced 7 near-miss awards. These are automated cue-following runs; human balance judgment remains open.

### Short-height Game Over layout (2026-10-05)
- A real 844×390 browser screenshot exposed the bottom actions falling below the viewport. `GameOver` now switches to a two-column card when viewport height is at most 520px; normal-height portrait retains the single-column layout.
- Verified card and all four action buttons fit without scrolling at 844×390 (card y=54–336, overlay scroll height 390) and 640×360 (card y=39–321, overlay scroll height 360). At 390×844, card y=131–713 and all buttons remained visible. Pressing Play Again at short landscape successfully started a fresh run.
- Browser console errors/warnings: 0/0. Typecheck and production build passed; output 927.20 kB / gzip 251.36 kB. `git diff --check` passed.
- Next: continue actual-device touch, live Poki, human music review, and broader visual/release checks; full objective remains active.

### Mobile in-run HUD spacing and touch affordances (2026-10-05)
- Pixel 10 mobile emulation at 412×915 exposed a vertical collision: the Stage 1 reward label sat under the Dimension Energy heading. Moved the mobile energy gauge down from 8.2rem to 9.6rem and its hint banner from 12.6rem to 14.8rem; desktop `sm` offsets remain unchanged.
- Replayed the live app on a coarse-pointer mobile browser. Stage card and energy gauge now have visible separation; touch Jump, Slide, and Shift controls render in the expected bottom corners. This is browser device emulation, not a physical phone or Poki-host check.
- Browser console: 0 errors / 0 warnings; informational local mock Ads SDK notice is expected. `npm run typecheck`, `npm run build` (927.20 kB / gzip 251.36 kB), and `git diff --check` passed.
- Next: verify touch interaction on a physical device if available, then live Poki lifecycle, human BGM listening, and broader visual/release review. Overall goal remains active and incomplete.

### Mobile title-screen fit (2026-10-05)
- Real browser screenshots showed the 390×844 title page extended to 878px, clipping the record row below the initial view. Reduced mobile-only spacing between title, description, actions, cards, and records; desktop `sm` spacing and shared visual tokens are unchanged.
- After the edit, the record row ends at y=819 inside the 844px viewport; scroll height equals viewport height and horizontal overflow is false. At 1280×720, title, action bar, and records all remain within the viewport. Browser console error count was 0.
- Typecheck and production build passed; output 924.38 kB / gzip 250.97 kB. No user-facing source config or global design tokens changed.
- Next: inspect in-run HUD at mobile size, then continue device/touch, live Poki lifecycle, human BGM, broader presentation and release checks.

## Boundaries

- Do not modify package manifests, lockfiles, or root config without approval.
- Keep experiments focused; record result and next action in `state.md`.
- Do not treat simulated or unverified behaviors as completed browser QA.
- Reference review: [CrazyGames Super Smash Flash](https://www.crazygames.com/kr/game/super-smash-flash) emphasizes multiple play modes, character choices, stages, and combo-based combat; use breadth and replay depth as design cues, not as claims about this runner's music.
- Controlled browser route: jump the pit near 43m, enter 3D near 68m and steer around the wall, then jump three hurdles near 112/122/132m. All three lives remained through 145m. At 150m, shifting to 3D and steering into the hidden lane entered Zone 2 at 189m, with all three lives intact. This verifies the tested deterministic route only.

### Wall gap guidance update (2026-10-05)
- The wall direction cue is now generated from the actual open side and updates with the active dimension. Both UP and DOWN orientations were checked against the live `World`/`GameEngine` methods: correct hint, clear open-side hitbox, blocking wall center.
- This was an isolated engine scenario; it is not a complete natural wall-crossing run.
- Continue with randomized route coverage and unresolved platform/retention/audio checks.

### BGM timing resilience (2026-10-05)
- Audio onset now follows the AudioContext clock rather than the timing of each JavaScript interval callback. After a 700ms main-thread block, late notes were skipped and beat position resumed without an overdue-note burst in the live browser state.
- Tone and mix remain unreviewed by a human listener; audio quality is not complete based on scheduler timing alone.

### Hurdle cue coverage and direction (2026-10-05)
- Each hurdle now has its own cue through the third obstacle, including its open direction for 3D sidestepping. Both alternating orientations were checked in the running engine. A controlled 3-obstacle segment passed all three with 3 lives and 0 collisions.
- One default-RNG no-input run and one keyboard-controlled natural route were also observed. The latter reached 300m but had two controller-caused collisions; full natural route reliability remains unverified.

### Vault route cues (2026-10-05)
- Split the vault instruction into pre-wall and in-panel stages; both identify UP as the hidden gate lane. A real browser/engine segment entered the gate with 3 lives and 0 collisions.
- Controlled pattern injection only. A full random run and human audio quality review remain open.
### 3D hurdle verification and next experiment (2026-10-05)
- The controlled three-hurdle 3D segment passed all generated directional cues with 3 lives and zero collisions through 126.4m.
- A randomized automated run to 400.1m is inconclusive: two collisions came from known flaws in the test controller's mode refresh and cue timing. Do not use it as evidence that the game is defective or defect-free.
- Next: fix the controller, then run natural route coverage again. Preserve distinctions between controlled injection and randomized play.

### Low-beam timing repair (2026-10-05)
- Each of up to three beams now has an approach cue whose urgent point is before entry, followed by a hold cue through the beam's exit.
- Actual GameEngine segment at ~11.6m/s (player distance 260–326m): 3 beams passed, urgent cues 4.92–4.98m before entry, no collision or life loss. Earlier 17m/s label was incorrect. Browser console errors/warnings: 0.
- Typecheck/build/diff-check passed (916.66 kB / gzip 249.20 kB). Continue controlled slalom review and full-route coverage; human/device/portal/audio reviews remain open.

### Focused slalom validation (2026-10-05)
- Real GameEngine from 412m to 486m (~12.1–12.4m/s) cleared the injected three-wall slalom in both alternating orientations by following the active on-screen cue. Both reached 486m with 3 lives, 0 collisions, and about 65.97 energy remaining. Earlier 17m/s label was incorrect. Console errors/warnings: 0.
- No source change was needed; prior random-route misses are inconclusive due to the controller's dimension switching. Continue fixing controller logic, then randomized coverage.

### Maximum-speed jump-buffer repair (2026-10-05)
- At the actual max speed (17m/s begins at distance 1,690m), an active-cue-only run hit the second of two full-width spike strips: its jump prompt arrived while the first jump was still airborne, and the old 0.13s buffer expired just before landing.
- Increased the 2D jump input buffer to 0.22s. The same real GameEngine pattern at 1,710/1,720m then passed with 3 lives and no collisions through 1,740m, without a test-only override.
- Typecheck and production build passed (916.67 kB / gzip 249.21 kB); `git diff --check` passed. Next: natural-route replay with corrected buffer, then continue device/portal/audio/release coverage.


### Speed-scaled spike timing (2026-10-05)
- Spike urgent prompts now scale to 0.28 seconds of travel, capped at 4m. This fixes the low-speed cue being too early while preserving a usable 17m/s window; paired spike tests at ~11.8m/s and 17m/s both passed with 3 lives and 0 collisions using active cues only.
- Typecheck, production build (916.74 kB / gzip 249.23 kB), and diff check passed. Resume natural-route coverage; complete device, live portal, full retention, and human music reviews.


### Seeded route and 17m/s hazard audit (2026-10-05)
- Corrected QA controller; seeded procedural route reached 1,200m with 4 gates, 3 lives, 0 collisions at 15.12m/s. Harness reset hint counters to keep repeated cues visible; not an unscripted run or normal-save behavior.
- At 17m/s, injected DOWN→UP→DOWN slalom, 3 hurdles, and 3 low beams passed with active cue-driven keyboard input, 3 lives, 0 hits. Earlier automated 700m run is discarded due unintended W jumps in 2D. An 859m hint-only run died after repeated prompts were capped; treat as controller-limited evidence.
- No source change. Next: stage-2+ route patterns, repeated-hint UX, touch/device, portal, music listening, presentation, release verification.


### Familiar hazard hint fallback (2026-10-05)
- Returning players no longer lose all prompts after 3 exposures: familiar 2D hazards show urgent action prompts only; walls/slalom/vault and any cue in 3D retain early warnings.
- Live source checks covered familiar pit/spikes before and inside urgent window, early wall/vault/slalom setup, early 3D spike/beam guidance, and first-time cue unchanged. Typecheck/build/diff-check passed (916.84 kB / gzip 249.27 kB); console 0 errors/warnings.
- Next: verify save/reload behavior end-to-end and continue late-stage/device/portal/music/release audits.


### Hint persistence integration (2026-10-05)
- Isolated app save seeded at pit:3; normal UI run raised count to 4 and full page reload preserved it. Earlier source checks showed familiar 2D hazards stay quiet until urgent action while setup-critical cues remain early.
- No-input run ended at 117m, so this verifies hint save/lifecycle only, not full-route success. Typecheck/build/diff-check passed (916.84 kB / gzip 249.27 kB), console 0 errors/warnings. Continue late-stage/device/portal/music/release audits.


### Stage transition continuity (2026-10-05)
- Actual engine crossed 500m and 1,000m boundaries once each; HUD moved to zones 2/3, themes to COTTON CANDY/BATHROOM ESCAPE, energy reset to 100, invulnerability held for ~2.32s after six frames. No duplicate event or interruption.
- Controlled boundary injection only; visuals/audio/natural completion remain open. No source change; console 0 errors/warnings, diff check passed. Continue natural later-stage, device, live portal, human music, release reviews.


### Gate/stage progression monotonicity (2026-10-05)
- Fixed shared zone counter regression: distance stages now preserve any higher gate-earned zone. Stage toast distinguishes a newly opened zone from an existing zone continuing.
- Current-source checks: no-gate Stage 1 → Zone 2/COTTON CANDY; 2-gate Stage 1 remains Zone 3/BATHROOM ESCAPE; Stage 2 from Zone 2 → Zone 3. Live isolated app crossed 500m after 2 gates, lives 3, Zone 3 stable, energy restored, one stage callback/fanfare, BGM still running.
- Typecheck/build passed (916.93 kB / gzip 249.30 kB), console 0 errors/warnings, diff-check passed. Continue late-stage natural visual and device/portal/music/release checks.

### Stage progress HUD and accurate gate summary (2026-10-05)
- Added accessible HUD progress to the existing 500m stage boundary: current stage, progress bar, and meters to clear. Source fields derive from floored run distance.
- Corrected Game Over's third stat from misleading `STAGE = gates + 1` to `GATES = gates`.
- Verified typecheck, production build (919.89 kB / gzip 249.86 kB), diff-check, and preview HTTP 200. Live browser showed correct HUD at 25m and 106m; Game Over showed `GATES 0`; 390×844 emulation rendered the HUD without console errors/warnings. Physical-device validation remains open.
- Next implementation: define and ship a small in-run stage objective/reward loop, then validate it. Avoid spending more time on audit harness tuning; portal and human audio review still require real conditions.

### Rotating stage contracts (2026-10-05)
- Initial Stage 1 contract tune was 12 carrots/+20 shards; a later live route showed it completed too early, so the current target/reward is 36/+25. Stage 2 finds a hidden gate (+30), Stage 3 clears 500m without a crash (+45). Later carrot targets/rewards rise by cycle. Counters reset before next-segment pickups; shard upgrades and rewarded-doubling use the existing payout path.
- HUD shows contract progress, state, and reward; Game Over itemizes contract rewards. Mobile screenshot found a stage/energy overlap at 390×844; adjusted energy and hint positions and rechecked the running screen.
- Typecheck/build passed (923.57 kB / gzip 250.80 kB), diff-check, preview HTTP 200, console 0 errors/warnings. Instrumented current-source engine checks passed active/ready/failed states, the 20/30/45 shard success rewards, missed reward 0, and 38-shard total at 500m with 12 carrots.
- The reference game emphasizes several ways to play and improve, not presentation alone (CrazyGames: https://www.crazygames.com/kr/game/super-smash-flash). This runner uses its existing mechanics to provide those repeat goals; this does not add multiplayer or selectable fighter/level modes.
- Next: improve game-track phrase variety and arrangement; then real-condition music listening, phone touch, Poki lifecycle, and finish presentation/release review.

### Game BGM arrangement update (2026-10-05)
- Extended the game track to 128 steps (~14.1s at 136 BPM), with reprise and closing phrases, reducing the 7s melodic repeat. Softened lead to triangle and lowered chord/harmonic levels to reduce high-frequency harshness while retaining 2D/3D mix filtering.
- Typecheck/build passed (923.90 kB / gzip 250.90 kB), diff-check passed. Browser AudioContext stayed running on the game track through more than 128 steps; console 0 errors/warnings.
- Scheduler playback is verified; human judgment of melody/mix/fatigue is not. Next: App-level stage reward credit, then live Poki, physical device, human BGM and release audits. Full quality objective remains active.

### App/save contract payout integration (2026-10-05)
- In an isolated running App, injected the mounted engine to 499.9m with 12 carrots and invoked its real update across the 500m boundary. The App received the real stage and game-over events, showed +38 total coins including +20 contract shards, and persisted bestDist 500, runs 2, totalOrbs 24, shards 47. Since the prior run contributed 9, the tested run's 38 reward was credited once.
- Controlled state injection, not a natural route. Console 0 errors/warnings; preview HTTP 200. This closes App/save integration, not natural playability.
- Next: natural stage route/mission balance, human music review, physical-device controls, live Poki portal, remaining quality/release audits. Objective remains the full requested CrazyGames-level polish, music and defect-free behavior.

### Procedural Stage 1 and objective balance (2026-10-05)
- Actual App, normal random procedural route, keyboard events driven by live HUD cues: passed 500m at 505 with 3 lives, 0 hits, 123 carrots, 1 gate, 100 energy, and 25 Stage 1 contract shards banked. HUD was active at 14/36 carrots by 100m and ready at 44/36 by 200m.
- Raised target 12→36 and reward 20→25 after observing the first tune become ready before 100m. Current-source checks show 33/36 active and 43/36 ready; live HUD showed 0/36 and +25.
- After cue-driven input stopped, gameplay continued to Game Over at 627m, with +131 total shards including +25 contract. Isolated localStorage showed 288 total shards, 4 runs, and 666m best (profile includes prior runs). Typecheck/build passed (924.09 kB / gzip 250.91 kB), diff-check, preview HTTP 200, console 0 errors/warnings.
- Controller followed real HUD cues; route was automated rather than human. Next: Stage 2 gate contract through a natural route; then physical-device input, live Poki, human BGM listening, and full presentation/release audits.
