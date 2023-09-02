import { getPreferredTextInChild } from "../../utils/data-interface";
import { vi, test, expect, describe } from "vitest";

describe("getPreferredTextInChild", () => {
  test("returns empty string when no nested TextNode", () => {
    const actual = getPreferredTextInChild({ children: [] } as any);
    expect(actual).toBe("");
  });

  test("returns content when there is only one nested TextNode", () => {
    const actual = getPreferredTextInChild({
      children: [
        { type: "TEXT", visible: true, characters: "ABC", name: "Any" },
      ],
    } as any);
    expect(actual).toBe("ABC");
  });

  test("returns content with preferred name when there are more than one nested TextNode", () => {
    const actual = getPreferredTextInChild({
      children: [
        { type: "TEXT", visible: true, characters: "ABC", name: "Any" },
        { type: "TEXT", visible: true, characters: "XYZ", name: "Cell" },
      ],
    } as any);
    expect(actual).toBe("XYZ");
  });
});
