import { ParseResult } from "papaparse";
import { PostToFigmaMessage, PostToUIMessage } from "../shared-src";
import { getComponentDisplayName, loadLocalComponent } from "./utils/component";
import {
  getComponentFromSelection,
  getValidTableFromSelection,
} from "./utils/guard";
import {
  PLUGIN_RELAUNCH_KEY_EDIT_TABLE,
  readConfigFromPluginData,
} from "./utils/pluginData";
import { generateTable } from "./utils/generate-table";
import { readDataForUiTable } from "./utils/data-interface";

let notifyHandler: NotificationHandler | null;

const MIN_WIDTH = 340;
const MIN_HEIGHT = 340;

figma.showUI(__html__, {
  themeColors: true,
  height: MIN_HEIGHT,
  width: MIN_WIDTH,
});

if (figma.command) {
  // Relaunching from relaunch button
  switch (figma.command) {
    case PLUGIN_RELAUNCH_KEY_EDIT_TABLE: {
      notify("Relaunched! Not yet implemented");
      break;
    }
    default:
      notify(`Unknown figma command: ${figma.command}`, { error: true });
  }
}

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
        }
        break;
      }
      default: {
        console.error("Unimplemented onmessage type:", (msg as any).type);
      }
    }
  } catch (e) {
    notify(e as any, { error: true });
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
    if (tableConfig) {
      figma.ui.postMessage({
        type: "full-config-updated",
        config: tableConfig,
      } satisfies PostToUIMessage);

      const data = readDataForUiTable(validatedTable);
      figma.ui.postMessage({
        type: "read-table-data-result",
        data,
      } satisfies PostToUIMessage);
    }
  }
}
