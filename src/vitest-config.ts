import type { ArrayElement, Except } from "type-fest";

import { assertDefined, isEmpty, setHas } from "ts-extras";
import {
    coverageConfigDefaults,
    defaultExclude,
    defineConfig,
    type ViteUserConfig as UserConfig,
} from "vitest/config";

/** Browser Mode configuration accepted by Vitest. */
export type VitestBrowserConfig = NonNullable<VitestTestConfig["browser"]>;
/** Overrides accepted by the Browser Mode factory. */
export type VitestBrowserConfigOverrides =
    VitestConfigWithoutTestOption<"browser">;
/** Browser Mode instance accepted by Vitest. */
export type VitestBrowserInstance = ArrayElement<
    NonNullable<VitestBrowserConfig["instances"]>
>;
/** Browser Mode options that are required when the mode is enabled. */
export type VitestBrowserModeOptions = Except<
    VitestBrowserConfig,
    | "enabled"
    | "instances"
    | "provider"
> & {
    instances: [VitestBrowserInstance, ...VitestBrowserInstance[]];
    provider: NonNullable<VitestBrowserConfig["provider"]>;
};
/** Top-level Vite and Vitest configuration accepted by this package. */
export type VitestConfig = UserConfig;
/** Vitest V8 coverage configuration accepted by this package. */
export type VitestCoverageConfig = NonNullable<VitestTestConfig["coverage"]>;
/** Overrides accepted by the simulated-DOM factory. */
export type VitestDomConfigOverrides =
    VitestConfigWithoutTestOption<"environment">;
/** Supported simulated-DOM environments. */
export type VitestDomEnvironment = "happy-dom" | "jsdom";

/** Vitest test configuration accepted by this package. */
export type VitestTestConfig = NonNullable<VitestConfig["test"]>;

/** Vitest typecheck configuration accepted by this package. */
export type VitestTypecheckConfig = NonNullable<VitestTestConfig["typecheck"]>;
type RuntimeBrowserModeOptions = Readonly<
    Partial<Pick<VitestBrowserModeOptions, "instances" | "provider">>
>;

type VitestConfigWithoutTestOption<Option extends keyof VitestTestConfig> =
    Except<VitestConfig, "test"> & {
        test?: Except<VitestTestConfig, Option>;
    };
type VitestReporters = Exclude<VitestTestConfig["reporters"], undefined>;

const enabledEnvironmentValues: ReadonlySet<string> = new Set([
    "1",
    "on",
    "true",
    "yes",
]);
const supportedDomEnvironments: ReadonlySet<VitestDomEnvironment> = new Set([
    "happy-dom",
    "jsdom",
]);

// eslint-disable-next-line n/no-process-env -- executable config intentionally reads Vitest and CI environment
const runtimeEnvironment: Readonly<NodeJS.ProcessEnv> = process.env;

const isEnabled = (value: string | undefined): boolean =>
    typeof value === "string" &&
    setHas(enabledEnvironmentValues, value.toLowerCase());

const getMaxWorkers = (environment: Readonly<NodeJS.ProcessEnv>): number => {
    const isCi = isEnabled(environment["CI"]);
    const configured = Math.trunc(
        Number(environment["MAX_THREADS"] ?? (isCi ? "1" : "8"))
    );

    return configured > 0 && configured < Infinity ? configured : 1;
};

const getReporters = (
    environment: Readonly<NodeJS.ProcessEnv>
): VitestReporters =>
    isEnabled(environment["VITEST_HANGING_PROCESS_REPORTER"])
        ? ["default", "hanging-process"]
        : ["default"];

const assertBrowserModeOptions = (
    browser: RuntimeBrowserModeOptions | undefined
): void => {
    assertDefined(browser, "Browser Mode requires a provider.");
    assertDefined(browser.provider, "Browser Mode requires a provider.");

    if (!Array.isArray(browser.instances) || isEmpty(browser.instances)) {
        throw new TypeError("Browser Mode requires at least one instance.");
    }
};

/**
 * Create a Vitest Browser Mode configuration.
 *
 * The provider, browser instances, and any framework plugins remain
 * consumer-owned. The consumer must install the selected browser provider.
 *
 * @param browser - Browser provider and one or more browser instances.
 * @param overrides - Consumer-owned Vite and Vitest options.
 * @param environment - Runtime environment used for CI and worker defaults.
 *
 * @returns A fresh Vitest configuration with Browser Mode enabled.
 *
 * @throws {@link TypeError} When the provider or browser instances are missing.
 */
export function createBrowserVitestConfig(
    browser: Readonly<VitestBrowserModeOptions>,
    overrides: VitestBrowserConfigOverrides = {},
    environment: Readonly<NodeJS.ProcessEnv> = runtimeEnvironment
): UserConfig {
    assertBrowserModeOptions(browser);

    return createVitestConfig(
        {
            ...overrides,
            test: {
                ...overrides.test,
                browser: {
                    ...browser,
                    enabled: true,
                },
            },
        },
        environment
    );
}

