// eslint.config.mjs
import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  {
    ignores: [
      "**/dist",
      "**/node_modules",
      "**/coverage",
      "**/.nx",
      "**/tmp",
      "eslint.config.*", // Исправлено - убрали .js
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier: prettier,
    },
    rules: {
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
  {
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.base.json", // Добавьте путь к вашему tsconfig
        },
      },
    },
    rules: {
      "import/no-self-import": "error",
      "import/no-duplicates": "error",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "import/newline-after-import": ["error", { count: 1 }],
      "@typescript-eslint/no-explicit-any": [
        "warn", // Изменил с error на warn для гибкости
        { ignoreRestArgs: true },
      ],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "type"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: "@nestjs/**",
              group: "external",
              position: "before",
            },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  {
    files: ["apps/athena-api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/require-await": "warn",
    },
  },
  {
    files: ["apps/*/src/main.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "**/*.e2e-spec.ts", "**/*.e2e-test.ts"],
    rules: {
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-*": "off",
      "no-console": "off",
    },
  },
);
