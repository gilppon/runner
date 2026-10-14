# Dimension Shift Runner — Art Direction and Background Upgrade

**Status:** local art pass implemented; portal/device certification remains external, 2026-10-12  
**Goal:** give the title, five biome environments, 2D/3D transition, Hub/tower, and supporting visuals one coherent, higher-fidelity art direction while preserving fast browser loading and gameplay readability.

## Current visual gap

The live scene has a clear, charming toy-runner foundation, but the five zones mostly reuse the same cloud field, rolling hills, rounded trees, toy-city towers, and large multicolor warp rings. Palette changes alone do not make each biome feel like a new place. Screenshots of the title and an active Carrot Meadow run also show broad pale areas, weak atmospheric separation, and limited small-scale material detail. The existing thumbnails can look more polished than the real game scene, so new in-game scenery should be built to match what the runner actually shows.

## Art direction: “Dimensional Pocket Worlds”

- Keep the friendly low-poly toy-diorama identity, but make the shapes intentional and sculpted: clear silhouettes, bevel-like edge highlights, layered materials, and restrained surface accents.
- Compose each scene in three depth bands: quiet far silhouettes and sky landmarks, readable mid-distance biome props, and a crisp track edge/foreground. Keep decorative contrast and motion below the player, collectibles, hazards, and their cues.
- Give each biome a distinct silhouette and material language, not just a different tint. Share a small geometry/material library so the worlds still feel like one game.
- Treat 2D and 3D as two views of the same world. Keep landmarks behind the run lane and use dimension shift to reveal depth, lighting, and restrained portal energy without obscuring controls or hazards.
- Align the title and Hub environment with the actual in-game scene; use the rendered world and existing bundled type rather than unrelated cover-art illustrations.
- Preserve cheerful all-ages content and the original rabbit/runner identity. Avoid portal logos, copied competitor assets, visual clutter, and generic neon-gradient decoration.

## Biome identity targets

| Biome | Scene identity | Signature scenery and materials |
|---|---|---|
| Carrot Meadow | Sunlit garden valley | Terraced soil, carrot beds, leafy crop silhouettes, a small windmill/greenhouse landmark, warm clay track edges |
| Cotton Candy | Floating confectionery canyon | Sugar-glass arches, striped candy poles, soft cloud mounds, glossy-but-muted candy surfaces |
| Bathroom Escape | Oversized porcelain washroom | Repeating tile structure, mirror and faucet silhouettes, porcelain basins, waterline reflections, sparse soap bubbles |
| Sunny Park | Golden-hour city park | Layered tree silhouettes, flower beds, a footbridge or gazebo, benches/lamps as distant props, long warm highlights |
| Moonlight Picnic | Quiet twilight campsite | Crescent moon, layered dark hills, pine silhouettes, lanterns and picnic shapes, restrained constellation accents |

Hazards, track boundaries, pickups, and character silhouettes retain stronger contrast than background props. Night and bathroom scenes should remain readable on low-brightness phone screens.

## Implementation sequence

1. **Visual foundation:** tune per-biome sky/horizon values, atmospheric depth, material roughness, and light balance; remove the oversized always-on multicolor rings from the primary sightline or make them subtle and theme-aware.
2. **Biome kits:** introduce reusable, low-poly landmark/prop sets for all five themes. Replace the “same trees and city with new colors” pattern with distinct silhouettes while reusing geometries/materials and keeping background objects pooled or instanced where practical.
3. **Ground and dimension transition:** improve the track’s layered side profile and edge detail; make 2D-to-3D reveal more depth without adding visual noise or changing collisions, timing, speed, rewards, or controls.
4. **Title and Hub consistency:** carry the real biome materials and landmarks into the title/Hub backdrop; keep the existing title and tower flows legible on compact screens.
5. **Performance and delivery:** prefer procedural/reused geometry and local bundled resources. Check initial and total build sizes, avoid external requests and absolute asset paths, and inspect frame stability/scene complexity on the local browser.
6. **Local verification:** capture each biome in 2D and 3D at desktop 16:9, portrait, and compact viewports; verify hazards/player/UI stay legible, title/Hub remain usable, transitions are smooth, and no horizontal/page overflow appears. Run typecheck, production build, and diff checks after the art changes.

## Platform requirements used as guardrails

- [Poki quality and technical requirements](https://developers.poki.com/guide/requirements-quality): desktop, mobile, and tablet support; proportional 16:9 full-canvas scaling; local bundled assets rather than external requests; small, fast-loading builds; controls and UI that adapt to input and viewport.
- [CrazyGames technical requirements](https://docs.crazygames.com/requirements/technical/): maximum 250 MB total package, initial download ≤50 MB (≤20 MB for mobile homepage eligibility), relative asset paths, and smooth operation on a 4 GB RAM Chromebook-class device.
- This local work can check the implementation and package, but cannot certify a portal preview, hardware feel, or approval outcome. No upload or portal-account action is part of the goal.

## Implemented local art pass

- Added five theme-specific layered SVG landscapes as small inline data URLs: carrot garden, candy canyon, tiled bathroom, sunny park, and moonlit picnic. The artwork is bundled in source and makes no external image requests.
- Connected the scenery to the live sky and dimension transition, and subdued the older generic skyline/props so each zone reads as its own place.
- Repositioned decorative 3D props behind the runner and away from the opening spawn; adjusted candy landmarks after checking the runner silhouette against the white props.
- Updated title colors and primary action styling to match the worlds, and added a mint/amber tower blueprint treatment in the Hub.
- Kept gameplay rules, controls, hazard placement, rewards, and portal SDK flow out of this art pass.

## Local verification and remaining limits

- Verified typecheck and `git diff --check` successfully after the art edits.
- Ran the game in the isolated local browser and inspected the distinct artwork for all five biomes. Live-play contrast was checked in Cotton Candy, Bathroom Escape, Sunny Park, and Moonlight Picnic; Moonlight was checked in both 2D and 3D. Carrot Meadow was checked in the default title and the earlier 2D/3D baseline views. Also inspected the title and Hub at desktop, portrait, and compact viewports; no visible horizontal overflow or clipped primary controls was found.
- The standard `npm run build` path hits a Windows sandbox mismatch: Vite 7.3.2's `realpathSync.native` gets `EPERM` for `index.html`, while Node's non-native `realpathSync` succeeds. A one-off Vite build API call with `resolve.preserveSymlinks: true` completed without changing project config and emitted the single-file `dist/index.html` at 983,434 bytes (267,144 bytes gzip); no external script or stylesheet link is present. This is comfortably below CrazyGames' documented initial and total package limits and supports Poki's small, fast-loading guidance. The standard script's environment error and use of the per-run workaround remain documented for reproducibility.
- Poki/CrazyGames portal preview, target-device performance, and acceptance certification still require the developer's own portal submissions and devices. No portal account or submission was touched.
