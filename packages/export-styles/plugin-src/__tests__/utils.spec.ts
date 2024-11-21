import { describe, expect, test, vi } from "vitest";
import {
  camelize,
  color1To255,
  convertNaming,
  getHexStringFromFigmaColor,
  getRgbStringFromFigmaColor,
  trimDefaultEnding,
  exportVariables,
} from "../utils";

describe("camelize", () => {
  test("converts 2 words", () => {
    expect(camelize("Foo bar")).toEqual("fooBar");
  });
  test("converts parts with number", () => {
    expect(camelize("Foo 100 bar")).toEqual("foo100Bar");
  });
  test("convert full capital letters to lower case", () => {
    expect(camelize("ABC")).toEqual("abc");
  });
});

describe("convertNaming", () => {
  test("removes / from name", () => {
    expect(convertNaming("a/b/c")).toEqual("--a-b-c");
  });
  test("works when subsection contains space", () => {
    expect(convertNaming("a/ b /c")).toEqual("--a-b-c");
  });
  test("works with number", () => {
    expect(convertNaming("red / 100")).toEqual("--red-100");
  });
  test("converts to lower case", () => {
    expect(convertNaming("RED / 100")).toEqual("--red-100");
  });

  test("prefix is inserted", () => {
    expect(convertNaming("RED / 100", "foo-")).toEqual("--foo-red-100");
  });

  test("camel case multiple words in a single part", () => {
    expect(convertNaming("foo / border color / hover")).toEqual(
      "--foo-borderColor-hover"
    );
  });
});

describe("trimDefaultEnding", () => {
  test("removes default from the end", () => {
    expect(trimDefaultEnding("abc-def-default")).toEqual("abc-def");
  });
});

describe("color1To255", () => {
  test("0 to 0", () => {
    expect(color1To255(0)).toEqual(0);
  });
  test("1 to 255", () => {
    expect(color1To255(1)).toEqual(255);
  });
});

describe("getRgbStringFromFigmaColor", () => {
  test("converts 0,0,0", () => {
    expect(getRgbStringFromFigmaColor({ r: 0, g: 0, b: 0 } as RGB)).toEqual(
      "rgb(0, 0, 0)"
    );
  });
  test("converts 0.5,0.5,0.5", () => {
    expect(
      getRgbStringFromFigmaColor({ r: 0.5, g: 0.5, b: 0.5 } as RGB)
    ).toEqual("rgb(128, 128, 128)");
  });
  test("converts 0.5,0.5,0.5 1, drops alpha when 1", () => {
    expect(
      getRgbStringFromFigmaColor({ r: 0.5, g: 0.5, b: 0.5 } as RGB)
    ).toEqual("rgb(128, 128, 128)");
  });
  test("converts 0.5,0.5,0.5,0.5", () => {
    expect(
      getRgbStringFromFigmaColor({ r: 0.5, g: 0.5, b: 0.5 } as RGB, 0.5)
    ).toEqual("rgba(128, 128, 128, 0.5)");
  });
});

describe("getHexStringFromFigmaColor", () => {
  test("converts 0,0,0", () => {
    expect(getHexStringFromFigmaColor({ r: 0, g: 0, b: 0 } as RGB)).toEqual(
      "#000000"
    );
  });
  test("converts 0.5,0.5,0.5", () => {
    expect(
      getHexStringFromFigmaColor({ r: 0.5, g: 0.5, b: 0.5 } as RGB)
    ).toEqual("#808080");
  });
  test("converts 1,1,1", () => {
    expect(getHexStringFromFigmaColor({ r: 1, g: 1, b: 1 } as RGB)).toEqual(
      "#FFFFFF"
    );
  });
  test("converts 0.5,0.5,0.5,1, drops alpha when 1", () => {
    expect(
      getHexStringFromFigmaColor({ r: 0.5, g: 0.5, b: 0.5 } as RGB, 1)
    ).toEqual("#808080");
  });
  test("converts 0.5,0.5,0.5,0.5", () => {
    expect(
      getHexStringFromFigmaColor({ r: 0.5, g: 0.5, b: 0.5 } as RGB, 0.5)
    ).toEqual("#80808080");
  });
});

describe("exportVariables", () => {
  const testMode = { name: "Color", modeId: "1:1" };
  const testVariableCollection = {
    id: "VariableCollectionId:1:1",
    defaultModeId: "1:1",
    hiddenFromPublishing: false,
    key: "1234567890",
    modes: [testMode],
    name: "Colors",
    remote: false,
    variableIds: ["VariableId:1:1", "VariableId:1:2", "VariableId:1:3"],
  };
  test("returns null if modeId is not in collection", async () => {
    expect(
      await exportVariables(testVariableCollection, "invalid-mode", "")
    ).toBeNull();
  });

  // very simple test for now
  test("exports a nested JSON structure", async () => {
    const mockVariable1 = {
      id: "VariableId:1:1",
      name: "red/1000",
      resolvedType: "COLOR",
      valuesByMode: {
        "1:1": { r: 1, g: 0, b: 0, a: 1 },
      },
    } as any;
    const mockVariable2 = {
      id: "VariableId:1:2",
      name: "red/500",
      resolvedType: "COLOR",
      valuesByMode: {
        "1:1": { r: 0.5, g: 0, b: 0, a: 1 },
      },
    } as any;
    const mockVariable3 = {
      id: "VariableId:1:3",
      name: "alpha/red/500/50A",
      resolvedType: "COLOR",
      valuesByMode: {
        "1:1": { r: 0.5, g: 0, b: 0, a: 0.5 },
      },
    } as any;

    vi.spyOn(figma.variables, "getVariableByIdAsync").mockImplementation((id) =>
      Promise.resolve(
        id.endsWith("1")
          ? mockVariable1
          : id.endsWith("2")
          ? mockVariable2
          : mockVariable3
      )
    );
    const output = await exportVariables(testVariableCollection, "1:1", "");
    expect(output).toMatchObject({
      fileName: "Colors.Color.tokens.json",
      body: {
        red: {
          500: {
            $value: "#800000",
            $type: "color",
          },
          1000: {
            $value: "#ff0000",
            $type: "color",
          },
        },
        alpha: {
          red: {
            500: {
              // here is important, not 50-a
              "50a": {
                $value: "#80000080",
                $type: "color",
              },
            },
          },
        },
      },
    });
  });
});
