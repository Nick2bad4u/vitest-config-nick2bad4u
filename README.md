# vitest-config-nick2bad4u

[![Continuous Integration](https://github.com/Nick2bad4u/vitest-config-nick2bad4u/actions/workflows/ci.yml/badge.svg)](https://github.com/Nick2bad4u/vitest-config-nick2bad4u/actions/workflows/ci.yml)

Composable Vitest configuration for Nick2bad4u TypeScript and npm repositories.

The supplied source file was named `vite.config.ts`, but it contained only Vitest policy. This package is intentionally named for Vitest; Vite build plugins, server settings, aliases, and framework integration remain consumer-owned.

## Install

```sh
npm install --save-dev vite vitest vitest-config-nick2bad4u
```

Install `@vitest/coverage-v8` when using coverage and TypeScript when enabling Vitest's experimental type-test runner.

## Usage

```ts
// vitest.config.ts
import {
 createTypecheckConfig,
 createVitestConfig,
} from "vitest-config-nick2bad4u";

export default createVitestConfig({
 test: {
  include: ["test/**/*.{test,spec}.ts"],
  coverage: {
   include: ["src/**/*.ts"],
   provider: "v8",
   thresholds: {
    branches: 70,
    functions: 90,
    lines: 85,
    statements: 85,
   },
  },
  typecheck: createTypecheckConfig("./tsconfig.vitest-typecheck.json"),
 },
});
```

Real Vite applications should keep their local `vite.config.ts` and pass app-specific plugins/build/server settings alongside `test`.

## Merge contract

- Consumer `test.include`, `setupFiles`, reporters, coverage sources, and coverage reporters replace shared values.
- Test and coverage exclusions are additive.
- Coverage thresholds and source globs are consumer-owned because meaningful values vary by repository.
- Typechecking is opt-in and defaults to `*.test-d.*`/`*.spec-d.*` type tests only.
- Environment is read each time `createVitestConfig()` runs. `CI` bounds workers to one; `MAX_THREADS` accepts a positive explicit value.

The default does not publish a no-op setup file, inject Vitest globals, or retain cosmetic `picocolors` diff styling.

## Validation

```sh
npm run release:verify
```
