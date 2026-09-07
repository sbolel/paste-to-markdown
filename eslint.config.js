import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

const workspaceFiles = [
  "apps/web/**/*.{ts,tsx}",
  "packages/core/**/*.{ts,tsx}",
];

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**"],
  },
  {
    files: ["apps/web/scripts/**/*.mjs", "scripts/check-pages-artifact.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: js.configs.recommended.rules,
  },
  {
    files: workspaceFiles,
    languageOptions: {
      parser: tsParser,
      globals: {
        clearTimeout: "readonly",
        document: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "no-undef": "off",
    },
  },
];
