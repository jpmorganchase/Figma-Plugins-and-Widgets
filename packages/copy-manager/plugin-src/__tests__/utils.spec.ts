import { getHeadingLevelNumber, HeadingSettings } from "../utils";

describe("getHeadingLevelNumber", () => {
  const headingSetting: HeadingSettings = { h1: 50, h2: 32, h3: 24, h4: 16 };
  test("body test returns 0", () => {
    const result = getHeadingLevelNumber(14, headingSetting);
    expect(result).toBe(0);
  });
});

test("figma component resize api mock", () => {
  const component = figma.createComponent();
  component.resize(100, 100);
  expect(component.width).toEqual(100);
  expect(component.height).toEqual(100);
});
