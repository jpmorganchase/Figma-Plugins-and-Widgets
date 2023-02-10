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
  createComponent: () => new ComponentNode(),
  createText: jest.fn(),
};
