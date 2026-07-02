// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        globalSetup: './global.setup.ts',
        setupFiles: ['./vitest.setup.ts'],
        clearMocks: true,
        restoreMocks: true,
        exclude: [
            '**/node_modules/**',
            '**/tests/mocks/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/lib/*.ts'],
            exclude: [

                'src/lib/pdf-lib/*.ts',
                'src/lib/*.web.ts',
                'src/lib/alarms.ts',
                'src/lib/colors.ts',
                'src/lib/firestore.ts',
                'src/lib/harnessnation.ts',
                'src/lib/pedigree.ts',
            ]
        },
        // moduleNameMapper: {
        //     '^@mocks/(.*)$': '<rootDir>/tests/mocks/$1',
        //     '^@src/(.*)$': '<rootDir>/src/$1',
        //     '^(\\.{1,2}/.*)\\.js$': '$1',
        //     '([a-zA-Z_ ]+\\.html)\\?raw$': '$1.ts',
        // },
    },
});