# vitest-config-nick2bad4u

[![Continuous Integration](https://github.com/Nick2bad4u/vitest-config-nick2bad4u/actions/workflows/ci.yml/badge.svg)](https://github.com/Nick2bad4u/vitest-config-nick2bad4u/actions/workflows/ci.yml)

Composable Vitest configuration for Nick2bad4u TypeScript and npm repositories.

The supplied source file was named `vite.config.ts`, but it contained only Vitest policy. This package is intentionally named for Vitest; Vite build plugins, server settings, aliases, and framework integration remain consumer-owned.

## Install

```sh
npm install --save-dev vite vitest vitest-config-nick2bad4u
```

Install only the optional runtime that your configuration uses:

- Coverage: `@vitest/coverage-v8`
- Type tests: `typescript`
- Simulated DOM: `jsdom` or `happy-dom`
- Browser Mode: a provider such as `@vitest/browser-playwright`

Keep `vitest`, `@vitest/coverage-v8`, and Browser Mode provider packages on matching versions. Browser providers may also require a separate browser download; follow the selected provider's installation instructions.

## Node tests

`createVitestConfig()` is the Node/default factory. Test discovery, setup files, coverage sources, and thresholds remain explicit consumer policy.

```ts
// vitest.config.ts
import {
 createTypecheckConfig,
 createVitestConfig,
} from "vitest-config-nick2bad4u";

export default createVitestConfig({
 test: {
  coverage: {
   include: ["src/**/*.ts"],
  },
  include: ["test/**/*.{test,spec}.ts"],
  typecheck: createTypecheckConfig("./tsconfig.vitest-typecheck.json"),
 },
});
```

## Simulated-DOM tests

Choose the DOM implementation explicitly and install that package in the consumer. The factory rejects other environment names.

```ts
// vitest.config.ts
import { createDomVitestConfig } from "vitest-config-nick2bad4u";

export default createDomVitestConfig("jsdom", {
 test: {
  include: ["test/dom/**/*.test.ts"],
  setupFiles: ["./test/setup-dom.ts"],
 },
});
```

## Browser Mode

Browser Mode requires a consumer-supplied provider and at least one instance. The factory enables Browser Mode but does not choose a framework plugin, browser, test path, or provider package.

```ts
// vitest.config.ts
import { playwright } from "@vitest/browser-playwright";
import { createBrowserVitestConfig } from "vitest-config-nick2bad4u";

export default createBrowserVitestConfig(
 {
  instances: [{ browser: "chromium" }],
  provider: playwright(),
 },
 {
  test: {
   include: ["test/browser/**/*.test.ts"],
  },
 }
);
```

Real Vite applications can pass app-specific `plugins`, `resolve`, `build`, and `server` options in the factory overrides. Project/monorepo globs remain consumer-owned through `test.projects`.

## Merge contract

- Consumer `test.include`, `setupFiles`, reporters, coverage sources, coverage thresholds, and coverage reporters replace shared values.
- Test and coverage exclusions are additive.
- Framework plugins and all other top-level Vite options pass through unchanged.
- `createDomVitestConfig()` owns only `test.environment`.
- `createBrowserVitestConfig()` owns only `test.browser.enabled`; its provider and non-empty instance list are required consumer inputs.
- Typechecking is opt-in and defaults to `*.test-d.*`/`*.spec-d.*` type tests only.
- Environment is read each time a factory runs. `CI` disables file parallelism and defaults workers to one; a positive `MAX_THREADS` explicitly overrides the worker count.

The default does not publish a no-op setup file, inject Vitest globals, or impose coverage thresholds.

## Validation

```sh
npm run release:verify
```
