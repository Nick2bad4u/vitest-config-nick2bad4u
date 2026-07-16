import { expectTypeOf } from "vitest";

import {
    createBrowserVitestConfig,
    createDomVitestConfig,
    type VitestBrowserModeOptions,
    type VitestConfig,
} from "../src/vitest-config.js";

const browserProvider = {
    name: "type-test-browser",
    options: {},
    providerFactory: () => {
        throw new Error("Type-only provider.");
    },
    serverFactory: () => {
        throw new Error("Type-only provider.");
    },
} satisfies VitestBrowserModeOptions["provider"];

expectTypeOf(createDomVitestConfig("jsdom")).toExtend<VitestConfig>();
expectTypeOf(
    createBrowserVitestConfig({
        instances: [{ browser: "chromium" }],
        provider: browserProvider,
    })
).toExtend<VitestConfig>();

// @ts-expect-error -- a simulated-DOM factory requires an explicit choice
createDomVitestConfig();
// @ts-expect-error -- Node is handled by createVitestConfig, not the DOM factory
createDomVitestConfig("node");
// @ts-expect-error -- enabled Browser Mode requires a provider
createBrowserVitestConfig({ instances: [{ browser: "chromium" }] });
// @ts-expect-error -- enabled Browser Mode requires at least one instance
createBrowserVitestConfig({ instances: [], provider: browserProvider });
