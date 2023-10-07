import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { csvTextNodeProcess, getNodeInfoMap } from "../processors/csvProcessor";
import { CsvExportSettings } from "../processors/iterate";
import { DEFAULT_HEADING_SETTINGS } from "../utils";

describe("csvTextNodeProcess", () => {
  const pageName = "page_name";
  const EXPORT_SETTINGS: CsvExportSettings = {
    ...DEFAULT_HEADING_SETTINGS,
    topLvlNodeName: pageName,
  };
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  test("returns empty array when text layer contains no character", () => {
    vi.spyOn(figma, "createText").mockImplementation(
      () =>
        ({
          type: "TEXT",
          characters: "",
        } as any)
    );
    const textNode = figma.createText();
    textNode.characters = "";
    const result = csvTextNodeProcess(textNode, EXPORT_SETTINGS);
    expect(result).toEqual([]);
  });
  describe("when text layer contains characters", () => {
    test("returns single nodeInfo, with correct fields", () => {
      const listOption = "ORDERED";
      const characters = "abc";
      const nodeName = "name";
      const nodeId = "123:12";
      vi.spyOn(figma, "createText").mockImplementation(
        () =>
          ({
            type: "TEXT",
            id: nodeId,
            name: nodeName,
            characters,
            getRangeListOptions: () => ({
              type: listOption,
            }),
            getRangeFontSize: () => 14,
          } as any)
      );
      const textNode = figma.createText();
      const result = csvTextNodeProcess(textNode, EXPORT_SETTINGS);
      expect(result.length).toBe(1);
      const nodeInfo = result[0];
      // id needs to be prefixed with $, so Excel will not interpret as time
      expect(nodeInfo.id).toEqual("$" + nodeId);
      expect(nodeInfo.page).toEqual(pageName);
      expect(nodeInfo.name).toEqual(nodeName);
      expect(nodeInfo.characters).toEqual(characters);
      expect(nodeInfo.listOption).toEqual(listOption);
      expect(nodeInfo.headingLevel).toEqual("0");
    });
    test("nodeInfo name truncated if longer than 20 characters", () => {
      const listOption = "ORDERED";
      const characters = "abc";
      const nodeName = "names12345678901234567890";
      const nodeId = "123:12";
      vi.spyOn(figma, "createText").mockImplementation(
        () =>
          ({
            type: "TEXT",
            id: nodeId,
            name: nodeName,
            characters,
            getRangeListOptions: () => ({
              type: listOption,
            }),
            getRangeFontSize: () => 14,
          } as any)
      );
      const textNode = figma.createText();
      const result = csvTextNodeProcess(textNode, EXPORT_SETTINGS);
      expect(result.length).toBe(1);
      const nodeInfo = result[0];
      expect(nodeInfo.name).toEqual("names123456789012345...");
    });
  });
});

describe("getNodeInfoMap", () => {
  test("dollar prefix of id is removed in the returned map", () => {
    const actual = getNodeInfoMap([
      {
        id: `$1.1`,
        page: "page 1",
        name: "Node 1",
        characters: "ABC",
        listOption: "NONE",
        headingLevel: "0",
      },
    ]);
    expect(actual).toEqual({
      "1.1": {
        id: `1.1`,
        page: "page 1",
        name: "Node 1",
        characters: "ABC",
        listOption: "NONE",
        headingLevel: "0",
      },
    });
  });
});

describe("csvTextNodeUpdater", () => {
  // Maybe test `getCharToUse` directly instead, less figma mock
  test.todo(
    "replaces characters with characters column when selectedLang is Default"
  );
  test.todo("replaces characters with lang column when selectedLang is lang");
  test.todo(
    "replaces characters with characters column when selectedLang is lang and lang column is empty"
  );
});
