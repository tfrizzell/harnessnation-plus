// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';

export default defineConfig(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked, 
    {
        files: [ '**/*.{js,mjs,mts,ts}' ],
        plugins: {
            'unused-imports': unusedImports,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                browser: 'readonly',
                chrome: 'readonly',
            },
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_'
                }
            ],
        },
    },
    {
        ignores: [
            'dist/*',
            'node_modules/*',
            'src/vendor/*',
            'eslint.config.js',
            'gulpfile.mjs',
        ],
    },
);