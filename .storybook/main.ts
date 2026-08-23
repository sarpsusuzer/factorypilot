import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "../src");

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  staticDirs: ["../public"],

  viteFinal: async (viteConfig) => {
    viteConfig.resolve ??= {};

    // Vite hands us either form depending on what ran before; normalise so we
    // can prepend ordered entries (the data mock must win over the bare `@/`).
    const existing = viteConfig.resolve.alias;
    const inherited = Array.isArray(existing)
      ? existing
      : Object.entries(existing ?? {}).map(([find, replacement]) => ({
          find,
          replacement: replacement as string,
        }));

    viteConfig.resolve.alias = [
      // Swap the Supabase-backed store for fixtures — see mocks/data.ts.
      { find: /^@\/lib\/data$/, replacement: path.resolve(here, "mocks/data.ts") },
      { find: /^@\//, replacement: `${src}/` },
      ...inherited,
    ];

    return viteConfig;
  },
};

export default config;
