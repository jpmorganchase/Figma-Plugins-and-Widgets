import {
  readUISetting,
  sendUISettingToUI,
  setUiSetting,
} from "../../utils/clientStorage";

describe("sendUISettingToUI", () => {
  test("sends message to UI", () => {
    const postMessageSpy = jest.spyOn(figma.ui, "postMessage");
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
    jest.resetAllMocks();
  });
  test("default settings to false when first launch", async () => {
    jest.spyOn(figma.clientStorage, "keysAsync").mockResolvedValue([]);
    expect(await readUISetting()).toEqual({
      syncCsvHeader: false,
      autoPopulateCsvColumns: false,
    });
  });
  test("reads setting correctly when value set before", async () => {
    jest
      .spyOn(figma.clientStorage, "keysAsync")
      .mockResolvedValue(["SYNC_CSV_HEADER", "AUTO_POPULATE_CSV_COLUMNS"]);
    jest.spyOn(figma.clientStorage, "getAsync").mockResolvedValue(true);
    expect(await readUISetting()).toEqual({
      autoPopulateCsvColumns: true,
      syncCsvHeader: true,
    });
  });
});

describe("setUiSetting", () => {
  test("set setting correctly", async () => {
    const mockStore: any = {};
    jest
      .spyOn(figma.clientStorage, "setAsync")
      .mockImplementation(async (key, value) => {
        mockStore[key] = value;
      });
    await setUiSetting({ syncCsvHeader: false, autoPopulateCsvColumns: true });
    expect(mockStore).toEqual({
      SYNC_CSV_HEADER: false,
      AUTO_POPULATE_CSV_COLUMNS: true,
    });
  });
});
