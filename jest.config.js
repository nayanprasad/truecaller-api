export default {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  // Setup test environment
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  // Exclude paths
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/"],
  // Coverage configuration
  collectCoverageFrom: ["src/**/*.ts", "!src/**/index.ts"],
};
