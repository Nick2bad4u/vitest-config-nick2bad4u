# Repository Instructions

This repository publishes `vitest-config-nick2bad4u`.
Treat the typed configuration factory and its merge semantics as the public package surface.

## Priorities

- Keep Vite application policy and framework plugins consumer-owned.
- Keep coverage sources, thresholds, test discovery, setup files, and typecheck paths out of defaults.
- Preserve explicit replacement semantics for consumer-owned arrays and additive exclusions.
- Read CI and worker environment during each factory call.
- Validate real Vitest behavior, package exports, and packed consumer usage before release.

## Commands

```sh
npm run build:runtime
npm run typecheck
npm test
npm run release:verify
```
