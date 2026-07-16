import { describe, expect, it } from "vitest";

import {
    createBrowserVitestConfig,
    createDomVitestConfig,
    type VitestBrowserModeOptions,
} from "../src/vitest-config.js";

const browserProvider = {
    name: "test-browser",
    options: {},
    providerFactory: () => {
        throw new Error("The config-shape test must not start a browser.");
    },
    serverFactory: () => {
        throw new Error("The config-shape test must not start a server.");
    },
} satisfies VitestBrowserModeOptions["provider"];

describe("vitest environment factories", () => {
    it.each(["happy-dom", "jsdom"] as const)(
        "creates a %s configuration without replacing consumer policy",
        (domEnvironment) => {
            expect.assertions(8);

            const plugin = { name: "consumer-plugin" };
            const config = createDomVitestConfig(domEnvironment, {
                plugins: [plugin],
                test: {
                    coverage: {
                        exclude: ["fixtures/**"],
                        thresholds: { lines: 91 },
                    },
                    exclude: ["generated/**"],
                    include: ["spec/**/*.test.ts"],
                    reporters: ["dot"],
                    setupFiles: ["./test/setup.ts"],
                },
            });

            expect(config.plugins).toStrictEqual([plugin]);
            expect(config.test?.environment).toBe(domEnvironment);
            expect(config.test?.include).toStrictEqual(["spec/**/*.test.ts"]);
            expect(config.test?.setupFiles).toStrictEqual(["./test/setup.ts"]);
            expect(config.test?.reporters).toStrictEqual(["dot"]);
            expect(config.test?.exclude).toContain("generated/**");
            expect(config.test?.coverage?.exclude).toContain("fixtures/**");
            expect(config.test?.coverage?.thresholds).toStrictEqual({
                lines: 91,
            });
        }
    );

    it("rejects unsupported simulated-DOM environments", () => {
        expect.assertions(1);

        expect(() => createDomVitestConfig("node" as never)).toThrow(
            'DOM environment must be either "happy-dom" or "jsdom".'
        );
    });

    it("enables Browser Mode with consumer-owned provider and instances", () => {
        expect.assertions(10);

        const instances: VitestBrowserModeOptions["instances"] = [
            { browser: "chromium", name: "browser-unit" },
        ];
        const plugin = { name: "consumer-plugin" };
        const config = createBrowserVitestConfig(
            {
                headless: true,
                instances,
                provider: browserProvider,
            },
            {
                plugins: [plugin],
                test: {
                    coverage: { thresholds: { lines: 87 } },
                    exclude: ["generated/**"],
                    include: ["spec/browser/**/*.test.ts"],
                    reporters: ["dot"],
                    setupFiles: ["./test/setup-browser.ts"],
                },
            },
            { CI: "true", MAX_THREADS: "2" }
        );

        expect(config.plugins).toStrictEqual([plugin]);
        expect(config.test?.browser?.enabled).toBe(true);
        expect(config.test?.browser?.provider).toBe(browserProvider);
        expect(config.test?.browser?.instances).toBe(instances);
        expect(config.test?.browser?.headless).toBe(true);
        expect(config.test?.include).toStrictEqual([
            "spec/browser/**/*.test.ts",
        ]);
        expect(config.test?.setupFiles).toStrictEqual([
            "./test/setup-browser.ts",
        ]);
        expect(config.test?.reporters).toStrictEqual(["dot"]);
        expect(config.test?.exclude).toContain("generated/**");
        expect(config.test?.coverage?.thresholds).toStrictEqual({ lines: 87 });
    });

    it("rejects a missing Browser Mode provider", () => {
        expect.assertions(2);

        expect(() =>
            createBrowserVitestConfig({
                instances: [{ browser: "chromium" }],
            } as never)
        ).toThrow("Browser Mode requires a provider.");
        expect(() => createBrowserVitestConfig(undefined as never)).toThrow(
            "Browser Mode requires a provider."
        );
    });

    it("rejects an empty Browser Mode instance list", () => {
        expect.assertions(1);

        expect(() =>
            createBrowserVitestConfig({
                instances: [],
                provider: browserProvider,
            } as never)
        ).toThrow("Browser Mode requires at least one instance.");
    });
});
