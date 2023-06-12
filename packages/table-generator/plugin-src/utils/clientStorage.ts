import { PostToUIMessage, UISetting } from "../../shared-src";

const SYNC_CSV_HEADER_KEY = "SYNC_CSV_HEADER";
const AUTO_POPULATE_CSV_COLUMNS_KEY = "AUTO_POPULATE_CSV_COLUMNS";

export function sendUISettingToUI(setting: UISetting) {
  figma.ui.postMessage({
    type: "read-data-table-setting-result",
    setting,
  } satisfies PostToUIMessage);
}

export async function readUISetting(): Promise<UISetting> {
  const availableKeys = await figma.clientStorage.keysAsync();

  // Default to false
  return {
    syncCsvHeader: availableKeys.includes(SYNC_CSV_HEADER_KEY)
      ? await figma.clientStorage.getAsync(SYNC_CSV_HEADER_KEY)
      : false,
    autoPopulateCsvColumns: availableKeys.includes(
      AUTO_POPULATE_CSV_COLUMNS_KEY
    )
      ? await figma.clientStorage.getAsync(AUTO_POPULATE_CSV_COLUMNS_KEY)
      : false,
  };
}

export async function setUiSetting(config: UISetting) {
  await figma.clientStorage.setAsync(SYNC_CSV_HEADER_KEY, config.syncCsvHeader);
  await figma.clientStorage.setAsync(
    AUTO_POPULATE_CSV_COLUMNS_KEY,
    config.autoPopulateCsvColumns
  );
}
