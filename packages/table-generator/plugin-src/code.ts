import { ParseResult } from "papaparse";
import { PostToFigmaMessage, PostToUIMessage } from "../shared-src";
import { getComponentFromSelection } from "./utils/guard";
import { PLUGIN_RELAUNCH_KEY_EDIT_TABLE } from "./utils/pluginData";

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

figma.ui.onmessage = async (msg: PostToFigmaMessage) => {
  switch (msg.type) {
    case "ui-finish-loading": {
      break;
    }
    case "resize-window": {
      const { width, height } = msg;
      figma.ui.resize(Math.max(width, MIN_WIDTH), Math.max(height, MIN_HEIGHT));
      break;
    }
    case "set-table-header-cell": {
      const comp = getComponentFromSelection(notify);
      if (comp) {
        figma.ui.postMessage({
          type: "update-header-cell",
          cell: {
            name: comp.name,
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
            name: comp.name,
            key: comp.key,
          },
        } satisfies PostToUIMessage);
      }
      break;
    }
    default: {
      console.error("Unimplemented onmessage type:", msg.type);
    }
  }
};

function notify(message: string, options?: NotificationOptions) {
  notifyHandler?.cancel();
  notifyHandler = figma.notify(message, options);
}
