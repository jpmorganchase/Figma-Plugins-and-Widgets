import { PostToFigmaMessage, PostToUIMessage } from "../shared-src";
import {
  readUISetting,
  sendUISettingToUI,
  setUiSetting,
} from "./utils/clientStorage";
import { getComponentDisplayName, loadLocalComponent } from "./utils/component";
import {
  readDataForUiTable,
  writeDataFromUiTable,
} from "./utils/data-interface";
import { generateTable, updateTable } from "./utils/generate-table";
import {
  getComponentFromSelection,
  getValidTableFromSelection,
} from "./utils/guard";
import { readConfigFromPluginData } from "./utils/pluginData";

let notifyHandler: NotificationHandler | null;

const MIN_WIDTH = 340;
const MIN_HEIGHT = 340;

figma.showUI(
  `${__html__}<script>const __FIGMA_COMMAND__='${
    // This is used by the UI to toggle default view on load
    typeof figma.command === "undefined" ? "" : figma.command
  }';</script>`,
  {
    themeColors: true,
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
  }
);

figma.on("selectionchange", () => {
  detectGridSelection();
});

figma.ui.onmessage = async (msg: PostToFigmaMessage) => {
  try {
    switch (msg.type) {
      case "ui-finish-loading": {
        loadLocalComponent();
        detectGridSelection();
        break;
      }
      case "resize-window": {
        const { width, height } = msg;
        figma.ui.resize(
          Math.max(width, MIN_WIDTH),
          Math.max(height, MIN_HEIGHT)
        );
        break;
      }
      case "set-table-header-cell": {
        const comp = getComponentFromSelection(notify);
        if (comp) {
          figma.ui.postMessage({
            type: "update-header-cell",
            cell: {
              name: getComponentDisplayName(comp),
              key: comp.key,
            },
          } satisfies PostToUIMessage);
        }
        break;
      }
      case "set-table-body-cell": {
        const comp = getComponentFromSelection(notify);
        if (comp) {
          figma.ui.postMessage({
            type: "update-body-cell",
            cell: {
              name: getComponentDisplayName(comp),
              key: comp.key,
            },
          } satisfies PostToUIMessage);
        }
        break;
      }
      case "generate-table": {
        const { config } = msg;
        const table = await generateTable(config);
        if (table) {
          notify("Table created");
        } else {
          notify("Error creating table", { error: true });
        }
        break;
      }
      case "update-table": {
        console.log(msg);
        const { config } = msg;
        const table = await updateTable(config);
        if (table) {
          notify("Table updated");
        } else {
          notify("Error updating table", { error: true });
        }
        break;
      }
      case "read-table-data": {
        const table = getValidTableFromSelection(notify);
        if (table) {
          const data = readDataForUiTable(table);
          figma.ui.postMessage({
            type: "read-table-data-result",
            data,
          } satisfies PostToUIMessage);
        } else {
          notify("Error reading table data", { error: true });
        }
        break;
      }
      case "set-table-data": {
        console.log(msg);
        const table = getValidTableFromSelection(notify);
        if (table) {
          await writeDataFromUiTable(table, msg.data);
        } else {
          notify("Error updating table data", { error: true });
        }
        break;
      }
      case "read-data-table-setting": {
        sendUISettingToUI(await readUISetting());
        break;
      }
      case "set-data-table-setting": {
        const { setting } = msg;
        await setUiSetting(setting);
        sendUISettingToUI(await readUISetting());
        break;
      }
      default: {
        console.error("Unimplemented onmessage type:", (msg as any).type);
      }
    }
  } catch (e) {
    notify((e as any).message, { error: true });
  }
};

function notify(message: string, options?: NotificationOptions) {
  notifyHandler?.cancel();
  notifyHandler = figma.notify(message, options);
}

function detectGridSelection() {
  const validatedTable = getValidTableFromSelection();
  if (validatedTable) {
    // TODO: clean up readConfigFromPluginData was already called in `getValidTableFromSelection`
    const tableConfig = readConfigFromPluginData(validatedTable);
    figma.ui.postMessage({
      type: "full-config-updated",
      config: tableConfig,
    } satisfies PostToUIMessage);

    if (tableConfig) {
      const data = readDataForUiTable(validatedTable);
      figma.ui.postMessage({
        type: "read-table-data-result",
        data,
      } satisfies PostToUIMessage);
    }
  } else {
    figma.ui.postMessage({
      type: "full-config-updated",
      config: null,
    } satisfies PostToUIMessage);
  }
}
