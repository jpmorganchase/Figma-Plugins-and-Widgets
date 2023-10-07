import { defineWorkspace } from "vitest/config";

// defineWorkspace provides a nice type hinting DX
export default defineWorkspace([
  {
    // add "extends" to merge two configs together
    extends: "./vite.config.ts",
    test: {
      name: "UI",
      environment: "jsdom", // or 'happy-dom', 'node'
      setupFiles: ["./setupTest.ts"],
    },
  },
  {
    test: {
      include: ["plugin-src/__tests__/**/*.{spec,test}.{ts,js}"],
      name: "Figma",
      environment: "node",
      setupFiles: ["../../vitest/setupFigmaGlobal.ts"],
    },
  },
]);
