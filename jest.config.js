module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest']
    },
    automock: false,
    setupFiles: ['<rootDir>/test/setup.ts'],
    testMatch: ['**/test/**/*.test.ts'],
    verbose: true,
    moduleDirectories: ['node_modules', __dirname],
    collectCoverage: false,
    clearMocks: true,
    resetMocks: true
};
