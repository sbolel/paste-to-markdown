import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const workspaceFiles = [
  "apps/web/**/*.{ts,tsx}",
  "packages/core/**/*.{ts,tsx}",
];

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**"],
  },
  js.configs.recommended,
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
      ...tseslint.configs.recommended.rules,
      "no-undef": "off",
    },
  },
];
