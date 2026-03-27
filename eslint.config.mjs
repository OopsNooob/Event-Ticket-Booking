import typescriptEslintParser from "@typescript-eslint/parser";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import nextEslintPlugin from "@next/eslint-plugin-next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [".next/**", "node_modules/**", "convex/_generated/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      "@next/next": nextEslintPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      ...nextEslintPlugin.configs.recommended.rules,
    },
  },
];