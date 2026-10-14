# Portal artwork candidates

These PNG cover files are local campaign-illustration candidates. They have not been uploaded, approved, or reviewed on either portal; the PNG covers are illustrations, not gameplay captures. MP4 preview candidates open on their matching static covers and transition into captured local gameplay. None has been uploaded or portal-reviewed.

## Provisional local recommendation (2026-10-12)

Use the gameplay-faithful low-poly family as the first portal-preview candidate because its pastel palette, chunky terrain, carrot pickups, rabbit, and dimension gate are the closest overall match to the current local game screen. The smoother mascot-faithful family looks more polished at full size, but its lighting and rendering style create a larger jump when the preview transitions into live gameplay.

- Poki: `poki-cover-gameplay-faithful-square-1080-v1.png` plus `poki-thumbnail-gameplay-faithful-low-poly-v1.mp4`.
- CrazyGames: `crazygames-cover-gameplay-faithful-title-square-800-v1.png`, `crazygames-cover-gameplay-faithful-title-landscape-1920x1080-v1.png`, and `crazygames-cover-gameplay-faithful-title-portrait-800x1200-v1.png`, paired with `crazygames-preview-gameplay-faithful-low-poly-title-landscape-1920x1080-v1.mp4` and `crazygames-preview-gameplay-faithful-low-poly-title-portrait-720x1080-v1.mp4`.
- This is a reversible local recommendation, not portal approval or an upload decision. The generated rabbit still differs from the live model, and hosted cropping, compression, placement, and cover-to-game transition have not been checked.

## Shared gameplay-aligned cover art v1

These generated covers use a real gameplay frame for the pastel world and an existing cover for the rabbit mascot. They share one visual direction but use separately composed square, landscape, and portrait masters rather than cropping one master to every aspect ratio:

- `shared-cover-gameplay-aligned-square-v1.png` — square source; exported as `poki-thumbnail-gameplay-aligned-1080-v1.png` (1080 × 1080) and `crazygames-cover-gameplay-aligned-square-800-v1.png` (800 × 800).
- `shared-cover-gameplay-aligned-landscape-master-v1.png` — landscape source; exported as `crazygames-cover-gameplay-aligned-landscape-1920x1080-v1.png` (1920 × 1080).
- `shared-cover-gameplay-aligned-portrait-master-v1.png` — portrait source; exported as `crazygames-cover-gameplay-aligned-portrait-800x1200-v1.png` (800 × 1200).
- Small-size comparison: [cover-candidates-2026-10-12-v2.png](../review/cover-candidates-2026-10-12-v2.png). Aspect-ratio check: [shared-cover-aspect-ratios-v1.png](../review/shared-cover-aspect-ratios-v1.png). The new rabbit reads much larger and the environment uses the live game's pastel palette and block/tree forms. The generated model still differs in facial expression, badge, proportions, and lighting; keep these as unselected local concepts pending hosted-build review.

## Mascot-faithful cross-dimension cover art v1

Generated a new three-format candidate family using the actual rabbit and world as references. The square master is based on the [2.2-second gameplay still](../review/gameplay-art-reference-v1.png); the landscape and portrait versions were composed separately to preserve the character and gate at each aspect ratio. These candidates remove the handheld plunger seen in older art and more closely match the white side-profile rabbit, pink-lined ear, red back pack, orange harness, carrot meadow, layered platforms, gold pickups, and cyan-violet dimension gate.

- Source art in `../concepts/`: `dimension-shift-runner-cross-dimension-cover-square-v1.png` (1254 × 1254), `dimension-shift-runner-cross-dimension-cover-landscape-v1.png` (1672 × 941), and `dimension-shift-runner-cross-dimension-cover-portrait-v1.png` (1024 × 1536).
- Poki square candidate: `poki-cover-mascot-faithful-square-1080-v1.png` (1080 × 1080).
- CrazyGames candidates: `crazygames-cover-mascot-faithful-square-800-v1.png` (800 × 800), `crazygames-cover-mascot-faithful-landscape-1920x1080-v1.png` (1920 × 1080), and `crazygames-cover-mascot-faithful-portrait-800x1200-v1.png` (800 × 1200).
- All four exports passed PNG decode and exact-dimension checks and were visually reviewed at their final sizes. The landscape export was upscaled from its 16:9 source; compare its edge detail against a portal preview before selecting it.
- The family is an improved illustration candidate, not a gameplay capture. Its lighting and detail remain more polished than the live render; no portal upload, host preview, or approval has occurred.

