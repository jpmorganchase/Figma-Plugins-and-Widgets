import { describe, expect, test } from "vitest";
import { updateApiResponse, toCamelCase } from "../modifyData";

describe("toCamelCase", () => {
  test("make camel cases", () => {
    expect(toCamelCase("Corner Radius")).toEqual("cornerRadius");
  });
});

describe("updateApiResponse", () => {
  test("filter out remote collections and variables", () => {
    const input = {
      variableCollections: {
        "VariableCollectionId:1": {
          defaultModeId: "1:0",
          id: "VariableCollectionId:1",
          name: "Remote collection",
          remote: true,
          modes: [{ modeId: "1:0", name: "Mode" }],
          key: "123456",
          hiddenFromPublishing: true,
          variableIds: ["VariableID:1"],
        },
        "VariableCollectionId:2": {
          defaultModeId: "2:0",
          id: "VariableCollectionId:2",
          name: "Local collection",
          remote: false,
          modes: [{ modeId: "2:0", name: "Mode" }],
          key: "223456",
          hiddenFromPublishing: false,
          variableIds: ["VariableID:2"],
        },
      },
      variables: {
        "VariableID:1": {
          id: "VariableID:1",
          name: "Color 1",
          remote: true,
          key: "09876",
          variableCollectionId: "VariableCollectionId:1",
          resolvedType: "COLOR",
          description: "",
          hiddenFromPublishing: true,
          valuesByMode: {
            "1:0": {
              r: 1,
              g: 1,
              b: 1,
              a: 1,
            },
          },
          scopes: ["ALL_SCOPES"],
          codeSyntax: {},
        },
        "VariableID:2": {
          id: "VariableID:2",
          name: "Color",
          remote: false,
          key: "98766",
          variableCollectionId: "VariableCollectionId:2",
          resolvedType: "COLOR",
          description: "",
          hiddenFromPublishing: false,
          valuesByMode: {
            "1:0": {
              r: 1,
              g: 1,
              b: 1,
              a: 1,
            },
          },
          scopes: ["ALL_SCOPES"],
          codeSyntax: {},
        },
      },
    } as const;
    expect(
      Object.values(input.variableCollections).every((c) => c.remote === false)
    ).toBeFalsy();
    expect(
      Object.values(input.variables).every((c) => c.remote === false)
    ).toBeFalsy();

    const output = updateApiResponse(input);
    expect(
      Object.values(output.variableCollections).every((c) => c.remote === false)
    ).toBeTruthy();
    expect(
      Object.values(output.variables).every((c) => c.remote === false)
    ).toBeTruthy();
  });
  test("append default to variable name when used as group name, but only in the same collection", () => {
    const input = {
      variableCollections: {
        "VariableCollectionId:1": {
          defaultModeId: "1:0",
          id: "VariableCollectionId:1",
          name: "Remote collection",
          remote: true,
          modes: [{ modeId: "1:0", name: "Mode" }],
          key: "123456",
          hiddenFromPublishing: true,
          variableIds: ["VariableID:1", "VariableID:2"],
        },
        "VariableCollectionId:2": {
          defaultModeId: "2:0",
          id: "VariableCollectionId:2",
          name: "Local collection",
          remote: false,
          modes: [{ modeId: "2:0", name: "Mode" }],
          key: "223456",
          hiddenFromPublishing: false,
          variableIds: ["VariableID:3"],
        },
      },
      variables: {
        "VariableID:1": {
          id: "VariableID:1",
          name: "Color",
          remote: false,
          key: "09876",
          variableCollectionId: "VariableCollectionId:1",
          resolvedType: "COLOR",
          description: "",
          hiddenFromPublishing: false,
          valuesByMode: {
            "1:0": {
              r: 1,
              g: 1,
              b: 1,
              a: 1,
            },
          },
          scopes: ["ALL_SCOPES"],
          codeSyntax: {},
        },
        "VariableID:2": {
          id: "VariableID:2",
          name: "Color/100",
          remote: false,
          key: "98766",
          variableCollectionId: "VariableCollectionId:1",
          resolvedType: "COLOR",
          description: "",
          hiddenFromPublishing: false,
          valuesByMode: {
            "1:0": {
              r: 1,
              g: 1,
              b: 1,
              a: 1,
            },
          },
          scopes: ["ALL_SCOPES"],
          codeSyntax: {},
        },
        "VariableID:3": {
          id: "VariableID:3",
          name: "Color",
          remote: false,
          key: "98766",
          variableCollectionId: "VariableCollectionId:2",
          resolvedType: "COLOR",
          description: "",
          hiddenFromPublishing: false,
          valuesByMode: {
            "1:0": {
              r: 1,
              g: 1,
              b: 1,
              a: 1,
            },
          },
          scopes: ["ALL_SCOPES"],
          codeSyntax: {},
        },
      },
    } as const;
    expect(input.variables["VariableID:1"].variableCollectionId).toEqual(
      input.variables["VariableID:2"].variableCollectionId
    );
    expect(
      input.variables["VariableID:2"].name.startsWith(
        input.variables["VariableID:1"].name
      )
    ).toBeTruthy();
    expect(input.variables["VariableID:3"].variableCollectionId).not.toEqual(
      input.variables["VariableID:2"].variableCollectionId
    );
    expect(
      input.variables["VariableID:2"].name.startsWith(
        input.variables["VariableID:3"].name
      )
    ).toBeTruthy();

    const output = updateApiResponse(input, { addDefault: true });
    expect(output.variables["VariableID:1"].name).toEqual("Color/default");
    expect(output.variables["VariableID:3"].name).not.toEqual("Color/default");
  });
});
