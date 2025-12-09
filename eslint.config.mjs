import js from '@eslint/js';
import nxPlugin from '@nx/eslint-plugin';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
<<<<<<< HEAD
=======
import globals from 'globals';
>>>>>>> 450f27c (style: добавлен eslint)

export default [
  // Базовые конфиги JavaScript
  js.configs.recommended,
  
  // Конфиги TypeScript
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.base.json',
      },
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
  
<<<<<<< HEAD
=======
  // КОНФИГ ДЛЯ NODE.JS ФАЙЛОВ - ДОБАВЬ ЭТО
  {
    files: ['**/webpack.config.js', '**/*.config.js', '**/*.config.cjs'],
    languageOptions: {
      globals: {
        ...globals.node, // Добавляет все глобальные переменные Node.js
      },
    },
  },
  
>>>>>>> 450f27c (style: добавлен eslint)
  // Конфиги Nx
  ...nxPlugin.configs['flat/base'],
  ...nxPlugin.configs['flat/typescript'],
  
  // Правило границ модулей Nx
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  
  // Игнорируемые файлы
  {
    ignores: [
      '**/*.spec.ts',
      '**/*.test.ts',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.nx/**',
    ],
  },
];