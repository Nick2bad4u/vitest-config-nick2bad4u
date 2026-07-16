import { describe, expect, it, vi } from "vitest";

import {
    createCoverageConfig,
    createTypecheckConfig,
    createVitestConfig,
} from "../src/vitest-config.js";

const withStubbedEnvironment = <Result>(callback: () => Result): Result => {
    try {
        return callback();
    } finally {
        vi.unstubAllEnvs();
    }
};

describe("vitest shared config", () => {
    it("leaves consumer-owned discovery, setup, and thresholds unset", () => {
        expect.assertions(4);

        const config = createVitestConfig();

        expect(config.test).not.toHaveProperty("include");
        expect(config.test).not.toHaveProperty("setupFiles");
        expect(config.test).not.toHaveProperty("typecheck");
        expect(config.test?.coverage).not.toHaveProperty("thresholds");
    });

    it("replaces owned arrays while keeping exclusions additive", () => {
        expect.assertions(5);

        const config = createVitestConfig({
            test: {
                coverage: {
                    include: ["src/**/*.ts"],
                    provider: "v8",
                    reporter: ["text"],
                },
                exclude: ["fixtures/**"],
                include: ["spec/**/*.test.ts"],
                reporters: ["dot"],
                setupFiles: ["./test/setup.ts"],
            },
        });

        expect(config.test?.include).toStrictEqual(["spec/**/*.test.ts"]);
        expect(config.test?.setupFiles).toStrictEqual(["./test/setup.ts"]);
        expect(config.test?.reporters).toStrictEqual(["dot"]);
        expect(config.test?.exclude).toContain("fixtures/**");
        expect(config.test?.coverage?.reporter).toStrictEqual(["text"]);
    });

    it("reads worker environment supplied to the factory", () => {
        expect.assertions(4);

        const ciConfig = createVitestConfig({}, { CI: "true" });
        const localConfig = createVitestConfig(
            {},
            { CI: "false", MAX_THREADS: "3" }
        );

        expect(ciConfig.test?.fileParallelism).toBe(false);
        expect(ciConfig.test?.maxWorkers).toBe(1);
        expect(localConfig.test?.fileParallelism).toBe(true);
        expect(localConfig.test?.maxWorkers).toBe(3);
    });

    it("reads the process environment during every factory call", () => {
        expect.assertions(4);

        const { ciConfig, localConfig } = withStubbedEnvironment(() => {
            vi.stubEnv("CI", "false");
            vi.stubEnv("MAX_THREADS", "4");
            const localConfig = createVitestConfig();

            vi.stubEnv("CI", "true");
            vi.stubEnv("MAX_THREADS", "invalid");
            const ciConfig = createVitestConfig();

            return { ciConfig, localConfig };
        });

        expect(localConfig.test?.fileParallelism).toBe(true);
        expect(localConfig.test?.maxWorkers).toBe(4);
        expect(ciConfig.test?.fileParallelism).toBe(false);
        expect(ciConfig.test?.maxWorkers).toBe(1);
    });

    it("builds explicit coverage and typecheck fragments", () => {
        expect.assertions(4);

        const coverage = createCoverageConfig({
            include: ["src/**/*.ts"],
            reporter: ["json"],
        });
        const typecheck = createTypecheckConfig("./tsconfig.type-tests.json");

        expect(coverage.include).toStrictEqual(["src/**/*.ts"]);
        expect(coverage.reporter).toStrictEqual(["json"]);
        expect(typecheck.enabled).toBe(true);
        expect(typecheck.include).toStrictEqual([
            "**/*.{test,spec}-d.{ts,tsx,mts,cts}",
        ]);
    });

    it("returns independent config objects and shared arrays", () => {
        expect.assertions(5);

        const first = createVitestConfig();
        const second = createVitestConfig();

        expect(first).not.toBe(second);
        expect(first.test).not.toBe(second.test);
        expect(first.test?.exclude).not.toBe(second.test?.exclude);
        expect(first.test?.reporters).not.toBe(second.test?.reporters);
        expect(first.test?.coverage?.exclude).not.toBe(
            second.test?.coverage?.exclude
        );
    });
});
