module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    globalSetup: './global.setup.js',
    setupFilesAfterEnv: ['./jest.setup.js'],
    extensionsToTreatAsEsm: ['.ts'],
    collectCoverage: true,
    collectCoverageFrom: [
        './src/lib/*.ts',
        '!./src/lib/pdf-lib/*.ts',
        '!./src/lib/*.web.ts',
        '!./src/lib/alarms.ts',
        '!./src/lib/colors.ts',
        '!./src/lib/firestore.ts',
        '!./src/lib/harnessnation.ts',
        '!./src/lib/pedigree.ts',
    ],
    maxWorkers: 1,
    globals: {
        'ts-jest': {
            isolatedModules: true,
            useESM: true,
        },
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '([a-zA-Z_ ]+\\.html)\\?raw$': '$1.ts',
    },
    transformIgnorePatterns: [
        'node_modules/(?!pdf-lib)'
    ]
};