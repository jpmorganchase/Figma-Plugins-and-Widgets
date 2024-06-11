/* eslint-env node */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@figma/figma-plugins/recommended",
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
  ignorePatterns: [".eslintrc.cjs"],
  parserOptions: {
    project: ["./tsconfig.json", "./__tests__/tsconfig.json"],
    tsconfigRootDir: __dirname, // important option
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
};
