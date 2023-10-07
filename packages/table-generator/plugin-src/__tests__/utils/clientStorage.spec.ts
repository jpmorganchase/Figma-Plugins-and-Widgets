import {
  readUISetting,
  sendUISettingToUI,
  setUiSetting,
} from "../../utils/clientStorage";
import { vi, test, expect, describe, afterEach } from "vitest";

describe("sendUISettingToUI", () => {
  test("sends message to UI", () => {
    const postMessageSpy = vi.spyOn(figma.ui, "postMessage");
    const testSetting = {
      syncCsvHeader: true,
      autoPopulateCsvColumns: true,
    };
    sendUISettingToUI(testSetting);
    expect(postMessageSpy).toBeCalledWith(
      expect.objectContaining({
        setting: testSetting,
        type: "read-data-table-setting-result",
      })
    );
  });
});

describe("readUISetting", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });
  test("default settings to false when first launch", async () => {
    vi.spyOn(figma.clientStorage, "keysAsync").mockResolvedValue([]);
    expect(await readUISetting()).toEqual({
      syncCsvHeader: false,
      autoPopulateCsvColumns: false,
    });
  });
  test("reads setting correctly when value set before", async () => {
    vi.spyOn(figma.clientStorage, "keysAsync").mockResolvedValue([
      "SYNC_CSV_HEADER",
      "AUTO_POPULATE_CSV_COLUMNS",
    ]);
    vi.spyOn(figma.clientStorage, "getAsync").mockResolvedValue(true);
    expect(await readUISetting()).toEqual({
      autoPopulateCsvColumns: true,
      syncCsvHeader: true,
    });
  });
});

describe("setUiSetting", () => {
  test("set setting correctly", async () => {
    const mockStore: any = {};
    vi.spyOn(figma.clientStorage, "setAsync").mockImplementation(
      async (key, value) => {
        mockStore[key] = value;
      }
    );
    await setUiSetting({ syncCsvHeader: false, autoPopulateCsvColumns: true });
    expect(mockStore).toEqual({
      SYNC_CSV_HEADER: false,
      AUTO_POPULATE_CSV_COLUMNS: true,
    });
  });
});
