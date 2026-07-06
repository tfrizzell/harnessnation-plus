// @ts-check
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Globals} */
const browserGlobals = {
    ...globals.browser,
    chrome: 'readonly',
};

/** @type {Record<string, import('eslint').ESLint.Plugin>} */
const plugins = {
    '@stylistic': stylistic,
    'unused-imports': unusedImports,
};

/** @type {import('eslint').Linter.RulesRecord} */
const stylisticRules = {
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
};

/** @type {import('eslint').Linter.RulesRecord} */
const unusedImportsRules = {
    'unused-imports/no-unused-imports': 'error',
};

export default defineConfig(
    {
        files: ['**/*.{ts,mts}'],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
        ],
        plugins,
        languageOptions: {
            globals: browserGlobals,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            ...stylisticRules,
            ...unusedImportsRules,

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
            '@typescript-eslint/restrict-template-expressions': ['error', {
                'allowBoolean': true,
                'allowNumber': true,
                'allowNullish': true
            }],
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
        },
    },
    {
        files: ['**/*.{js,mjs}'],
        extends: [js.configs.recommended],
        plugins,
        languageOptions: { globals: browserGlobals },
        rules: {
            ...stylisticRules,
            ...unusedImportsRules,
        },
    },
    {
        ignores: [
            'coverage/**/*',
            'dist/**/*',
            'node_modules/**/*',
            'src/vendor/**/*',
            'eslint.config.js',
        ],
    },
);