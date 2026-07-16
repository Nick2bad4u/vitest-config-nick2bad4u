import { defineConfig } from "vitest/config";

import { createVitestConfig, type VitestConfig } from "./src/vitest-config.js";

const vitestConfig: VitestConfig = defineConfig(
    createVitestConfig({
        test: {
            coverage: {
                include: ["src/**/*.ts"],
                reporter: [
                    "text",
                    "json",
                    "lcov",
                    "html",
                ],
                thresholds: {
                    autoUpdate: false,
                    branches: 80,
                    functions: 80,
                    lines: 85,
                    statements: 85,
                },
            },
            environment: "node",
            exclude: ["test/fixtures/**"],
            include: ["test/**/*.{test,spec}.{ts,tsx,js,mjs,cjs,mts,cts}"],
            restoreMocks: true,
            slowTestThreshold: 300,
        },
    })
);

export default vitestConfig;
