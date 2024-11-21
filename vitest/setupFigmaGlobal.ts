import { vi, beforeAll } from "vitest";

class ComponentNode {
  height: number;
  width: number;

  constructor() {
    this.height = 0;
    this.width = 0;
  }

  // Getter
  //   get area() {
  //     return this.calcArea();
  //   }
  // Method
  resize(width, height) {
    this.width = width;
    this.height = height;
  }
}

beforeAll(() => {
  global.figma = {
    ui: {
      postMessage: vi.fn(),
    },
    clientStorage: {
      keysAsync: vi.fn(),
      getAsync: vi.fn(),
      setAsync: vi.fn(),
    },
    createComponent: () => new ComponentNode(),
    createText: vi.fn(),
    variables: {
      getVariableByIdAsync: vi.fn(),
    },
  };
});
