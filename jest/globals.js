class ComponentNode {
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

global.figma = {
  ui: {
    postMessage: jest.fn(),
  },
  clientStorage: {
    keysAsync: jest.fn(),
    getAsync: jest.fn(),
    setAsync: jest.fn(),
  },
  createComponent: () => new ComponentNode(),
  createText: jest.fn(),
};
