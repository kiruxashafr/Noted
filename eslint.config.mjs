import js from "@eslint/js";
import nxPlugin from "@nx/eslint-plugin";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  // Базовые конфиги JavaScript
  js.configs.recommended,

  // Конфиги TypeScript
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.base.json",
      },
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  {
    files: ["**/webpack.config.js", "**/*.config.js", "**/*.config.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Конфиги Nx
  ...nxPlugin.configs["flat/base"],
  ...nxPlugin.configs["flat/typescript"],

  // Правило границ модулей Nx
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },

  // Игнорируемые файлы
  {
    ignores: ["**/*.spec.ts", "**/*.test.ts", "dist/**", "node_modules/**", "coverage/**", ".nx/**", "jest.preset.js",],
  },
];
