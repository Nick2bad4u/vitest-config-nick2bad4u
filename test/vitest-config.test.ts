import { describe, expect, it } from "vitest";

import {
    createCoverageConfig,
    createTypecheckConfig,
    createVitestConfig,
} from "../src/vitest-config.js";

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

    it("returns independent config objects", () => {
        expect.assertions(2);

        const first = createVitestConfig();
        const second = createVitestConfig();

        expect(first).not.toBe(second);
        expect(first.test).not.toBe(second.test);
    });
});
