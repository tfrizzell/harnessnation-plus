// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
        files: ['**/*.{js,mjs,mts,ts}'],
        plugins: {
            '@stylistic': stylistic,
            'unused-imports': unusedImports,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                chrome: 'readonly',
            },
            parserOptions: {
                project: './tsconfig.eslint.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            /* @stylistic */
            '@stylistic/arrow-parens': ['error', 'as-needed'],
            '@stylistic/max-len': ['warn', {
                code: 100,
                tabWidth: 4,
                ignoreUrls: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
                ignoreComments: false,
            }],
            '@stylistic/newline-per-chained-call': ['error', {
                ignoreChainWithDepth: 3,
            }],
            /* @typescript-eslint */
            '@typescript-eslint/array-type': ['error', {
                default: 'generic'
            }],
            '@typescript-eslint/consistent-type-assertions': ['error', {
                assertionStyle: 'as',
                objectLiteralTypeAssertions: 'never',
            }],
            '@typescript-eslint/no-confusing-void-expression': ['error', {
                ignoreArrowShorthand: true
            }],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-readonly-parameter-types': 'off',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
            /* eslint-plugin-unused-imports */
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': ['warn', {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            }],
        },
    },
    {
        ignores: [
            'coverage/**/*',
            'dist/**/*',
            'node_modules/**/*',
            'src/vendor/**/*',
            'eslint.config.js',
            'global.setup.ts',
            'gulpfile.mjs',
            'jest.config.ts',
            'jest.setup.ts',
        ],
    },
);