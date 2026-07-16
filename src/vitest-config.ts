import { setHas } from "ts-extras";
import {
    coverageConfigDefaults,
    defaultExclude,
    defineConfig,
    type ViteUserConfig as UserConfig,
} from "vitest/config";

/** Vitest V8 coverage configuration accepted by this package. */
export type VitestCoverageConfig = NonNullable<VitestTestConfig["coverage"]>;
/** Vitest typecheck configuration accepted by this package. */
export type VitestTypecheckConfig = NonNullable<VitestTestConfig["typecheck"]>;

type VitestReporters = Exclude<VitestTestConfig["reporters"], undefined>;

type VitestTestConfig = NonNullable<UserConfig["test"]>;

const enabledEnvironmentValues: ReadonlySet<string> = new Set([
    "1",
    "on",
    "true",
    "yes",
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
