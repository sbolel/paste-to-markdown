import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      "@paste-to-markdown/core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url),
      ),
    },
  },
  test: { include: ["tests/unit/**/*.test.{ts,tsx}"], environment: "jsdom" },
});
