import { DEFAULT_HEADING_SETTINGS } from "../utils";
import { CsvExportSettings } from "../processors/iterate";
import { csvTextNodeProcess } from "../processors/csvProcessor";

describe("csvTextNodeProcess", () => {
  const pageName = "page_name";
  const EXPORT_SETTINGS: CsvExportSettings = {
    ...DEFAULT_HEADING_SETTINGS,
    topLvlNodeName: pageName,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns empty array when text layer contains no character", () => {
    jest.spyOn(figma, "createText").mockImplementation(
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
      jest.spyOn(figma, "createText").mockImplementation(
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
      jest.spyOn(figma, "createText").mockImplementation(
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
  test.todo("dollar prefix of id is removed in the returned map");
});

describe("csvTextNodeUpdater", () => {
  test.todo(
    "replaces characters with characters column when selectedLang is Default"
  );
  test.todo("replaces characters with lang column when selectedLang is lang");
  test.todo(
    "replaces characters with characters column when selectedLang is lang and lang column is empty"
  );
});