/** Create the shared V8 coverage fragment. */
export function createCoverageConfig(
    overrides: Partial<VitestCoverageConfig> = {}
): VitestCoverageConfig {
    const sharedExclude = ["**/*.d.ts", ...coverageConfigDefaults.exclude];
    const { exclude, reporter, ...rest } = overrides;

    return {
        allowExternal: false,
        clean: true,
        cleanOnRerun: true,
        exclude: [...sharedExclude, ...(exclude ?? [])],
        excludeAfterRemap: true,
        provider: "v8",
        reporter: reporter ?? [
            "text",
            "json",
            "lcov",
            "html",
        ],
        reportOnFailure: true,
        reportsDirectory: "./coverage",
        skipFull: true,
        ...rest,
    };
}

/**
 * Create a Vitest configuration for tests that need a simulated DOM.
 *
 * The consumer must install the selected `happy-dom` or `jsdom` package.
 *
 * @param domEnvironment - Simulated DOM implementation to use.
 * @param overrides - Consumer-owned Vite and Vitest options.
 * @param environment - Runtime environment used for CI and worker defaults.
 *
 * @returns A fresh Vitest configuration using the selected DOM environment.
 *
 * @throws {@link TypeError} When the environment is not `happy-dom` or `jsdom`.
 */
export function createDomVitestConfig(
    domEnvironment: VitestDomEnvironment,
    overrides: VitestDomConfigOverrides = {},
    environment: Readonly<NodeJS.ProcessEnv> = runtimeEnvironment
): UserConfig {
    if (!setHas(supportedDomEnvironments, domEnvironment)) {
        throw new TypeError(
            'DOM environment must be either "happy-dom" or "jsdom".'
        );
    }

    return createVitestConfig(
        {
            ...overrides,
            test: {
                ...overrides.test,
                environment: domEnvironment,
            },
        },
        environment
    );
}

/** Create an opt-in Vitest type-test fragment. */
export function createTypecheckConfig(
    tsconfig: string,
    overrides: Partial<VitestTypecheckConfig> = {}
): VitestTypecheckConfig {
    const { exclude, include, ...rest } = overrides;

    return {
        allowJs: false,
        checker: "tsc",
        enabled: true,
        exclude: [
            "**/.{idea,git,cache,output,temp}/**",
            "**/dist*/**",
            ...defaultExclude,
            ...(exclude ?? []),
        ],
        ignoreSourceErrors: false,
        include: include ?? ["**/*.{test,spec}-d.{ts,tsx,mts,cts}"],
        only: false,
        spawnTimeout: 10_000,
        tsconfig,
        ...rest,
    };
}

/**
 * Create a fresh Vitest configuration with conservative Node defaults.
 *
 * Consumer-owned arrays such as `include`, `setupFiles`, reporters, coverage
 * sources, and coverage reporters replace defaults. Test and coverage exclude
 * arrays are additive.
 */
export function createVitestConfig(
    overrides: UserConfig = {},
    environment: Readonly<NodeJS.ProcessEnv> = runtimeEnvironment
): UserConfig {
    const isCi = isEnabled(environment["CI"]);
    const overrideTest = overrides.test ?? {};
    const overrideCoverage = overrideTest.coverage;
    const baseCoverage = createCoverageConfig();
    const baseExclude = [
        "**/.cache/**",
        "**/.stryker-tmp/**",
        "**/coverage/**",
        "**/dist/**",
        "**/node_modules/**",
        ...defaultExclude,
    ];

    const config: UserConfig = {
        cacheDir: "./.cache/vitest",
        ...overrides,
        test: {
            attachmentsDir: "./.cache/vitest/.vitest-attachments",
            chaiConfig: {
                includeStack: false,
                showDiff: true,
                truncateThreshold: 40,
            },
            dangerouslyIgnoreUnhandledErrors: false,
            environment: "node",
            expect: {
                poll: { interval: 50, timeout: 15_000 },
                requireAssertions: false,
            },
            fileParallelism: !isCi,
            hookTimeout: 15_000,
            isolate: true,
            maxWorkers: getMaxWorkers(environment),
            restoreMocks: true,
            retry: 0,
            teardownTimeout: 15_000,
            testTimeout: 15_000,
            ...overrideTest,
            coverage: overrideCoverage
                ? createCoverageConfig(overrideCoverage)
                : baseCoverage,
            exclude: [...baseExclude, ...(overrideTest.exclude ?? [])],
            reporters: overrideTest.reporters ?? getReporters(environment),
        },
    };

    return defineConfig(config);
}

/** Directly importable package default. */
const defaultVitestConfig: UserConfig = createVitestConfig();

export default defaultVitestConfig;
