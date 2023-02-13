/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  moduleNameMapper: {
    ".+\\.(css|ttf|woff|woff2)$": "identity-obj-proxy",
    ".+\\.(svg|png|jpg)(\\?raw)?$": "<rootDir>/../jest/imageMock.js",
  },
};