## CrazyGames title-bearing cover candidates v1

The current [CrazyGames cover guide](https://docs.crazygames.com/requirements/game-covers/) requires landscape 1920 × 1080, portrait 800 × 1200, and square 800 × 800 covers; it recommends the game title and prohibits extra text. The [Poki thumbnail guide](https://developers.poki.com/guide/game-thumbnail) recommends text-free, full-bleed square thumbnails, so the Poki candidate above remains text-free.

- Source art in `../concepts/`: `dimension-shift-runner-cover-crazygames-square-title-v1.png`, `dimension-shift-runner-cover-crazygames-landscape-title-v1.png`, and `dimension-shift-runner-cover-crazygames-portrait-title-v1.png`.
- Exports: `crazygames-cover-mascot-faithful-title-square-800-v1.png` (800 × 800), `crazygames-cover-mascot-faithful-title-landscape-1920x1080-v1.png` (1920 × 1080), and `crazygames-cover-mascot-faithful-title-portrait-800x1200-v1.png` (800 × 1200).
- The title is exactly `DIMENSION SHIFT RUNNER`; it is the only readable text. All three exports passed exact-dimension and full PNG-decode checks, then were visually reviewed at final size. The title treatment is bold, outlined, and color-matched to the dimension gate.
- Keep these as local candidates until a hosted preview confirms readability and fidelity. No cover is selected, uploaded, or portal-approved.

## Reduced-size cover readability review (2026-10-12)

- Reviewed Poki's square cover at 256 × 256 against the site's mint background and CrazyGames square, landscape, and portrait covers at 256 × 256, 320 × 180, and 160 × 240. Review samples: [Poki on mint](../review/poki-cover-256-on-playground-v1.png), [CrazyGames square](../review/crazygames-cover-square-256-v1.png), [landscape](../review/crazygames-cover-landscape-320x180-v1.png), and [portrait](../review/crazygames-cover-portrait-160x240-v1.png).
- At these reduced sizes, the Poki artwork reads as full-bleed; the rabbit and gate remain distinct from the mint page background. On CrazyGames, the rabbit, gate, and title remain identifiable in all three formats. These static samples do not establish final portal rendering, selection, or approval.

## Gameplay-faithful low-poly cover family v1

Created a second art direction to reduce the finish gap between polished campaign illustrations and the live low-poly game. The new compositions use the live five-biome gameplay capture as a style reference and keep the Carrot Meadow rabbit, layered platforms, pickups, toy buildings, trees, and dimension gate recognizable.

- Source compositions in `../concepts/`: `dimension-shift-runner-gameplay-faithful-square-v1.png` (1254 × 1254), `dimension-shift-runner-gameplay-faithful-square-title-v1.png` (1254 × 1254), `dimension-shift-runner-gameplay-faithful-landscape-v1.png` (1672 × 941), and `dimension-shift-runner-gameplay-faithful-portrait-v1.png` (1024 × 1536).
- Poki text-free square export: `poki-cover-gameplay-faithful-square-1080-v1.png` (1080 × 1080).
- CrazyGames title-bearing exports: `crazygames-cover-gameplay-faithful-title-square-800-v1.png` (800 × 800), `crazygames-cover-gameplay-faithful-title-landscape-1920x1080-v1.png` (1920 × 1080), and `crazygames-cover-gameplay-faithful-title-portrait-800x1200-v1.png` (800 × 1200). The landscape source was slightly upscaled; square and portrait were resized from larger masters.
- All four portal exports passed exact-dimension inspection and full PNG decode. Reduced-size samples: [Poki square at 256 px](../review/poki-cover-gameplay-faithful-square-256-v1.png), [CrazyGames square at 256 px](../review/crazygames-cover-gameplay-faithful-title-square-256-v1.png), [landscape at 320 × 180](../review/crazygames-cover-gameplay-faithful-title-landscape-320x180-v1.png), and [portrait at 160 × 240](../review/crazygames-cover-gameplay-faithful-title-portrait-160x240-v1.png). Rabbit and gate stay identifiable; the title remains readable in all three CrazyGames formats.
- The new family better matches the game's broad low-poly forms and palette, but the generated rabbit rendering and lighting still differ from a direct gameplay capture. Keep it as an unselected local candidate pending hosted-build review. No upload or portal approval occurred.

### Matched gameplay preview candidates v1

These previews begin with the gameplay-faithful covers above and transition into the same previously captured local gameplay. All are silent H.264/yuv420p MP4s; the opening cover at 0.1 seconds and gameplay at 1.2 seconds were visually reviewed, and all files passed full decode.

- `crazygames-preview-gameplay-faithful-low-poly-title-landscape-1920x1080-v1.mp4` — 1920 × 1080, 30 fps, 15.033 seconds, 10,373,143 bytes.
- `crazygames-preview-gameplay-faithful-low-poly-title-portrait-720x1080-v1.mp4` — 720 × 1080 (2:3), 30 fps, 15.033 seconds, 3,977,385 bytes. The portrait gameplay frame retains mobile HUD and touch controls.
- `poki-thumbnail-gameplay-faithful-low-poly-v1.mp4` — 1080 × 1080, 50 fps, 4.08 seconds, 1,222,691 bytes.
- Reviewed frames: [CrazyGames landscape cover](../review/crazygames-preview-gameplay-faithful-landscape-cover-v1.png), [landscape gameplay](../review/crazygames-preview-gameplay-faithful-landscape-play-v1.png), [portrait cover](../review/crazygames-preview-gameplay-faithful-portrait-cover-v1.png), [portrait gameplay](../review/crazygames-preview-gameplay-faithful-portrait-play-v1.png), [Poki cover](../review/poki-preview-gameplay-faithful-poki-cover-v1.png), and [Poki gameplay](../review/poki-preview-gameplay-faithful-poki-play-v1.png).
- These are local, unselected candidates. Portal playback/cropping, hosted-game fidelity, and approval remain unverified; none has been uploaded.

## Square Poki candidates

- `poki-thumbnail-smooth-model-1254.png` — 1254 x 1254; smooth rounded rabbit, pink ears, dark eyes, brown harness/badge, red-cup plunger, meadow, and dimension gate. Its character construction is closer to the sphere/capsule meshes in `src/game/player.ts` than the faceted alternative.
- `poki-thumbnail-low-poly-1254.png` — 1254 x 1254; faceted alternative retained for comparison. Its angular character is less faithful to the current smooth player meshes.
- `poki-thumbnail-gameplay-matched-1080.png` — 1080 x 1080 comparison candidate; the subject and colors match, but its furry/glossy rendering is less faithful to the game.
- `poki-thumbnail-static-1080.png` — original square campaign-art reference.

## CrazyGames cover set

The smooth-model alternative is exported at the current documented dimensions and keeps the same subject and split-dimension art direction across all three aspect ratios:

- `crazygames-cover-smooth-landscape-1920x1080.png` — 1920 x 1080.
- `crazygames-cover-smooth-portrait-800x1200.png` — 800 x 1200.
- `crazygames-cover-smooth-square-800.png` — 800 x 800.
- `crazygames-cover-smooth-landscape-master.png` and `crazygames-cover-smooth-portrait-master.png` — larger generated composition masters used for the landscape and portrait exports.
- `crazygames-cover-landscape-1920x1080.png`, `crazygames-cover-portrait-800x1200.png`, `crazygames-cover-square-800.png`, and `dimension-shift-runner-cover-*-master.png` — earlier cover candidates and source art retained for comparison.

Full-size and reduced-size visual checks confirm that the rabbit, plunger, gate, and two color worlds remain recognizable across the new set. These are polished illustrations: their lighting, pose, and scenery are more elaborate than a live gameplay frame. Compare them with the current hosted build and portal preview before selecting one.

## CrazyGames title-cover gameplay preview candidates v1

These local previews now open on the title-bearing mascot-faithful covers above, then crossfade into actual captured gameplay. The current [CrazyGames cover guide](https://docs.crazygames.com/requirements/game-covers/) caps previews at 50 MB, requires landscape 1080p and portrait 2:3 preview sizes, and requires silent MP4; both files are below the size limit, are silent, and passed full decode.

- `crazygames-preview-mascot-faithful-title-landscape-1920x1080-v2.mp4` — 1920 × 1080, H.264/yuv420p TV range, 30 fps, 15.033 seconds, 12,337,414 bytes.
- `crazygames-preview-mascot-faithful-title-portrait-720x1080-v2.mp4` — 720 × 1080 (2:3), H.264/yuv420p TV range, 30 fps, 15.033 seconds, 4,872,957 bytes.
- Each holds the matching cover for 0.4 seconds, crossfades over 0.35 seconds, then shows the existing local captured gameplay. Openings and gameplay frames were visually checked at 0.1 and 1.2 seconds: [landscape cover](../review/crazygames-preview-mascot-faithful-title-landscape-cover-v2.png), [landscape gameplay](../review/crazygames-preview-mascot-faithful-title-landscape-play-v2.png), [portrait cover](../review/crazygames-preview-mascot-faithful-title-portrait-cover-v2.png), and [portrait gameplay](../review/crazygames-preview-mascot-faithful-title-portrait-play-v2.png). No audio stream is present. The portrait footage retains its mobile HUD and touch controls.
- The landscape still is upscaled from a 1672 × 941 composition to 1920 × 1080. Host-preview fidelity and portal approval remain open; no upload was made.

## Earlier CrazyGames gameplay preview candidates

Each video begins on its matching static cover, holds the cover for 0.4 seconds, then crossfades into captured local gameplay over 0.35 seconds. Both are silent H.264 MP4s at 30 fps, below the documented 20-second and 50 MB limits, and use isolated local Chrome sessions of the latest production build. They have not been uploaded, approved, or checked in a portal preview.

- `crazygames-preview-landscape-1920x1080.mp4` — 1920 x 1080; 15.40 seconds; 13,819,119 bytes. The captured run reached 181 m in Zone 2 and showed one gate; no browser JavaScript exceptions were recorded.
- `crazygames-preview-portrait-720x1080.mp4` — 720 x 1080 (2:3); 15.40 seconds; 5,636,482 bytes. The mobile-sized touch session reached 184 m in Zone 2 and showed one gate; no browser JavaScript exceptions were recorded. At 720 x 1080, the stage/mission panel ends at y=155 and the energy gauge begins at y=168, leaving a 13 px gap.
- Matching-cover alternatives: `crazygames-preview-gameplay-aligned-landscape-1920x1080-v1.mp4` — 1920 × 1080, 30 fps, 15.033 seconds, 10,976,641 bytes; `crazygames-preview-gameplay-aligned-portrait-720x1080-v1.mp4` — 720 × 1080 (2:3), 30 fps, 15.033 seconds, 4,266,452 bytes. Both are video-only H.264/yuv420p; full decode passed. They replace the old cover and its opening transition with the matching new cover, then continue the same local gameplay capture. These remain local, unselected alternatives.

The landscape and portrait opening frames were extracted and visually checked against their matching covers. Gameplay frames were also checked for the current 3D tutorial hint, HUD placement, visible player, and controls. Local browser emulation does not confirm physical-device behavior or the final hosted game/cover match.

CrazyGames requirements: [cover and preview media guide](https://docs.crazygames.com/requirements/game-covers/).

## Poki gameplay video candidate and remaining portal checks

- Poki animated gameplay thumbnail candidate: [dimension-shift-runner-gameplay.mp4](./dimension-shift-runner-gameplay.mp4) — video-only H.264 MP4, 1080 × 1080, constant 50 fps, 4.96 seconds, 1,090,766 bytes. The source is real 2D gameplay; its browser capture averaged 46.8 fps and was converted to constant 50 fps with repeated frames. A current mid-clip frame was checked and contains no HUD, so the responsive HUD spacing change does not affect this thumbnail. It matches the listed file-profile values in [Poki's thumbnail guide](https://developers.poki.com/guide/game-thumbnail); final portal review remains pending.
- Additional local alternative: [poki-thumbnail-gameplay-2d3d-v2.mp4](./poki-thumbnail-gameplay-2d3d-v2.mp4) — video-only H.264 MP4, 1080 × 1080, limited-range yuv420p, constant 50 fps, 4.32 seconds, 1,401,305 bytes. It opens on the smooth-model square art and cuts through actual local production-build 3D running, 2D running, and a pit jump. The source was 394 full-page Chrome screencast frames over 5.15 seconds; the isolated run ended in 2D at 61.327 m with 3 lives and 0 browser JavaScript exceptions. The crop removes external HUD panels; brief in-canvas reward feedback remains visible. The polished static illustration is more saturated than the live scene, so keep this as a comparison candidate until it is checked against a portal preview.
- Gameplay-faithful alternative: [poki-thumbnail-gameplay-faithful-v3.mp4](./poki-thumbnail-gameplay-faithful-v3.mp4) — video-only H.264 MP4, 1080 × 1080, limited-range yuv420p, constant 50 fps, 4.32 seconds, 913,770 bytes. It opens on a 1080 × 1080 crop of a real local production-build 2D frame ([still](./poki-thumbnail-gameplay-faithful-1080.png)), then fades into the same 3D/2D/pit-jump sequence as v2. Its real pastel game frame matches live colors better, while the crop and simple in-game modeling look less polished than the campaign illustration. Keep it unselected pending reduced-size and hosted-build comparison.
- Shared-art alternative: [poki-thumbnail-gameplay-aligned-v4.mp4](./poki-thumbnail-gameplay-aligned-v4.mp4) — video-only H.264 MP4, 1080 × 1080, limited-range yuv420p, constant 50 fps, 4.32 seconds, 969,128 bytes. It opens on [the shared gameplay-aligned square art](./poki-thumbnail-gameplay-aligned-1080-v1.png), then fades into the same real local gameplay section as v2. The cover is also exported for CrazyGames in landscape, portrait, and square sizes above. It is a generated illustration rather than an in-game capture, so compare the mascot with the hosted build before selecting.
- Mascot-faithful alternative: `poki-thumbnail-mascot-faithful-v5-limited-v2.mp4` — video-only H.264 MP4, 1080 × 1080, limited-range yuv420p, constant 50 fps, 4.08 seconds, 1,077,066 bytes. It opens on the new text-free square cover, then fades into actual 3D gameplay from the prior local capture. Reviewed stills: [cover opening](../review/poki-thumbnail-mascot-faithful-v5-cover-v2.png) and [post-transition gameplay](../review/poki-thumbnail-mascot-faithful-v5-play-v2.png). Full decode passed. It fits Poki's current [animated-thumbnail requirements](https://developers.poki.com/guide/your-game-page), but remains unselected pending hosted-preview fidelity review.
- Physical-device touch validation and live Poki/CrazyGames SDK and ad review.
- Hosted cover review and final selection against each portal build, if a portal preview is available. Uploading assets or changing portal accounts is outside this release-preparation task; neither has been done.

Specifications: [Poki thumbnail guide](https://developers.poki.com/guide/game-thumbnail), [Poki animated thumbnail/page requirements](https://developers.poki.com/guide/your-game-page), and [CrazyGames cover guide](https://docs.crazygames.com/requirements/game-covers/).
