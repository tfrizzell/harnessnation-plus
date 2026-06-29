// jest.config.ts
import type { Config } from 'jest';

export default <Config>{
    testEnvironment: 'jsdom',
    globalSetup: '<rootDir>/global.setup.ts',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    extensionsToTreatAsEsm: ['.ts'],
    testPathIgnorePatterns: [
        '<rootDir>/tests/mocks/',
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/lib/*.ts',
        '!<rootDir>/src/lib/pdf-lib/*.ts',
        '!<rootDir>/src/lib/*.web.ts',
        '!<rootDir>/src/lib/alarms.ts',
        '!<rootDir>/src/lib/colors.ts',
        '!<rootDir>/src/lib/firestore.ts',
        '!<rootDir>/src/lib/harnessnation.ts',
        '!<rootDir>/src/lib/pedigree.ts',
    ],
    maxWorkers: 1,
    transform: {
        '^.+\\.[jt]sx?$': ['@swc/jest', {
            jsc: {
                parser: {
                    syntax: 'typescript',
                    tsx: false,
                    decorators: true,
                },
                target: 'es2020',
            },
        }],
    },
    transformIgnorePatterns: [
        'node_modules/(?!pdf-lib)'
    ],
    moduleNameMapper: {
        '^@mocks/(.*)$': '<rootDir>/tests/mocks/$1',
        '^@src/(.*)$': '<rootDir>/src/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '([a-zA-Z_ ]+\\.html)\\?raw$': '$1.ts',
    },
};