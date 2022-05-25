module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    globalSetup: './global.setup.js',
    setupFilesAfterEnv: ['./jest.setup.js'],
    extensionsToTreatAsEsm: ['.ts'],
    globals: {
        'ts-jest': {
            useESM: true,
        },
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '([a-zA-Z_ ]+\\.html)\\?raw$': '$1.ts',
    },
};