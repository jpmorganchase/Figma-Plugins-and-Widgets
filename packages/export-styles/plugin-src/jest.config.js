/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    // Below matches default jest transform (from --debug)
    // or a second transform would be applied and tsconfig would be overridden
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "plugin-src/__tests__/tsconfig.json",
      },
    ],
  },
};
