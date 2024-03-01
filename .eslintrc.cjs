/* eslint-env node */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@figma/figma-plugins/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./packages/**/tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  root: true,
  ignorePatterns: [
    "**/dist/*.js",
    "vitest/**/*.ts",
    "**/vitest.workspace.ts",
    "**/vite.config.ts",
    ".eslintrc.cjs",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": 1,
    "@typescript-eslint/no-floating-promises": ["error"],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn", // or "error"
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },
};
